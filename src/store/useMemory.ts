// Adaptive Memory V1 — rastreia dificuldade por tópico, frase e fala.
// Persiste em localStorage. Será migrado para Lovable Cloud quando houver auth.

import { useEffect, useState, useCallback } from "react";
import { COURSE, getAllLessons, type Lesson } from "@/data/course";

// ============= Tipos =============

export type Difficulty = "easy" | "medium" | "hard";
export type SpeakingResult = "well" | "partial" | "portuguese" | "struggled";

export interface TopicStat {
  topic: string;            // ex: "Present Simple", "Verb To Be"
  level: string;            // ex: "A1"
  correct: number;
  incorrect: number;
  lastPracticed: string | null; // ISO yyyy-mm-dd
  difficulty: Difficulty;
}

export interface PhraseStat {
  key: string;              // hash simples do EN
  en: string;
  pt?: string;
  topic: string;
  lessonId: string;
  correct: number;
  incorrect: number;
  lastPracticed: string | null;
  difficulty: Difficulty;
}

export interface SpeakingStat {
  lessonId: string;
  topic: string;
  prompt_en: string;
  results: SpeakingResult[]; // últimas 5
  lastPracticed: string | null;
}

export type MemoryEmotion = "positive" | "neutral" | "negative";
export type MemoryLayer = "hot" | "warm" | "cold" | "archive";

export interface MemoryEvent {
  id: string;
  content: string;
  timestamp: string;
  emotion: MemoryEmotion;
  importance: number;
  tags: string[];
  layer: MemoryLayer;
  source: "chat" | "lesson" | "speaking" | "reflection" | "system";
}

export interface MemoryState {
  topics: Record<string, TopicStat>;   // key = topic
  phrases: Record<string, PhraseStat>; // key = phrase key
  speaking: Record<string, SpeakingStat>; // key = lessonId
  events: MemoryEvent[];
}

const STORAGE_KEY = "csle-memory-v1";

const DEFAULT_STATE: MemoryState = {
  topics: {},
  phrases: {},
  speaking: {},
  events: [],
};

// ============= Helpers =============

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const then = new Date(iso + "T00:00:00").getTime();
  const now = new Date(todayISO() + "T00:00:00").getTime();
  return Math.round((now - then) / 86400000);
}

function phraseKey(en: string): string {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
}

function eventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function daysSinceDate(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 9999;
  return Math.floor((Date.now() - then) / 86400000);
}

function layerForEvent(event: Pick<MemoryEvent, "timestamp" | "importance">): MemoryLayer {
  const age = daysSinceDate(event.timestamp);
  if (event.importance >= 0.72 || age <= 2) return "hot";
  if (event.importance >= 0.45 || age <= 9) return "warm";
  if (age <= 45) return "cold";
  return "archive";
}

