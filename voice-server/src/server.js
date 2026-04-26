import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { WebSocketServer } from 'ws';
import { transcribeAudio, createTutorReply, textToSpeech } from './openai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(ROOT, 'tmp');
await fs.mkdir(TMP, { recursive: true });

const PORT = Number(process.env.PORT || 8787);
const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES || 6_000_000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin || allowedOrigins.includes('*')) return true;
  return allowedOrigins.includes(origin);
}

const app = express();
app.use(cors({ origin: (origin, cb) => cb(null, isOriginAllowed(origin)) }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(ROOT, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'csle-voice-realtime-server', ts: new Date().toISOString() });
});

const upload = multer({
  storage: multer.diskStorage({
    destination: TMP,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}-${file.originalname || 'audio.webm'}`),
  }),
  limits: { fileSize: MAX_AUDIO_BYTES },
});

app.post('/api/voice-turn', upload.single('audio'), async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) return res.status(400).json({ error: 'audio file is required' });

  try {
    const transcript = await transcribeAudio(filePath, {
      language: req.body.language || 'en',
      prompt: req.body.prompt || 'English learning app. Transcribe learner speech accurately.',
    });
    const tutor = await createTutorReply({
      transcript,
      userName: req.body.userName || 'aluno',
      mode: req.body.mode || 'conversation',
    });
    const speech = await textToSpeech(`${tutor.reply} ${tutor.nextPrompt}`);
    res.json({
      transcript,
      ...tutor,
      audioBase64: speech.toString('base64'),
      audioMime: 'audio/mpeg',
    });
  } catch (err) {
    console.error('[voice-turn]', err);
    res.status(500).json({ error: err.message || 'voice turn failed' });
  } finally {
    if (filePath) fs.rm(filePath, { force: true }).catch(() => {});
  }
});

const server = app.listen(PORT, () => {
  console.log(`CSLE Voice Server listening on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/voice' });

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

wss.on('connection', (ws, req) => {
  if (!isOriginAllowed(req.headers.origin)) {
    ws.close(1008, 'Origin not allowed');
    return;
  }

  const session = {
    id: crypto.randomUUID(),
    chunks: [],
    bytes: 0,
    meta: { userName: 'aluno', language: 'en', mode: 'conversation' },
  };

  send(ws, { type: 'ready', sessionId: session.id, message: 'Voice session ready' });

  ws.on('message', async (data, isBinary) => {
    try {
      if (isBinary) {
        const buf = Buffer.from(data);
        session.bytes += buf.byteLength;
        if (session.bytes > MAX_AUDIO_BYTES) {
          send(ws, { type: 'error', error: 'Audio too large. Commit shorter turns.' });
          session.chunks = [];
          session.bytes = 0;
          return;
        }
        session.chunks.push(buf);
        send(ws, { type: 'audio_chunk_received', bytes: session.bytes });
        return;
      }

      const msg = JSON.parse(data.toString());
      if (msg.type === 'start') {
        session.chunks = [];
        session.bytes = 0;
        session.meta = { ...session.meta, ...(msg.meta || {}) };
        send(ws, { type: 'started', sessionId: session.id });
        return;
      }

      if (msg.type === 'commit') {
        if (!session.chunks.length) {
          send(ws, { type: 'error', error: 'No audio chunks received' });
          return;
        }
        send(ws, { type: 'processing' });
        const filePath = path.join(TMP, `${session.id}-${Date.now()}.webm`);
        await fs.writeFile(filePath, Buffer.concat(session.chunks));
        session.chunks = [];
        session.bytes = 0;

        try {
          const transcript = await transcribeAudio(filePath, {
            language: session.meta.language || 'en',
            prompt: 'English learning app. Transcribe learner speech accurately.',
          });
          send(ws, { type: 'transcript', transcript });

          const tutor = await createTutorReply({
            transcript,
            userName: session.meta.userName || 'aluno',
            mode: session.meta.mode || 'conversation',
          });
          send(ws, { type: 'tutor', ...tutor });

          const speech = await textToSpeech(`${tutor.reply} ${tutor.nextPrompt}`);
          send(ws, {
            type: 'audio',
            mime: 'audio/mpeg',
            base64: speech.toString('base64'),
          });
          send(ws, { type: 'done' });
        } finally {
          await fs.rm(filePath, { force: true }).catch(() => {});
        }
        return;
      }

      if (msg.type === 'ping') {
        send(ws, { type: 'pong', ts: Date.now() });
      }
    } catch (err) {
      console.error('[ws]', err);
      send(ws, { type: 'error', error: err.message || 'voice websocket error' });
    }
  });
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
