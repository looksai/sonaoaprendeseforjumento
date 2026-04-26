import fs from 'node:fs';
import FormData from 'form-data';

const OPENAI_BASE = 'https://api.openai.com/v1';

function apiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing. Add it to .env or your hosting environment.');
  }
  return process.env.OPENAI_API_KEY;
}

async function openaiFetch(path, options = {}) {
  const res = await fetch(`${OPENAI_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI ${path} failed (${res.status}): ${body.slice(0, 800)}`);
  }
  return res;
}

export async function transcribeAudio(filePath, { language = 'en', prompt = '' } = {}) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', process.env.STT_MODEL || 'gpt-4o-mini-transcribe');
  if (language) form.append('language', language);
  if (prompt) form.append('prompt', prompt);

  const res = await openaiFetch('/audio/transcriptions', {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });
  const json = await res.json();
  return json.text || '';
}

export async function createTutorReply({ transcript, userName = 'aluno', mode = 'conversation' }) {
  const system = `Você é Mia, Personal de inglês do app Last Course/CSLE.
Responda em português brasileiro com trechos curtos em inglês.
Seu objetivo: corrigir com leveza, manter a conversa viva e dar uma próxima frase para o aluno falar.
Formato obrigatório em JSON válido:
{
  "correction": "correção curta da frase do aluno",
  "explanation": "explicação simples em PT-BR",
  "reply": "resposta natural da Mia para continuar a conversa",
  "nextPrompt": "frase/pergunta curta para o aluno responder em inglês",
  "xpSuggestion": 10
}`;

  const input = `${system}\n\nAluno: ${userName}\nModo: ${mode}\nÁudio transcrito: "${transcript}"`;

  const res = await openaiFetch('/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.RESPONSE_MODEL || 'gpt-4.1-mini',
      input,
      temperature: 0.5,
    }),
  });

  const json = await res.json();
  const text = json.output_text || json.output?.flatMap?.((o) => o.content || [])?.map?.((c) => c.text || '').join('') || '';

  try {
    return JSON.parse(text);
  } catch {
    return {
      correction: transcript,
      explanation: 'Entendi sua frase. Vamos continuar praticando com leveza.',
      reply: text || 'Boa! Agora tenta responder mais uma frase curta em inglês.',
      nextPrompt: 'Can you say that again, but a little slower?',
      xpSuggestion: 10,
    };
  }
}

export async function textToSpeech(text) {
  const res = await openaiFetch('/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.TTS_MODEL || 'gpt-4o-mini-tts',
      voice: process.env.TTS_VOICE || 'alloy',
      input: text,
      response_format: 'mp3',
    }),
  });
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
