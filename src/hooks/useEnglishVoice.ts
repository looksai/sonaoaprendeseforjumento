// Hybrid English voice — OpenAI TTS primary, browser SpeechSynthesis fallback.
// Caches generated audio in-memory keyed by (text, voice, speed).
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getVoicePrefs, type VoiceId } from "@/store/useVoicePrefs";

interface PlayOpts {
  voice?: VoiceId;
  speed?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

interface PreparedAudio {
  url: string;
  duration: number; // seconds (best effort)
}

const audioCache = new Map<string, string>(); // key → object URL

function cacheKey(text: string, voice: VoiceId, speed: number): string {
  return `${voice}|${speed.toFixed(2)}|${text}`;
}

function ttsUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) throw new Error("VITE_SUPABASE_URL não configurada");
  return `${base.replace(/\/+$/, "")}/functions/v1/openai-tts`;
}

async function fetchTTS(text: string, voice: VoiceId, speed: number): Promise<Blob | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    const authToken = session?.access_token ?? anonKey;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    if (anonKey) headers.apikey = anonKey;

    const res = await fetch(ttsUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify({ text, voice, speed }),
    });
    if (!res.ok) {
      console.warn("TTS http error", res.status);
      return null;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("audio/")) {
      console.warn("TTS unexpected content-type", ct);
      return null;
    }
    return await res.blob();
  } catch (e) {
    console.warn("TTS fetch failed", e);
    return null;
  }
}

function browserSpeak(text: string, speed: number, onStart?: () => void, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  utt.rate = Math.max(0.6, Math.min(1.2, speed));
  const voices = window.speechSynthesis.getVoices();
  const enVoice =
    voices.find((v) => /en-US/i.test(v.lang) && /natural|neural|enhanced|google|samantha/i.test(v.name)) ??
    voices.find((v) => /en-US/i.test(v.lang)) ??
    voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) utt.voice = enVoice;
  utt.onstart = () => onStart?.();
  utt.onend = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
  return true;
}

export function useEnglishVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [usedFallback, setUsedFallback] = useState(false);
  const onProgressRef = useRef<((c: number, d: number) => void) | null>(null);

  // Manual loop state — gives a natural breathing pause between repetitions
  // instead of the instant restart that audio.loop produces.
  const loopRef = useRef(false);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LOOP_PAUSE_MS = 900; // breathing room between repetitions for repetition learning

  // Prepare audio (returns url, may be null if fallback path is needed)
  const prepare = useCallback(async (text: string, voice: VoiceId, speed: number): Promise<PreparedAudio | null> => {
    const key = cacheKey(text, voice, speed);
    let url = audioCache.get(key);
    if (!url) {
      const blob = await fetchTTS(text, voice, speed);
      if (!blob) return null;
      url = URL.createObjectURL(blob);
      audioCache.set(key, url);
    }
    // best-effort duration probe via temp audio
    return { url, duration: 0 };
  }, []);

  const clearLoopTimer = useCallback(() => {
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearLoopTimer();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setPlaying(false);
    setCurrentTime(0);
  }, [clearLoopTimer]);

  const pause = useCallback(() => {
    clearLoopTimer();
    if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
    if (typeof window !== "undefined" && window.speechSynthesis?.speaking) window.speechSynthesis.pause();
    setPlaying(false);
  }, [clearLoopTimer]);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => { /* ignore */ });
    } else if (typeof window !== "undefined" && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current && Number.isFinite(seconds)) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 0, seconds));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const play = useCallback(async (text: string, opts?: PlayOpts) => {
    const prefs = getVoicePrefs();
    const voice = opts?.voice ?? prefs.voice;
    const speed = opts?.speed ?? prefs.speed;
    onProgressRef.current = opts?.onProgress ?? null;
    stop();
    setUsedFallback(false);

    if (!prefs.useElevenLabs) {
      // browser-only path
      const ok = browserSpeak(
        text,
        speed,
        () => { setPlaying(true); opts?.onStart?.(); },
        () => {
          setPlaying(false);
          opts?.onEnd?.();
          // honor manual loop in fallback path too
          if (loopRef.current) {
            loopTimerRef.current = setTimeout(() => {
              if (loopRef.current) play(text, opts);
            }, LOOP_PAUSE_MS);
          }
        },
      );
      if (!ok) opts?.onEnd?.();
      setUsedFallback(true);
      return;
    }

    setLoading(true);
    const prepared = await prepare(text, voice, speed);
    setLoading(false);
    if (!prepared) {
      // fallback to browser
      setUsedFallback(true);
      const ok = browserSpeak(
        text,
        speed,
        () => { setPlaying(true); opts?.onStart?.(); },
        () => {
          setPlaying(false);
          opts?.onEnd?.();
          if (loopRef.current) {
            loopTimerRef.current = setTimeout(() => {
              if (loopRef.current) play(text, opts);
            }, LOOP_PAUSE_MS);
          }
        },
      );
      if (!ok) opts?.onEnd?.();
      return;
    }

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    // We manage loop manually for a natural pause between repetitions.
    audio.loop = false;
    audio.src = prepared.url;
    audio.preload = "auto";
    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      onProgressRef.current?.(audio.currentTime, audio.duration || 0);
    };
    audio.onplay = () => { setPlaying(true); opts?.onStart?.(); };
    audio.onpause = () => setPlaying(false);
    audio.onended = () => {
      setPlaying(false);
      setCurrentTime(0);
      opts?.onEnd?.();
      if (loopRef.current) {
        clearLoopTimer();
        loopTimerRef.current = setTimeout(() => {
          if (loopRef.current && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { /* ignore */ });
          }
        }, LOOP_PAUSE_MS);
      }
    };
    try {
      await audio.play();
    } catch (e) {
      console.warn("audio.play failed", e);
      opts?.onEnd?.();
    }
  }, [prepare, stop, clearLoopTimer]);

  // Quick replay — restart current audio from 0 without re-fetching.
  // Falls back to play(text) if no audio is loaded yet.
  const replay = useCallback((text?: string) => {
    clearLoopTimer();
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { /* ignore */ });
      return;
    }
    if (text) play(text);
  }, [clearLoopTimer, play]);

  // toggle loop — managed in JS for natural pause between repetitions
  const setLoop = useCallback((loop: boolean) => {
    loopRef.current = loop;
    if (!loop) clearLoopTimer();
  }, [clearLoopTimer]);

  const isLooping = useCallback(() => loopRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLoopTimer();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [clearLoopTimer]);

  return {
    play,
    pause,
    resume,
    stop,
    seek,
    replay,
    setLoop,
    isLooping,
    playing,
    loading,
    currentTime,
    duration,
    usedFallback,
  };
}
