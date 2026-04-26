import { useCallback, useEffect, useMemo, useState } from "react";
import { buildBrainSnapshot, type BrainSnapshot, type MoodSignal } from "@/lib/grokBrain";
import type { CSLEMode } from "@/store/useCSLE";
import type { MemoryEvent } from "@/store/useMemory";

export interface BrainJournalEntry {
  id: string;
  timestamp: string;
  type: "opener" | "conversation" | "voice" | "reflection" | "system";
  title: string;
  summary: string;
  mood: MoodSignal;
  tags: string[];
}

interface BrainState {
  entries: BrainJournalEntry[];
  lastProactiveAt: string | null;
  lastSessionStartedAt: string | null;
}

const STORAGE_KEY = "csle-grok-brain-v1";
const DEFAULT_STATE: BrainState = { entries: [], lastProactiveAt: null, lastSessionStartedAt: null };
const listeners = new Set<(state: BrainState) => void>();
let cache: BrainState | null = null;

function loadState(): BrainState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: BrainState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function getState() {
  if (cache) return cache;
  cache = loadState();
  return cache;
}

function setState(updater: (state: BrainState) => BrainState) {
  const next = updater(getState());
  cache = next;
  saveState(next);
  listeners.forEach((listener) => listener(next));
}

function id() {
  return `brain-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function compact(entries: BrainJournalEntry[]) {
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 120);
}

export function useGrokBrain() {
  const [state, setLocal] = useState<BrainState>(() => getState());

  useEffect(() => {
    const listener = (next: BrainState) => setLocal(next);
    listeners.add(listener);
    setLocal(getState());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addEntry = useCallback((entry: Omit<BrainJournalEntry, "id" | "timestamp"> & { timestamp?: string }) => {
    setState((current) => ({
      ...current,
      entries: compact([
        {
          id: id(),
          timestamp: entry.timestamp ?? new Date().toISOString(),
          type: entry.type,
          title: entry.title.slice(0, 90),
          summary: entry.summary.slice(0, 520),
          mood: entry.mood,
          tags: Array.from(new Set(entry.tags)).slice(0, 12),
        },
        ...current.entries,
      ]),
    }));
  }, []);

  const markProactive = useCallback(() => {
    setState((current) => ({ ...current, lastProactiveAt: new Date().toISOString() }));
  }, []);

  const markSessionStart = useCallback(() => {
    setState((current) => ({ ...current, lastSessionStartedAt: new Date().toISOString() }));
  }, []);

  const buildSnapshot = useCallback(
    (input: {
      csleMode: CSLEMode;
      assistantName: string;
      userName?: string | null;
      weakTopics: string[];
      hotMemories: MemoryEvent[];
      warmMemories: MemoryEvent[];
      dueCount: number;
      favoriteShows?: string;
      favoriteMusic?: string;
      hobbies?: string;
      lastStudyDays?: number;
      intent?: string;
    }): BrainSnapshot => buildBrainSnapshot(input),
    [],
  );

  const lastEntries = state.entries.slice(0, 6);
  const latestVoiceReplay = state.entries.find((entry) => entry.type === "voice");
  const latestReflection = state.entries.find((entry) => entry.type === "reflection" || entry.type === "conversation");

  const shouldProactivelyOpen = useMemo(() => {
    if (!state.lastProactiveAt) return true;
    const last = new Date(state.lastProactiveAt).getTime();
    if (Number.isNaN(last)) return true;
    return Date.now() - last > 1000 * 60 * 60 * 8;
  }, [state.lastProactiveAt]);

  const resetBrain = useCallback(() => setState(() => DEFAULT_STATE), []);

  return {
    ...state,
    addEntry,
    markProactive,
    markSessionStart,
    buildSnapshot,
    lastEntries,
    latestVoiceReplay,
    latestReflection,
    shouldProactivelyOpen,
    resetBrain,
  };
}
