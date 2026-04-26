// Phonetics cache + on-demand fetch from csle-ai (mode=phonetics).
// Stores generated phonetic guides keyed by lowercased word.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PhoneticEntry {
  word: string;
  pt_adapted: string;
  ipa: string;
  tip_pt: string;
}

const STORAGE_KEY = "csle-phonetics-v1";
const MAX_CACHE = 800;

let cache: Record<string, PhoneticEntry> | null = null;
const listeners = new Set<() => void>();
const inflight = new Map<string, Promise<void>>();

function load(): Record<string, PhoneticEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  try {
    // simple cap: drop oldest by removing first N keys when over limit
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE) {
      const toDrop = keys.slice(0, keys.length - MAX_CACHE);
      for (const k of toDrop) delete cache[k];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

function getCache(): Record<string, PhoneticEntry> {
  if (!cache) cache = load();
  return cache;
}

function notify() {
  listeners.forEach((l) => l());
}

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

function tokenize(text: string): string[] {
  return Array.from(new Set(text.split(/\s+/).map(normalize).filter((w) => w.length > 1)));
}

async function fetchBatch(words: string[]): Promise<void> {
  if (!words.length) return;
  const c = getCache();
  const missing = words.filter((w) => !c[w]);
  if (!missing.length) return;

  const key = missing.sort().join("|");
  if (inflight.has(key)) return inflight.get(key)!;

  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("csle-ai", {
        body: { mode: "phonetics", words: missing.slice(0, 30) },
      });
      if (error) throw error;
      const items: PhoneticEntry[] = (data as { items?: PhoneticEntry[] })?.items ?? [];
      for (const item of items) {
        const k = normalize(item.word);
        if (k) c[k] = { ...item, word: k };
      }
      persist();
      notify();
    } catch (e) {
      console.warn("phonetics fetch failed", e);
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

export function usePhonetics() {
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const ensurePhrase = useCallback((text: string) => {
    const words = tokenize(text);
    void fetchBatch(words);
  }, []);

  const get = useCallback((word: string): PhoneticEntry | null => {
    return getCache()[normalize(word)] ?? null;
  }, []);

  return { ensurePhrase, get };
}

export function getPhoneticSync(word: string): PhoneticEntry | null {
  return getCache()[normalize(word)] ?? null;
}
