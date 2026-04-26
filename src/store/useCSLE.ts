import { useCallback, useEffect, useMemo, useState } from "react";

export type CSLEMode = "LINE" | "CIRCLE" | "SPIRAL" | "COMPANION";
export type CSLESignal =
  | "lesson_opened"
  | "practice_correct"
  | "practice_incorrect"
  | "spiral_requested"
  | "spiral_closed"
  | "speaking_success"
  | "speaking_struggled"
  | "lesson_completed"
  | "chat_opened"
  | "chat_message";

export interface CSLEState {
  mode: CSLEMode;
  currentTopic: string | null;
  currentLessonId: string | null;
  errorCount: number;
  successStreak: number;
  engagementScore: number;
  lastSignal: CSLESignal | null;
  lastInteractionAt: string | null;
  circleReason: string | null;
  spiralReason: string | null;
  sessionStartedAt: string;
}

const STORAGE_KEY = "csle-engine-v1";

const DEFAULT_STATE: CSLEState = {
  mode: "LINE",
  currentTopic: null,
  currentLessonId: null,
  errorCount: 0,
  successStreak: 0,
  engagementScore: 0.45,
  lastSignal: null,
  lastInteractionAt: null,
  circleReason: null,
  spiralReason: null,
  sessionStartedAt: new Date().toISOString(),
};

const listeners = new Set<(state: CSLEState) => void>();
let cache: CSLEState | null = null;

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function loadState(): CSLEState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: CSLEState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — keep in memory only
  }
}

function getState(): CSLEState {
  if (cache) return cache;
  cache = loadState();
  return cache;
}

function setState(updater: (state: CSLEState) => CSLEState) {
  const next = updater(getState());
  cache = next;
  saveState(next);
  listeners.forEach((listener) => listener(next));
}

function decideMode(next: CSLEState): CSLEMode {
  if (next.lastSignal === "chat_opened" || next.lastSignal === "chat_message") return "COMPANION";
  if (next.lastSignal === "spiral_requested") return "SPIRAL";
  if (next.errorCount >= 2) return "CIRCLE";
  if (next.successStreak >= 3 && next.engagementScore >= 0.68) return "SPIRAL";
  return "LINE";
}

function reasonForMode(state: CSLEState): Pick<CSLEState, "circleReason" | "spiralReason"> {
  if (state.mode === "CIRCLE") {
    return {
      circleReason:
        state.errorCount >= 2
          ? `Você errou ${state.errorCount} vez${state.errorCount > 1 ? "es" : ""} nesse ponto. O CSLE entrou em Círculo para reforçar o mesmo conceito com outros caminhos.`
          : "O CSLE ativou reforço por contexto antes de avançar.",
      spiralReason: null,
    };
  }
  if (state.mode === "SPIRAL") {
    return {
      circleReason: null,
      spiralReason:
        state.lastSignal === "spiral_requested"
          ? "Você pediu aprofundamento. O CSLE abriu uma Espiral, mas mantém vínculo com a linha central."
          : "Você acertou em sequência e mostrou engajamento. O CSLE liberou aprofundamento progressivo.",
    };
  }
  return { circleReason: null, spiralReason: null };
}

export function useCSLE() {
  const [state, setLocal] = useState<CSLEState>(() => getState());

  useEffect(() => {
    const listener = (next: CSLEState) => setLocal(next);
    listeners.add(listener);
    setLocal(getState());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const signal = useCallback(
    (signalName: CSLESignal, payload?: { topic?: string | null; lessonId?: string | null }) => {
      setState((current) => {
        const topic = payload?.topic ?? current.currentTopic;
        const lessonId = payload?.lessonId ?? current.currentLessonId;
        let next: CSLEState = {
          ...current,
          currentTopic: topic ?? null,
          currentLessonId: lessonId ?? null,
          lastSignal: signalName,
          lastInteractionAt: new Date().toISOString(),
        };

        switch (signalName) {
          case "lesson_opened":
            next = {
              ...next,
              mode: "LINE",
              errorCount: 0,
              successStreak: 0,
              engagementScore: clamp(current.engagementScore + 0.05),
            };
            break;
          case "practice_correct":
            next = {
              ...next,
              errorCount: Math.max(0, current.errorCount - 1),
              successStreak: current.successStreak + 1,
              engagementScore: clamp(current.engagementScore + 0.12),
            };
            break;
          case "practice_incorrect":
            next = {
              ...next,
              errorCount: current.errorCount + 1,
              successStreak: 0,
              engagementScore: clamp(current.engagementScore - 0.03),
            };
            break;
          case "spiral_requested":
            next = { ...next, engagementScore: clamp(current.engagementScore + 0.16) };
            break;
          case "spiral_closed":
            next = { ...next, mode: "LINE", successStreak: 0, errorCount: 0 };
            break;
          case "speaking_success":
            next = {
              ...next,
              successStreak: current.successStreak + 1,
              engagementScore: clamp(current.engagementScore + 0.1),
            };
            break;
          case "speaking_struggled":
            next = {
              ...next,
              errorCount: current.errorCount + 1,
              successStreak: 0,
              engagementScore: clamp(current.engagementScore - 0.02),
            };
            break;
          case "lesson_completed":
            next = { ...next, mode: "LINE", errorCount: 0, successStreak: 0, engagementScore: clamp(current.engagementScore + 0.08) };
            break;
          case "chat_opened":
          case "chat_message":
            next = { ...next, engagementScore: clamp(current.engagementScore + 0.04) };
            break;
        }

        next.mode = decideMode(next);
        return { ...next, ...reasonForMode(next) };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setState(() => ({ ...DEFAULT_STATE, sessionStartedAt: new Date().toISOString() }));
  }, []);

  const modeLabel = useMemo(() => {
    if (state.mode === "LINE") return "Linha central";
    if (state.mode === "CIRCLE") return "Círculo de reforço";
    if (state.mode === "SPIRAL") return "Espiral profunda";
    return "Companion";
  }, [state.mode]);

  const modeDescription = useMemo(() => {
    if (state.mode === "LINE") return "Avançando pelo caminho principal, sem sobrecarga.";
    if (state.mode === "CIRCLE") return state.circleReason ?? "Reforçando por contextos diferentes antes de avançar.";
    if (state.mode === "SPIRAL") return state.spiralReason ?? "Aprofundando sem perder a linha principal.";
    return "Conversa livre com memória e intenção pedagógica.";
  }, [state]);

  return { ...state, signal, reset, modeLabel, modeDescription };
}
