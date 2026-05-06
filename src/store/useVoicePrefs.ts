// User voice & phonetic preferences (persisted in localStorage).
// US English only — three carefully selected voices.
import { useEffect, useState } from "react";

export type VoiceId = "sarah" | "laura" | "brian";
export type PhoneticMode = "off" | "pt" | "ipa";

export interface VoicePrefs {
  voice: VoiceId;
  speed: number;          // 0.7–1.2
  useElevenLabs: boolean; // false = browser only
  phoneticMode: PhoneticMode;
}

export const VOICES: { id: VoiceId; label: string; tagline: string; gender: "f" | "m" }[] = [
  { id: "sarah", label: "Sarah", tagline: "American · clear & warm", gender: "f" },
  { id: "laura", label: "Laura", tagline: "American · friendly & expressive", gender: "f" },
  { id: "brian", label: "Brian", tagline: "American · deep & confident", gender: "m" },
];

const KEY = "csle-voice-prefs-v1";

const DEFAULTS: VoicePrefs = {
  voice: "sarah",
  // 0.80 is a comfortable repetition pace.
  speed: 0.80,
  // Default to the native browser voice (free, offline, uses Google engine on Android).
  useElevenLabs: false,
  phoneticMode: "off",
};

const VALID_VOICES: VoiceId[] = ["sarah", "laura", "brian"];

function load(): VoicePrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const merged = { ...DEFAULTS, ...JSON.parse(raw) } as VoicePrefs;
    // Migrate any old non-US selection to a default.
    if (!VALID_VOICES.includes(merged.voice)) merged.voice = DEFAULTS.voice;
    return merged;
  } catch {
    return DEFAULTS;
  }
}

const listeners = new Set<(p: VoicePrefs) => void>();
let cache: VoicePrefs | null = null;

function getPrefs(): VoicePrefs {
  if (!cache) cache = load();
  return cache;
}

function setPrefs(updater: (p: VoicePrefs) => VoicePrefs) {
  const next = updater(getPrefs());
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  listeners.forEach((l) => l(next));
}

export function getVoicePrefs(): VoicePrefs {
  return getPrefs();
}

export function useVoicePrefs() {
  const [prefs, setLocal] = useState<VoicePrefs>(() => getPrefs());
  useEffect(() => {
    const l = (p: VoicePrefs) => setLocal(p);
    listeners.add(l);
    setLocal(getPrefs());
    return () => { listeners.delete(l); };
  }, []);

  return {
    prefs,
    setVoice: (voice: VoiceId) => setPrefs((p) => ({ ...p, voice })),
    setSpeed: (speed: number) => setPrefs((p) => ({ ...p, speed: Math.max(0.7, Math.min(1.2, speed)) })),
    setUseElevenLabs: (useElevenLabs: boolean) => setPrefs((p) => ({ ...p, useElevenLabs })),
    setPhoneticMode: (phoneticMode: PhoneticMode) => setPrefs((p) => ({ ...p, phoneticMode })),
  };
}
