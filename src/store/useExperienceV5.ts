import { useCallback, useEffect, useMemo, useState } from "react";

export interface ExperienceV5State {
  testMode: boolean;
  firstMagicDone: boolean;
  firstMagicStartedAt: string | null;
  debugOpenCount: number;
  lastResetAt: string | null;
  visualDensity: "calm" | "rich";
}

const STORAGE_KEY = "csle-experience-v5";

const DEFAULT_STATE: ExperienceV5State = {
  testMode: false,
  firstMagicDone: false,
  firstMagicStartedAt: null,
  debugOpenCount: 0,
  lastResetAt: null,
  visualDensity: "calm",
};

const listeners = new Set<(state: ExperienceV5State) => void>();
let cache: ExperienceV5State | null = null;

function loadState(): ExperienceV5State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: ExperienceV5State) {
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

function setState(updater: (state: ExperienceV5State) => ExperienceV5State) {
  const next = updater(getState());
  cache = next;
  saveState(next);
  listeners.forEach((listener) => listener(next));
}

export function useExperienceV5() {
  const [state, setLocal] = useState<ExperienceV5State>(() => getState());

  useEffect(() => {
    const listener = (next: ExperienceV5State) => setLocal(next);
    listeners.add(listener);
    setLocal(getState());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setTestMode = useCallback((enabled: boolean) => {
    setState((current) => ({ ...current, testMode: enabled }));
  }, []);

  const toggleTestMode = useCallback(() => {
    setState((current) => ({ ...current, testMode: !current.testMode }));
  }, []);

  const startFirstMagic = useCallback(() => {
    setState((current) => ({
      ...current,
      firstMagicStartedAt: current.firstMagicStartedAt ?? new Date().toISOString(),
    }));
  }, []);

  const completeFirstMagic = useCallback(() => {
    setState((current) => ({
      ...current,
      firstMagicDone: true,
      firstMagicStartedAt: current.firstMagicStartedAt ?? new Date().toISOString(),
    }));
  }, []);

  const resetFirstMagic = useCallback(() => {
    setState((current) => ({ ...current, firstMagicDone: false, firstMagicStartedAt: null }));
  }, []);

  const markDebugOpened = useCallback(() => {
    setState((current) => ({ ...current, debugOpenCount: current.debugOpenCount + 1 }));
  }, []);

  const setVisualDensity = useCallback((density: ExperienceV5State["visualDensity"]) => {
    setState((current) => ({ ...current, visualDensity: density }));
  }, []);

  const markReset = useCallback(() => {
    setState((current) => ({ ...current, lastResetAt: new Date().toISOString() }));
  }, []);

  const resetV5 = useCallback(() => setState(() => ({ ...DEFAULT_STATE, lastResetAt: new Date().toISOString() })), []);

  const needsFirstMagic = useMemo(() => !state.firstMagicDone, [state.firstMagicDone]);

  return {
    ...state,
    needsFirstMagic,
    setTestMode,
    toggleTestMode,
    startFirstMagic,
    completeFirstMagic,
    resetFirstMagic,
    markDebugOpened,
    setVisualDensity,
    markReset,
    resetV5,
  };
}