function calculateImportance(input: { content: string; emotion: MemoryEmotion; tags?: string[]; importance?: number }): number {
  if (typeof input.importance === "number") return Math.max(0, Math.min(1, input.importance));
  const tags = input.tags ?? [];
  let score = 0.28;
  if (input.emotion === "positive") score += 0.16;
  if (input.emotion === "negative") score += 0.2;
  if (tags.includes("personal")) score += 0.24;
  if (tags.includes("difficulty")) score += 0.18;
  if (tags.includes("goal")) score += 0.18;
  if (tags.includes("preference")) score += 0.14;
  if (input.content.length > 120) score += 0.08;
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

function compactEvents(events: MemoryEvent[]): MemoryEvent[] {
  return events
    .map((event) => ({ ...event, layer: layerForEvent(event) }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 220);
}

// Mapeia uma lição para um "tópico" canônico (usado para agrupar dificuldade).
// Usamos o título da unidade como tópico — é o nível certo de granularidade.
export function topicForLesson(lessonId: string): { topic: string; level: string } | null {
  for (const level of COURSE) {
    for (const unit of level.units) {
      if (unit.lessons.some((l) => l.id === lessonId)) {
        return { topic: unit.title, level: level.id };
      }
    }
  }
  return null;
}

function computeDifficulty(correct: number, incorrect: number): Difficulty {
  const total = correct + incorrect;
  if (total < 3) return "medium";
  const rate = correct / total;
  if (rate >= 0.8) return "easy";
  if (rate >= 0.5) return "medium";
  return "hard";
}

function computeSpeakingDifficulty(results: SpeakingResult[]): Difficulty {
  if (results.length === 0) return "medium";
  const score = results.reduce((acc, r) => {
    if (r === "well") return acc + 1;
    if (r === "partial") return acc + 0.5;
    if (r === "portuguese") return acc + 0.2;
    return acc; // struggled
  }, 0);
  const avg = score / results.length;
  if (avg >= 0.75) return "easy";
  if (avg >= 0.4) return "medium";
  return "hard";
}

// ============= Persistência =============

function loadState(): MemoryState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, events: parsed.events ?? [] };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(s: MemoryState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

const listeners = new Set<(s: MemoryState) => void>();
let memoryCache: MemoryState | null = null;

function getState(): MemoryState {
  if (memoryCache) return memoryCache;
  memoryCache = loadState();
  return memoryCache;
}

function setState(updater: (s: MemoryState) => MemoryState) {
  const next = updater(getState());
  memoryCache = next;
  saveState(next);
  listeners.forEach((l) => l(next));
}

// ============= Hook =============

export function useMemory() {
  const [state, setLocal] = useState<MemoryState>(() => getState());

  useEffect(() => {
    const listener = (s: MemoryState) => setLocal(s);
    listeners.add(listener);
    setLocal(getState());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Registra resultado de uma prática (input vs expected)
  const recordPractice = useCallback(
    (lessonId: string, en: string, pt: string | undefined, correct: boolean) => {
      const tInfo = topicForLesson(lessonId);
      if (!tInfo) return;
      const today = todayISO();
      const pKey = phraseKey(en);

      setState((s) => {
        const existingTopic = s.topics[tInfo.topic] ?? {
          topic: tInfo.topic,
          level: tInfo.level,
          correct: 0,
          incorrect: 0,
          lastPracticed: null,
          difficulty: "medium" as Difficulty,
        };
        const newTopic: TopicStat = {
          ...existingTopic,
          correct: existingTopic.correct + (correct ? 1 : 0),
          incorrect: existingTopic.incorrect + (correct ? 0 : 1),
          lastPracticed: today,
        };
        newTopic.difficulty = computeDifficulty(newTopic.correct, newTopic.incorrect);

        const existingPhrase = s.phrases[pKey] ?? {
          key: pKey,
          en,
          pt,
          topic: tInfo.topic,
          lessonId,
          correct: 0,
          incorrect: 0,
          lastPracticed: null,
          difficulty: "medium" as Difficulty,
        };
        const newPhrase: PhraseStat = {
          ...existingPhrase,
          en,
          pt: pt ?? existingPhrase.pt,
          correct: existingPhrase.correct + (correct ? 1 : 0),
          incorrect: existingPhrase.incorrect + (correct ? 0 : 1),
          lastPracticed: today,
        };
        newPhrase.difficulty = computeDifficulty(newPhrase.correct, newPhrase.incorrect);

        return {
          ...s,
          topics: { ...s.topics, [tInfo.topic]: newTopic },
          phrases: { ...s.phrases, [pKey]: newPhrase },
        };
      });
    },
    []
  );

  // Registra resultado de prática oral
  const recordSpeaking = useCallback(
    (lessonId: string, prompt_en: string, result: SpeakingResult) => {
      const tInfo = topicForLesson(lessonId);
      if (!tInfo) return;
      const today = todayISO();

      setState((s) => {
        const existing = s.speaking[lessonId] ?? {
          lessonId,
          topic: tInfo.topic,
          prompt_en,
          results: [] as SpeakingResult[],
          lastPracticed: null,
        };
        const newResults = [...existing.results, result].slice(-5);
        const newSpeaking: SpeakingStat = {
          ...existing,
          prompt_en,
          results: newResults,
          lastPracticed: today,
        };
        // Atualiza dificuldade do tópico levando em conta a fala também
        const existingTopic = s.topics[tInfo.topic] ?? {
          topic: tInfo.topic,
          level: tInfo.level,
          correct: 0,
          incorrect: 0,
          lastPracticed: null,
          difficulty: "medium" as Difficulty,
        };
        const speakingDiff = computeSpeakingDifficulty(newResults);
        // se fala tá hard mas escrita easy, calibra para medium
        let blended: Difficulty = existingTopic.difficulty;
        if (speakingDiff === "hard") blended = "hard";
        else if (speakingDiff === "easy" && blended === "medium") blended = "easy";

        return {
          ...s,
          speaking: { ...s.speaking, [lessonId]: newSpeaking },
          topics: {
            ...s.topics,
            [tInfo.topic]: { ...existingTopic, difficulty: blended, lastPracticed: today },
          },
        };
      });
    },
    []
  );

  const resetMemory = useCallback(() => {
    setState(() => DEFAULT_STATE);
  }, []);

  const recordEvent = useCallback(
    (input: {
      content: string;
      emotion?: MemoryEmotion;
      tags?: string[];
      importance?: number;
      source?: MemoryEvent["source"];
    }) => {
      const content = input.content.trim();
      if (!content) return;
      const emotion = input.emotion ?? "neutral";
      const timestamp = new Date().toISOString();
      const importance = calculateImportance({ content, emotion, tags: input.tags, importance: input.importance });
      const event: MemoryEvent = {
        id: eventId(),
        content: content.slice(0, 420),
        timestamp,
        emotion,
        importance,
        tags: Array.from(new Set(input.tags ?? [])),
        layer: layerForEvent({ timestamp, importance }),
        source: input.source ?? "system",
      };
      setState((s) => ({ ...s, events: compactEvents([event, ...(s.events ?? [])]) }));
    },
    [],
  );

  const summarizeDay = useCallback(() => {
    const today = todayISO();
    const todaysEvents = (getState().events ?? []).filter((event) => event.timestamp.startsWith(today));
    if (todaysEvents.length < 3) return;
    const important = todaysEvents
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 4)
      .map((event) => event.content)
      .join(" | ");
    recordEvent({
      content: `Resumo do dia: ${important}`,
      emotion: "neutral",
      importance: 0.62,
      tags: ["daily-summary"],
      source: "system",
    });
  }, [recordEvent]);

  // ============= Derivados =============

  const topicsList = Object.values(state.topics);
  const phrasesList = Object.values(state.phrases);
  const events = compactEvents(state.events ?? []);
  const hotEvents = events.filter((event) => event.layer === "hot");
  const warmEvents = events.filter((event) => event.layer === "warm");
  const coldEvents = events.filter((event) => event.layer === "cold");

  const strongTopics = topicsList.filter((t) => t.difficulty === "easy").sort((a, b) => b.correct - a.correct);
  const weakTopics = topicsList.filter((t) => t.difficulty === "hard").sort((a, b) => b.incorrect - a.incorrect);
  const mediumTopics = topicsList.filter((t) => t.difficulty === "medium");

  const hardPhrases = phrasesList
    .filter((p) => p.difficulty === "hard" || p.incorrect >= 2)
    .sort((a, b) => b.incorrect - a.incorrect)
    .slice(0, 10);

  // Fila de revisão de hoje:
  // 1. tópicos hard (sempre)
  // 2. tópicos medium não revisados há 3+ dias
  // 3. frases difíceis
  const reviewQueue = (() => {
    const items: Array<
      | { kind: "topic"; topic: TopicStat }
      | { kind: "phrase"; phrase: PhraseStat }
    > = [];
    weakTopics.forEach((t) => items.push({ kind: "topic", topic: t }));
    mediumTopics
      .filter((t) => daysSince(t.lastPracticed) >= 3)
      .forEach((t) => items.push({ kind: "topic", topic: t }));
    hardPhrases.slice(0, 6).forEach((p) => items.push({ kind: "phrase", phrase: p }));
    return items;
  })();

  // Para integração nas lições: ler dificuldade do tópico atual
  const getTopicDifficulty = useCallback(
    (lessonId: string): Difficulty => {
      const tInfo = topicForLesson(lessonId);
      if (!tInfo) return "medium";
      return state.topics[tInfo.topic]?.difficulty ?? "medium";
    },
    [state.topics]
  );

  // Sugere se deve mostrar Spiral Deeper proativamente
  const shouldSuggestSpiral = useCallback(
    (lessonId: string): boolean => {
      return getTopicDifficulty(lessonId) === "hard";
    },
    [getTopicDifficulty]
  );

  // Pega frases difíceis de outros tópicos para reforço durante prática
  const getReinforcementPhrases = useCallback(
    (currentLessonId: string, max = 2): PhraseStat[] => {
      return phrasesList
        .filter((p) => p.lessonId !== currentLessonId && p.difficulty === "hard")
        .sort((a, b) => b.incorrect - a.incorrect)
        .slice(0, max);
    },
    [phrasesList]
  );

  // Busca a primeira lição associada a um tópico (para o botão "praticar")
  const getLessonForTopic = useCallback((topic: string): { levelId: string; unitId: string; lesson: Lesson } | null => {
    const all = getAllLessons();
    return all.find((x) => topicForLesson(x.lesson.id)?.topic === topic) ?? null;
  }, []);

  return {
    ...state,
    recordPractice,
    recordSpeaking,
    resetMemory,
    recordEvent,
    summarizeDay,
    events,
    hotEvents,
    warmEvents,
    coldEvents,
    topicsList,
    strongTopics,
    weakTopics,
    mediumTopics,
    hardPhrases,
    reviewQueue,
    getTopicDifficulty,
    shouldSuggestSpiral,
    getReinforcementPhrases,
    getLessonForTopic,
    hasData: topicsList.length > 0 || phrasesList.length > 0,
  };
}
