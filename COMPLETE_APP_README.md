# Last Course / CSLE Connect — pacote completo

Este ZIP une o app principal e o servidor de voz.

## Conteúdo

- App principal na raiz: TanStack Start + React 19 + Tailwind 4 + Supabase/Lovable Cloud.
- Servidor de voz em `voice-server/`: Node + Express + WebSocket + OpenAI.
- Integração no app: `src/components/RealtimeVoicePanel.tsx` aparece em `/conversar`.

## Lovable

Suba este ZIP/repositório pela raiz. O Lovable deve detectar o app principal.

Configure no app quando o servidor de voz estiver publicado:

```env
VITE_VOICE_SERVER_URL=https://SEU-VOICE-SERVER
```

Não coloque `/voice` no final. O app monta automaticamente `wss://.../voice`.

## Servidor de voz

O servidor está versionado dentro do mesmo ZIP, mas roda como serviço separado em produção.

```bash
cd voice-server
cp .env.example .env
npm install
npm run dev
```

Variáveis do servidor:

```env
OPENAI_API_KEY=sk-...
PORT=8787
ALLOWED_ORIGINS=https://SEU-APP-LOVABLE.app,http://localhost:3000,http://localhost:5173
```

Deploy recomendado: Railway, Fly.io, Render ou VPS Node.

## Integração feita

- `voice-server/` incluído no pacote principal.
- `src/hooks/useRealtimeVoiceSession.ts` criado.
- `src/components/RealtimeVoicePanel.tsx` criado.
- `/conversar` agora mostra o painel de voz realtime.
- `.env.example` inclui `VITE_VOICE_SERVER_URL`.

## Observação

Lovable roda o app principal. O servidor de voz precisa de deploy separado porque usa WebSocket e guarda a chave OpenAI no backend.
