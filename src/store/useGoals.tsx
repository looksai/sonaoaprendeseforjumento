// User daily goal — drives "Your next step today" suggestions.
// Local-first, simple values: 5 / 10 / 15 minutes per day.

import { useEffect, useState, useCallback } from "react";

export type DailyGoal = 5 | 10 | 15;

interface Stored {
  goal: DailyGoal;
  remindersOn: boolean;
}

const DEFAULT: Stored = { goal: 5, remindersOn: false };
const KEY = "csle-goals-v1";

function load(): Stored {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
function save(s: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const listeners = new Set<(s: Stored) => void>();
let cache: Stored | null = null;
function get(): Stored {
  if (cache) return cache;
  cache = load();
  return cache;
}
function set(updater: (s: Stored) => Stored) {
  const next = updater(get());
  cache = next;
  save(next);
  listeners.forEach((l) => l(next));
}

export function useGoals() {
  const [stored, setLocal] = useState<Stored>(() => get());
  useEffect(() => {
    const l = (s: Stored) => setLocal(s);
    listeners.add(l);
    setLocal(get());
    return () => {
      listeners.delete(l);
    };
  }, []);
  const setGoal = useCallback((g: DailyGoal) => set((s) => ({ ...s, goal: g })), []);
  const toggleReminders = useCallback(
    () => set((s) => ({ ...s, remindersOn: !s.remindersOn })),
    [],
  );
  return { ...stored, setGoal, toggleReminders };
}