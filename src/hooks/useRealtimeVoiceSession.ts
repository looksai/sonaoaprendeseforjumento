import { useCallback, useMemo, useRef, useState } from "react";

export type RealtimeVoiceStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "recording"
  | "processing"
  | "playing"
  | "error";

export type RealtimeVoiceEvent = {
  id: string;
  type: string;
  text: string;
  at: number;
};

type VoiceServerMessage =
  | { type: "ready" | "started" | "processing" | "done" }
  | { type: "audio_chunk_received"; bytes?: number }
  | { type: "transcript"; text?: string; transcript?: string }
  | { type: "tutor"; text?: string; reply?: string; nextPrompt?: string; explanation?: string }
  | { type: "audio"; mime?: string; base64?: string }
  | { type: "error"; error?: string; message?: string };

type StartOptions = {
  userName?: string;
  language?: "en" | "pt" | string;
  mode?: "conversation" | "pronunciation" | "tutor" | string;
};

const DEFAULT_CHUNK_MS = 500;

function getVoiceServerUrl() {
  const raw = import.meta.env.VITE_VOICE_SERVER_URL as string | undefined;
  if (!raw) return "";
  return raw.replace(/\/$/, "");
}

function toWebSocketUrl(baseUrl: string) {
  if (!baseUrl) return "";
  const normalized = baseUrl.replace(/\/$/, "");
  if (normalized.endsWith("/voice")) return normalized;
  if (normalized.startsWith("ws://") || normalized.startsWith("wss://")) return `${normalized}/voice`;
  if (normalized.startsWith("https://")) return `wss://${normalized.replace("https://", "")}/voice`;
  if (normalized.startsWith("http://")) return `ws://${normalized.replace("http://", "")}/voice`;
  return `wss://${normalized}/voice`;
}

function base64ToBlob(base64: string, mime = "audio/mpeg") {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function useRealtimeVoiceSession() {
  const [status, setStatus] = useState<RealtimeVoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [events, setEvents] = useState<RealtimeVoiceEvent[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const connectingRef = useRef<Promise<WebSocket> | null>(null);

  const configured = Boolean(getVoiceServerUrl());
  const wsUrl = useMemo(() => toWebSocketUrl(getVoiceServerUrl()), []);

  const pushEvent = useCallback((type: string, text: string) => {
    setEvents((current) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, text, at: Date.now() },
      ...current,
    ].slice(0, 8));
  }, []);

  const cleanupAudioUrl = useCallback(() => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioUrl(null);
  }, []);

  const disconnect = useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore if already stopped
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("idle");
  }, []);

  const handleMessage = useCallback(
    async (raw: MessageEvent) => {
      let message: VoiceServerMessage | null = null;
      try {
        message = JSON.parse(String(raw.data)) as VoiceServerMessage;
      } catch {
        return;
      }

      if (!message) return;
      if (message.type === "ready") {
        setStatus("ready");
        pushEvent("ready", "Servidor de voz conectado.");
      }
      if (message.type === "started") {
        setStatus("recording");
        pushEvent("recording", "Pode falar. Mia está ouvindo.");
      }
      if (message.type === "processing") {
        setStatus("processing");
        pushEvent("processing", "Mia está pensando na resposta.");
      }
      if (message.type === "transcript") {
        const text = message.text ?? message.transcript ?? "";
        setTranscript(text);
        if (text) pushEvent("transcript", text);
      }
      if (message.type === "tutor") {
        const text = [message.reply, message.nextPrompt].filter(Boolean).join("\n") || message.text || message.explanation || "";
        setTutorReply(text);
        if (text) pushEvent("mia", text);
      }
      if (message.type === "audio" && message.base64) {
        cleanupAudioUrl();
        const blob = base64ToBlob(message.base64, message.mime ?? "audio/mpeg");
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioUrl(url);
        setStatus("playing");
        try {
          const audio = new Audio(url);
          audio.onended = () => setStatus("ready");
          await audio.play();
        } catch {
          setStatus("ready");
        }
      }
      if (message.type === "done") {
        setStatus((current) => (current === "playing" ? current : "ready"));
      }
      if (message.type === "error") {
        const msg = message.error ?? message.message ?? "Erro no servidor de voz.";
        setError(msg);
        setStatus("error");
        pushEvent("error", msg);
      }
    },
    [cleanupAudioUrl, pushEvent],
  );

  const connect = useCallback(
    async (options: StartOptions = {}) => {
      if (typeof window === "undefined") return;
      if (!configured || !wsUrl) {
        setError("Configure VITE_VOICE_SERVER_URL para ativar o modo voz realtime.");
        setStatus("error");
        return;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return wsRef.current;
      if (connectingRef.current) return connectingRef.current;

      setError(null);
      setStatus("connecting");
      const ws = new WebSocket(wsUrl);
      const ready = new Promise<WebSocket>((resolve, reject) => {
        wsRef.current = ws;
        ws.onmessage = handleMessage;
        ws.onerror = () => {
          setError("Não consegui conectar ao servidor de voz.");
          setStatus("error");
          reject(new Error("voice websocket connection failed"));
        };
        ws.onclose = () => {
          wsRef.current = null;
          connectingRef.current = null;
          if (status !== "idle") setStatus("idle");
        };
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "start", meta: { userName: options.userName ?? "Aluno", language: options.language ?? "en", mode: options.mode ?? "conversation" } }));
          resolve(ws);
        };
      }).finally(() => {
        connectingRef.current = null;
      });
      connectingRef.current = ready;
      return ready;
    },
    [configured, handleMessage, status, wsUrl],
  );

  const startRecording = useCallback(
    async (options: StartOptions = {}) => {
      if (typeof window === "undefined") return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Seu navegador não liberou gravação de áudio.");
        setStatus("error");
        return;
      }
      await connect(options);
      const ws = wsRef.current;
      if (!ws) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      recorder.ondataavailable = async (event) => {
        if (event.data.size <= 0) return;
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(await event.data.arrayBuffer());
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start(DEFAULT_CHUNK_MS);
      setStatus("recording");
    },
    [connect],
  );

  const commit = useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
    recorderRef.current = null;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "commit" }));
      setStatus("processing");
    }
  }, []);

  return {
    configured,
    status,
    error,
    transcript,
    tutorReply,
    events,
    audioUrl,
    connect,
    startRecording,
    commit,
    disconnect,
    isRecording: status === "recording",
    isBusy: status === "connecting" || status === "processing" || status === "playing",
  };
}
