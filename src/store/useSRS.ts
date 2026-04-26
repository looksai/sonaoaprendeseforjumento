// Spaced Review System (SRS) — backend-backed phrase review queue.
// Each phrase tracks difficulty, intervals (1d / 3d / 7d), and timestamps.
// Falls back gracefully to local-only state when the user is signed out.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ReviewQuality = "easy" | "medium" | "hard";
export type PhraseSource = "lesson" | "episode" | "conversation" | "music";

export interface PhraseReview {
  id?: string;
  phrase_key: string;
  en: string;
  pt?: string | null;
  topic: string;
  lesson_id?: string | null;
  source: PhraseSource;
  difficulty: ReviewQuality;
  correct_count: number;
  incorrect_count: number;
  hesitation_count: number;
  pronunciation_score?: number | null;
  interval_days: number;
  last_seen: string;
  next_review: string;
}

const LOCAL_KEY = "csle-srs-cache-v1";

function intervalForQuality(q: ReviewQuality): number {
  if (q === "hard") return 1;
  if (q === "medium") return 3;
  return 7;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function nowIso(): string {
  return new Date().toISOString();
}

export function phraseKeyOf(en: string): string {
  return en.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
}

interface CacheShape {
  reviews: PhraseReview[];
  loadedAt: number;
}

function loadCache(): CacheShape {
  if (typeof window === "undefined") return { reviews: [], loadedAt: 0 };
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : { reviews: [], loadedAt: 0 };
  } catch {
    return { reviews: [], loadedAt: 0 };
  }
}

function saveCache(c: CacheShape) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

const listeners = new Set<(r: PhraseReview[]) => void>();
let cache: PhraseReview[] = loadCache().reviews;
let userId: string | null = null;
let hydrated = false;

function emit() {
  saveCache({ reviews: cache, loadedAt: Date.now() });
  listeners.forEach((l) => l(cache));
}

async function hydrate(uid: string) {
  userId = uid;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("phrase_reviews") as any)
    .select("*")
    .eq("user_id", uid)
    .order("next_review", { ascending: true })
    .limit(500);
  if (error) {
    console.warn("[SRS] hydrate failed", error);
    return;
  }
  if (Array.isArray(data)) {
    cache = data as PhraseReview[];
    hydrated = true;
    emit();
  }
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) void hydrate(data.session.user.id);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      userId = null;
      hydrated = false;
      cache = [];
      emit();
    } else if (session?.user && session.user.id !== userId) {
      void hydrate(session.user.id);
    }
  });
}

async function upsertRow(row: PhraseReview): Promise<PhraseReview> {
  if (!userId) return row;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("phrase_reviews") as any)
    .upsert(
      {
        user_id: userId,
        phrase_key: row.phrase_key,
        en: row.en,
        pt: row.pt ?? null,
        topic: row.topic,
        lesson_id: row.lesson_id ?? null,
        source: row.source,
        difficulty: row.difficulty,
        correct_count: row.correct_count,
        incorrect_count: row.incorrect_count,
        hesitation_count: row.hesitation_count,
        pronunciation_score: row.pronunciation_score ?? null,
        interval_days: row.interval_days,
        last_seen: row.last_seen,
        next_review: row.next_review,
      },
      { onConflict: "user_id,phrase_key" },
    )
    .select()
    .maybeSingle();
  if (error) {
    console.warn("[SRS] upsert failed", error);
    return row;
  }
  return (data as PhraseReview) ?? row;
}

export function useSRS() {
  const [reviews, setLocal] = useState<PhraseReview[]>(cache);

  useEffect(() => {
    const l = (r: PhraseReview[]) => setLocal(r);
    listeners.add(l);
    setLocal(cache);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const addOrTouch = useCallback(
    async (input: {
      en: string;
      pt?: string;
      topic: string;
      lesson_id?: string;
      source?: PhraseSource;
    }): Promise<PhraseReview> => {
      const key = phraseKeyOf(input.en);
      const existing = cache.find((r) => r.phrase_key === key);
      const now = nowIso();
      const row: PhraseReview = existing
        ? { ...existing, last_seen: now, pt: input.pt ?? existing.pt }
        : {
            phrase_key: key,
            en: input.en,
            pt: input.pt ?? null,
            topic: input.topic,
            lesson_id: input.lesson_id ?? null,
            source: input.source ?? "lesson",
            difficulty: "medium",
            correct_count: 0,
            incorrect_count: 0,
            hesitation_count: 0,
            pronunciation_score: null,
            interval_days: 1,
            last_seen: now,
            next_review: now,
          };
      const saved = await upsertRow(row);
      cache = [saved, ...cache.filter((r) => r.phrase_key !== key)];
      emit();
      return saved;
    },
    [],
  );

  const grade = useCallback(async (en: string, quality: ReviewQuality, opts?: {
    pronunciationScore?: number;
    hesitated?: boolean;
  }) => {
    const key = phraseKeyOf(en);
    const existing = cache.find((r) => r.phrase_key === key);
    const now = nowIso();
    const interval = intervalForQuality(quality);
    const base: PhraseReview = existing ?? {
      phrase_key: key,
      en,
      pt: null,
      topic: "Geral",
      lesson_id: null,
      source: "lesson",
      difficulty: "medium",
      correct_count: 0,
      incorrect_count: 0,
      hesitation_count: 0,
      pronunciation_score: null,
      interval_days: 1,
      last_seen: now,
      next_review: now,
    };
    const correct = quality !== "hard";
    const next: PhraseReview = {
      ...base,
      difficulty: quality,
      correct_count: base.correct_count + (correct ? 1 : 0),
      incorrect_count: base.incorrect_count + (correct ? 0 : 1),
      hesitation_count: base.hesitation_count + (opts?.hesitated ? 1 : 0),
      pronunciation_score: opts?.pronunciationScore ?? base.pronunciation_score ?? null,
      interval_days: interval,
      last_seen: now,
      next_review: addDays(now, interval),
    };
    const saved = await upsertRow(next);
    cache = [saved, ...cache.filter((r) => r.phrase_key !== key)];
    emit();
    return saved;
  }, []);

  const dueToday = reviews.filter((r) => new Date(r.next_review).getTime() <= Date.now());
  const upcoming = reviews
    .filter((r) => new Date(r.next_review).getTime() > Date.now())
    .sort((a, b) => new Date(a.next_review).getTime() - new Date(b.next_review).getTime())
    .slice(0, 20);

  // Phrases the user struggles with, ordered by hardest first.
  const weakest = [...reviews]
    .filter((r) => r.difficulty === "hard" || r.incorrect_count >= 2)
    .sort((a, b) => b.incorrect_count - a.incorrect_count)
    .slice(0, 10);

  return {
    reviews,
    dueToday,
    upcoming,
    weakest,
    addOrTouch,
    grade,
    isCloudSynced: hydrated && userId !== null,
  };
}
