// Records audio from the microphone, sends to elevenlabs-stt, returns transcript + words.
// If ElevenLabs is unavailable, falls back to the browser's Web Speech API
// (live transcription captured during recording).
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface STTWord { text: string; start: number; end: number }
export interface STTResult { text: string; words: STTWord[]; usedFallback?: boolean }

// Web Speech API typings
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

function getSR(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Resolve the Supabase functions endpoint for direct fetch (so we can send
// FormData without supabase-js trying to JSON-encode it).
function ttsFunctionsUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) throw new Error("VITE_SUPABASE_URL não configurada");
  return `${base.replace(/\/+$/, "")}/functions/v1/elevenlabs-stt`;
}

async function transcribeWithElevenLabs(blob: Blob): Promise<STTResult> {
  const form = new FormData();
  form.append("audio", blob, "speech.webm");

  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const authToken = session?.access_token ?? anonKey;

  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (anonKey) headers.apikey = anonKey;

  const res = await fetch(ttsFunctionsUrl(), {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    let msg = `STT falhou (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = String(j.error);
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const json = await res.json();
  return {
    text: typeof json.text === "string" ? json.text : "",
    words: Array.isArray(json.words) ? json.words : [],
  };
}

export function useSpeechRecorder() {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  // Browser SpeechRecognition runs in parallel during recording, so we always
  // have a fallback transcript ready if ElevenLabs fails.
  const browserRecRef = useRef<SpeechRecognitionInstance | null>(null);
  const browserTranscriptRef = useRef<string>("");

  useEffect(() => () => {
    try { browserRecRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setUsedFallback(false);
    browserTranscriptRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.start();
      recRef.current = rec;
      setRecording(true);

      // Start browser SpeechRecognition in parallel as a free safety net.
      const SR = getSR();
      if (SR) {
        try {
          const br = new SR();
          br.continuous = true;
          br.interimResults = true;
          br.lang = "en-US";
          br.onresult = (e) => {
            let finalText = "";
            for (let i = 0; i < e.results.length; i++) {
              finalText += e.results[i][0].transcript + " ";
            }
            browserTranscriptRef.current = finalText.trim();
          };
          br.onerror = () => { /* keep silent — only used as fallback */ };
          br.onend = () => { /* noop */ };
          br.start();
          browserRecRef.current = br;
        } catch { /* ignore — fallback simply won't be available */ }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microfone indisponível");
      setRecording(false);
    }
  }, []);

  const stopAndTranscribe = useCallback(async (): Promise<STTResult | null> => {
    const rec = recRef.current;
    if (!rec) return null;
    setProcessing(true);

    const blob: Blob = await new Promise((resolve) => {
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        resolve(b);
      };
      try { rec.stop(); } catch { resolve(new Blob([], { type: "audio/webm" })); }
    });
    setRecording(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;

    // Stop the browser recognizer so its final transcript is captured.
    try { browserRecRef.current?.stop(); } catch { /* ignore */ }
    // Give the browser a tick to flush the final result.
    await new Promise((r) => setTimeout(r, 120));
    const browserText = browserTranscriptRef.current;
    browserRecRef.current = null;

    // 1) Try ElevenLabs Scribe.
    try {
      const result = await transcribeWithElevenLabs(blob);
      if (result.text && result.text.trim().length > 0) {
        setProcessing(false);
        return { ...result, usedFallback: false };
      }
      // Empty transcript — fall through to browser result if available.
      throw new Error("Transcrição vazia");
    } catch (e) {
      console.warn("ElevenLabs STT failed, falling back to browser:", e);
      // 2) Browser fallback.
      if (browserText) {
        setUsedFallback(true);
        setError("Voz em alta qualidade indisponível — usando reconhecimento do navegador.");
        setProcessing(false);
        return { text: browserText, words: [], usedFallback: true };
      }
      // 3) Nothing worked.
      setError(e instanceof Error ? e.message : "Falha na transcrição");
      setProcessing(false);
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    try { browserRecRef.current?.stop(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
    browserRecRef.current = null;
    chunksRef.current = [];
    browserTranscriptRef.current = "";
    setRecording(false);
    setProcessing(false);
  }, []);

  return { start, stopAndTranscribe, cancel, recording, processing, error, usedFallback };
}

// Compares spoken words to expected text. Returns per-word match flags.
function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z']/g, "");
}

export interface WordMatch { expected: string; matched: boolean }

export function matchWords(expected: string, spoken: string): { matches: WordMatch[]; score: number } {
  const exp = expected.split(/\s+/).filter(Boolean);
  const got = new Set(spoken.split(/\s+/).map(normalizeWord).filter(Boolean));
  const matches: WordMatch[] = exp.map((w) => ({
    expected: w,
    matched: got.has(normalizeWord(w)),
  }));
  const hits = matches.filter((m) => m.matched).length;
  const score = exp.length === 0 ? 0 : Math.round((hits / exp.length) * 100);
  return { matches, score };
}
