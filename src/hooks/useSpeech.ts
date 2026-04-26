import { useEffect, useRef, useState, useCallback } from "react";

// Web Speech API typings (browsers only)
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

export type SpeechRate = "slow" | "normal";

const RATE_MAP: Record<SpeechRate, { en: number; pt: number }> = {
  // Mais devagar para aprendizado real
  slow: { en: 0.7, pt: 0.85 },
  normal: { en: 0.85, pt: 0.95 },
};

const RATE_KEY = "csle-speech-rate";

export function getSavedRate(): SpeechRate {
  if (typeof window === "undefined") return "normal";
  const v = localStorage.getItem(RATE_KEY);
  return v === "slow" ? "slow" : "normal";
}

export function saveRate(r: SpeechRate) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RATE_KEY, r);
}

// Quebra texto em frases curtas para criar pausas naturais entre elas.
function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|(?<=[.!?])$/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Separa um texto bilíngue (EN ... 🇧🇷 PT) em duas partes.
export function splitBilingual(text: string): { en: string; pt: string } {
  const idx = text.indexOf("🇧🇷");
  if (idx === -1) return { en: text.trim(), pt: "" };
  return {
    en: text.slice(0, idx).trim(),
    pt: text.slice(idx + 2).trim(),
  };
}

// Escolhe a melhor voz disponível para um idioma.
function pickVoice(lang: "en-US" | "pt-BR"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Preferir vozes "natural"/"neural" e nativas do idioma
  const exact = voices.filter((v) => v.lang === lang);
  const partial = voices.filter((v) => v.lang.startsWith(lang.split("-")[0]));
  const pool = exact.length ? exact : partial;
  // Prefere Google/Microsoft/Apple "enhanced" se houver
  const preferred = pool.find((v) =>
    /google|microsoft|samantha|natural|neural|enhanced/i.test(v.name),
  );
  return preferred ?? pool[0] ?? null;
}

export function useSpeech(lang: "pt-BR" | "en-US" = "pt-BR") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const queueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as SpeechWindow;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
    };
    rec.onerror = (e) => {
      setError(e.error);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [lang]);

  // Pré-carrega vozes (alguns navegadores carregam de forma assíncrona)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = handler;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setError(null);
    setTranscript("");
    try {
      recRef.current.start();
      setListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar reconhecimento");
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    cancelledRef.current = true;
    queueRef.current = [];
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // Fala uma sequência de chunks com pausas entre eles.
  // Cada chunk pode ter idioma e pausa após a fala (ms).
  // onChunkStart/onChunkEnd: chamados quando um chunk inteiro começa/termina.
  // onBoundary: chamado em cada palavra (charIndex relativo ao texto do chunk).
  const speakQueue = useCallback(
    (
      chunks: { text: string; lang: "en-US" | "pt-BR"; pauseAfterMs?: number }[],
      opts?: {
        rate?: SpeechRate;
        onChunkStart?: (chunkIdx: number) => void;
        onChunkEnd?: (chunkIdx: number) => void;
        onBoundary?: (chunkIdx: number, charIndex: number, charLength: number) => void;
        onAllEnd?: () => void;
      },
    ) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const rate = opts?.rate ?? getSavedRate();
      const rateMap = RATE_MAP[rate];

      cancelledRef.current = false;
      window.speechSynthesis.cancel();
      queueRef.current = [];

      // Agrupar utterances por chunk para acionar callbacks de chunk
      type Item = {
        utt: SpeechSynthesisUtterance;
        chunkIdx: number;
        sentenceIdx: number;
        sentenceCount: number;
        sentenceOffset: number; // offset do início desta sentença no texto do chunk
        pauseAfterMs: number;
      };
      const items: Item[] = [];

      chunks.forEach((chunk, chunkIdx) => {
        const sentences = splitSentences(chunk.text);
        let cursor = 0;
        sentences.forEach((sentence, sIdx) => {
          const offset = chunk.text.indexOf(sentence, cursor);
          const sentenceOffset = offset >= 0 ? offset : cursor;
          cursor = sentenceOffset + sentence.length;

          const utt = new SpeechSynthesisUtterance(sentence);
          utt.lang = chunk.lang;
          utt.rate = chunk.lang === "en-US" ? rateMap.en : rateMap.pt;
          utt.pitch = 1.0;
          utt.volume = 1.0;
          const voice = pickVoice(chunk.lang);
          if (voice) utt.voice = voice;

          const isLastSentence = sIdx === sentences.length - 1;

          items.push({
            utt,
            chunkIdx,
            sentenceIdx: sIdx,
            sentenceCount: sentences.length,
            sentenceOffset,
            pauseAfterMs: isLastSentence ? chunk.pauseAfterMs ?? 0 : 220,
          });
        });
      });

      if (!items.length) return;
      queueRef.current = items.map((it) => it.utt);
      setSpeaking(true);

      let i = 0;
      const speakNext = () => {
        if (cancelledRef.current) return;
        if (i >= items.length) {
          setSpeaking(false);
          opts?.onAllEnd?.();
          return;
        }
        const item = items[i];
        const utt = item.utt;

        // Início de chunk: primeira sentença do chunk
        if (item.sentenceIdx === 0) {
          opts?.onChunkStart?.(item.chunkIdx);
        }

        utt.onboundary = (ev: SpeechSynthesisEvent) => {
          if (cancelledRef.current) return;
          if (ev.name && ev.name !== "word") return;
          const charIndex = item.sentenceOffset + ev.charIndex;
          const charLength = (ev as SpeechSynthesisEvent & { charLength?: number }).charLength ?? 0;
          opts?.onBoundary?.(item.chunkIdx, charIndex, charLength);
        };

        utt.onerror = () => {
          // Continua para a próxima — não trava
          i += 1;
          setTimeout(speakNext, 50);
        };

        utt.onend = () => {
          if (cancelledRef.current) return;
          // Fim de chunk: última sentença do chunk
          if (item.sentenceIdx === item.sentenceCount - 1) {
            opts?.onChunkEnd?.(item.chunkIdx);
          }
          i += 1;
          setTimeout(speakNext, item.pauseAfterMs > 0 ? item.pauseAfterMs : 60);
        };

        window.speechSynthesis.speak(utt);
      };
      speakNext();
    },
    [],
  );


  // API simples: fala um texto único num idioma.
  const speak = useCallback(
    (text: string, voiceLang: "pt-BR" | "en-US" = "en-US", opts?: { rate?: SpeechRate }) => {
      speakQueue([{ text, lang: voiceLang }], opts);
    },
    [speakQueue],
  );

  // Fala bilíngue: primeiro EN, pausa clara, depois PT.
  const speakBilingual = useCallback(
    (
      en: string,
      pt: string,
      opts?: { rate?: SpeechRate; pauseBetweenMs?: number },
    ) => {
      const pause = opts?.pauseBetweenMs ?? 700;
      const chunks: { text: string; lang: "en-US" | "pt-BR"; pauseAfterMs?: number }[] = [];
      if (en) chunks.push({ text: en, lang: "en-US", pauseAfterMs: pt ? pause : 0 });
      if (pt) chunks.push({ text: pt, lang: "pt-BR" });
      speakQueue(chunks, opts);
    },
    [speakQueue],
  );

  return {
    supported,
    listening,
    transcript,
    error,
    speaking,
    start,
    stop,
    speak,
    speakBilingual,
    speakQueue,
    cancel,
    setTranscript,
  };
}
