import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSLEMode } from "@/store/useCSLE";
import type { MemoryEvent } from "@/store/useMemory";
import type { ChatMessage } from "@/hooks/useChat";
import {
  buildSessionReplay,
  chooseRitual,
  consolidateDaily,
  consolidateWeekly,
  dayKey,
  extractPermanentMemories,
  type DailySummary,
  type EnergySignal,
  type PermanentMemory,
  type RitualContext,
  type RitualKind,
  type RitualStats,
  type SessionReplay,
  type WeeklySummary,
  updateRitualHour,
  weekKey,
} from "@/lib/memoryCoreV3";

export interface MemoryCoreV3State {
  dailySummaries: DailySummary[];
  weeklySummaries: WeeklySummary[];
  permanentMemories: PermanentMemory[];
  sessionReplays: SessionReplay[];
  ritualStats: RitualStats;
  lastConsolidatedDay: string | null;
  lastConsolidatedWeek: string | null;
}

const STORAGE_KEY = "csle-memory-core-v3";

const DEFAULT_STATE: MemoryCoreV3State = {
  dailySummaries: [],
  weeklySummaries: [],
  permanentMemories: [],
  sessionReplays: [],
  ritualStats: {
    preferredHour: null,
    sessionCountByHour: {},
    lastRitualAt: null,
    lastKind: null,
    streakRecoveryCount: 0,
  },
  lastConsolidatedDay: null,
  lastConsolidatedWeek: null,
};

const listeners = new Set<(state: MemoryCoreV3State) => void>();
let cache: MemoryCoreV3State | null = null;

function loadState(): MemoryCoreV3State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: MemoryCoreV3State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function getState() {
  if (cache) return cache;
  cache = loadState();
  return cache;
}

function setState(updater: (state: MemoryCoreV3State) => MemoryCoreV3State) {
  const current = getState();
  const next = updater(current);
  if (next === current) return;
  cache = next;
  saveState(next);
  listeners.forEach((listener) => listener(next));
}

function compactState(state: MemoryCoreV3State): MemoryCoreV3State {
  return {
    ...state,
    dailySummaries: state.dailySummaries.sort((a, b) => b.day.localeCompare(a.day)).slice(0, 45),
    weeklySummaries: state.weeklySummaries.sort((a, b) => b.week.localeCompare(a.week)).slice(0, 18),
    permanentMemories: state.permanentMemories.sort((a, b) => b.strength - a.strength || b.lastSeenAt.localeCompare(a.lastSeenAt)).slice(0, 60),
    sessionReplays: state.sessionReplays.sort((a, b) => b.endedAt.localeCompare(a.endedAt)).slice(0, 40),
  };
}

function upsertDaily(list: DailySummary[], next: DailySummary) {
  return [next, ...list.filter((item) => item.day !== next.day)];
}

function upsertWeekly(list: WeeklySummary[], next: WeeklySummary) {
  return [next, ...list.filter((item) => item.week !== next.week)];
}

export function useMemoryCoreV3() {
  const [state, setLocal] = useState<MemoryCoreV3State>(() => getState());

  useEffect(() => {
    const listener = (next: MemoryCoreV3State) => setLocal(next);
    listeners.add(listener);
    setLocal(getState());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const consolidateFromEvents = useCallback((events: MemoryEvent[], force = false) => {
    if (!events.length) return;
    const today = dayKey();
    const thisWeek = weekKey();
    setState((current) => {
      let next = current;
      let changed = false;
      const daily = consolidateDaily(events);
      if (daily && (force || current.lastConsolidatedDay !== today)) {
        next = { ...next, dailySummaries: upsertDaily(next.dailySummaries, daily), lastConsolidatedDay: today };
        changed = true;
      }
      const permanentMemories = extractPermanentMemories(events, next.permanentMemories);
      const permanentSignature = (items: PermanentMemory[]) => items.map((item) => `${item.id}:${item.strength}:${item.lastSeenAt}`).join("|");
      if (permanentSignature(permanentMemories) !== permanentSignature(next.permanentMemories)) {
        next = { ...next, permanentMemories };
        changed = true;
      }
      const weekly = consolidateWeekly(next.dailySummaries);
      if (weekly && (force || current.lastConsolidatedWeek !== thisWeek)) {
        next = { ...next, weeklySummaries: upsertWeekly(next.weeklySummaries, weekly), lastConsolidatedWeek: thisWeek };
        changed = true;
      }
      return changed ? compactState(next) : current;
    });
  }, []);

  const createReplay = useCallback(
    (args: {
      messages: ChatMessage[];
      csleMode: CSLEMode;
      weakTopics: string[];
      agent?: string;
      startedAt?: string | null;
    }) => {
      const replay = buildSessionReplay(args);
      if (!replay) return null;
      setState((current) => compactState({ ...current, sessionReplays: [replay, ...current.sessionReplays] }));
      return replay;
    },
    [],
  );

  const markSessionStart = useCallback((date = new Date()) => {
    setState((current) => compactState({ ...current, ritualStats: updateRitualHour(current.ritualStats, date) }));
  }, []);

  const markRitualShown = useCallback((kind: RitualKind) => {
    setState((current) => ({
      ...current,
      ritualStats: {
        ...current.ritualStats,
        lastRitualAt: new Date().toISOString(),
        lastKind: kind,
        streakRecoveryCount: kind === "streak_recovery" ? current.ritualStats.streakRecoveryCount + 1 : current.ritualStats.streakRecoveryCount,
      },
    }));
  }, []);

  const getRitual = useCallback(
    (context: Omit<RitualContext, "energy"> & { energy?: EnergySignal }) => chooseRitual(state.ritualStats, context),
    [state.ritualStats],
  );

  const resetMemoryCore = useCallback(() => setState(() => DEFAULT_STATE), []);

  const latestDaily = state.dailySummaries[0] ?? null;
  const latestWeekly = state.weeklySummaries[0] ?? null;
  const latestReplay = state.sessionReplays[0] ?? null;
  const topPermanentMemories = useMemo(() => state.permanentMemories.slice(0, 6), [state.permanentMemories]);

  return {
    ...state,
    latestDaily,
    latestWeekly,
    latestReplay,
    topPermanentMemories,
    consolidateFromEvents,
    createReplay,
    markSessionStart,
    markRitualShown,
    getRitual,
    resetMemoryCore,
  };
}
