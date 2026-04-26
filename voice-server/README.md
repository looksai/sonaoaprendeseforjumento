# CSLE Voice Realtime Server

Servidor separado para o Last Course / CSLE: recebe áudio do navegador por WebSocket ou HTTP, transcreve, gera correção da Mia e devolve voz em MP3.

## O que vem pronto

- `GET /health` — healthcheck.
- `POST /api/voice-turn` — versão simples: envia um arquivo de áudio e recebe transcript + correção + áudio base64.
- `WS /voice` — versão quase realtime: o cliente envia chunks `audio/webm`; ao mandar `{ "type": "commit" }`, o servidor processa e devolve eventos.
- `public/test-client.html` — página local para testar microfone.

## Por que “quase realtime” primeiro

Esse servidor já dá a sensação de conversa contínua sem colocar sua chave da OpenAI no frontend. O navegador manda pedaços de áudio por WebSocket, o backend junta o turno, transcreve, chama a IA e devolve TTS. Para realtime nativo speech-to-speech, o próximo salto é trocar o pipeline interno por Realtime API/WebRTC, mas mantendo o mesmo contrato do app.

## Instalação

```bash
cp .env.example .env
# edite OPENAI_API_KEY e ALLOWED_ORIGINS
npm install
npm run dev
```

Abra:

```text
http://localhost:8787/test-client.html
```

## Variáveis

```env
OPENAI_API_KEY=sk-...
PORT=8787
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-app-domain.com
STT_MODEL=gpt-4o-mini-transcribe
RESPONSE_MODEL=gpt-4.1-mini
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=alloy
MAX_AUDIO_BYTES=6000000
```

## Eventos WebSocket

### Cliente → servidor

```json
{ "type": "start", "meta": { "userName": "Alan", "language": "en", "mode": "conversation" } }
```

Depois envie chunks binários de áudio (`audio/webm`). Para processar:

```json
{ "type": "commit" }
```

### Servidor → cliente

- `ready`
- `started`
- `audio_chunk_received`
- `processing`
- `transcript`
- `tutor`
- `audio` com `{ mime, base64 }`
- `done`
- `error`

## Integração rápida no app

No frontend, use `MediaRecorder`:

```ts
const ws = new WebSocket('wss://seu-servidor.com/voice');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'audio') {
    const bytes = Uint8Array.from(atob(msg.base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: msg.mime });
    new Audio(URL.createObjectURL(blob)).play();
  }
};

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
ws.send(JSON.stringify({ type: 'start', meta: { userName: 'Alan', language: 'en' } }));
recorder.ondataavailable = async (e) => {
  if (e.data.size > 0) ws.send(await e.data.arrayBuffer());
};
recorder.start(500);
// depois:
recorder.stop();
ws.send(JSON.stringify({ type: 'commit' }));
```

## Deploy

### Railway

1. Crie um serviço a partir deste diretório.
2. Configure `OPENAI_API_KEY` e `ALLOWED_ORIGINS`.
3. Railway detecta `railway.json` e usa `npm start`.

### Docker

```bash
docker build -t csle-voice-server .
docker run -p 8787:8787 --env-file .env csle-voice-server
```

## Segurança

- Nunca coloque `OPENAI_API_KEY` no frontend.
- Configure `ALLOWED_ORIGINS` com o domínio real do app.
- Limite `MAX_AUDIO_BYTES` para evitar abuso.
- Para produção com muitos usuários, adicione autenticação JWT no WebSocket antes de processar voz.
