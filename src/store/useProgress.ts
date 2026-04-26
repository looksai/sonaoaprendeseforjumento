// Progress + dopamine profile + streak.
// Local-first via localStorage; when a user is signed in we mirror to
// Supabase (user_progress) and load their cloud state on login.

import { useEffect, useState, useCallback } from "react";
import { COURSE, getAllLessons } from "@/data/course";
import { supabase } from "@/integrations/supabase/client";

export interface DopamineProfile {
  name: string;
  /** Optional user photo as a data URL (kept small — resized client-side). */
  avatar?: string;
  favoriteShows: string;
  favoriteMusic: string;
  hobbies: string;
  motivation: string;
  level: "A1" | "A2" | "B1" | "B2";
  hoursPerDay: number;
}

export interface ProgressState {
  profile: DopamineProfile | null;
  completedLessons: string[];
  currentLevel: "A1" | "A2" | "B1" | "B2";
  streak: number;
  lastStudyDate: string | null;
  totalMinutes: number;
}

const STORAGE_KEY = "csle-progress-v1";

const DEFAULT_STATE: ProgressState = {
  profile: null,
  completedLessons: [],
  currentLevel: "A1",
  streak: 0,
  lastStudyDate: null,
  totalMinutes: 0,
};

function loadState(): ProgressState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(s: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota errors
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

const listeners = new Set<(s: ProgressState) => void>();
let memoryState: ProgressState | null = null;
let currentUserId: string | null = null;
let cloudHydrated = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function getState(): ProgressState {
  if (memoryState) return memoryState;
  memoryState = loadState();
  return memoryState;
}

function setState(updater: (s: ProgressState) => ProgressState) {
  const next = updater(getState());
  memoryState = next;
  saveState(next);
  scheduleCloudSync();
  listeners.forEach((l) => l(next));
}

// === Cloud sync =========================================================

function scheduleCloudSync() {
  if (!currentUserId) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void pushToCloud();
  }, 800);
}

async function pushToCloud() {
  if (!currentUserId || !memoryState) return;
  const s = memoryState;
  // Cast through `any` because the supabase types file is auto-regenerated
  // asynchronously and may briefly lag behind the migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("user_progress") as any).upsert(
    {
      user_id: currentUserId,
      dopamine_profile: s.profile,
      completed_lessons: s.completedLessons,
      current_level: s.currentLevel,
      streak: s.streak,
      last_study_date: s.lastStudyDate,
      total_minutes: s.totalMinutes,
    },
    { onConflict: "user_id" },
  );
}

// Hydrate from cloud on login. If cloud is empty (fresh account) and local
// has data, migrate local → cloud. Otherwise cloud wins.
async function hydrateFromCloud(userId: string) {
  currentUserId = userId;
  cloudHydrated = false;
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[useProgress] hydrate failed", error);
    return;
  }

  const local = getState();
  const cloudIsEmpty =
    !data ||
    (!data.dopamine_profile &&
      (!data.completed_lessons ||
        (Array.isArray(data.completed_lessons) && data.completed_lessons.length === 0)) &&
      data.streak === 0 &&
      data.total_minutes === 0);

  if (cloudIsEmpty) {
    // Migrate local → cloud
    cloudHydrated = true;
    await pushToCloud();
    return;
  }

  const merged: ProgressState = {
    profile: (data.dopamine_profile as unknown as DopamineProfile) ?? local.profile,
    completedLessons: Array.isArray(data.completed_lessons)
      ? (data.completed_lessons as unknown as string[])
      : local.completedLessons,
    currentLevel: (data.current_level as ProgressState["currentLevel"]) ?? local.currentLevel,
    streak: data.streak ?? local.streak,
    lastStudyDate: data.last_study_date ?? local.lastStudyDate,
    totalMinutes: data.total_minutes ?? local.totalMinutes,
  };
  memoryState = merged;
  saveState(merged);
  cloudHydrated = true;
  listeners.forEach((l) => l(merged));
}

function detachCloud() {
  currentUserId = null;
  cloudHydrated = false;
}

// Wire to auth lifecycle (browser only)
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) void hydrateFromCloud(data.session.user.id);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      detachCloud();
    } else if (session?.user && session.user.id !== currentUserId) {
      void hydrateFromCloud(session.user.id);
    }
  });
}

// ========================================================================

export function useProgress() {
  const [state, setLocal] = useState<ProgressState>(() => getState());

  useEffect(() => {
    const listener = (s: ProgressState) => setLocal(s);
    listeners.add(listener);
    setLocal(getState());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setProfile = useCallback((profile: DopamineProfile) => {
    setState((s) => ({ ...s, profile, currentLevel: profile.level }));
  }, []);

  const completeLesson = useCallback((lessonId: string, minutes = 5) => {
    setState((s) => {
      const today = todayISO();
      let streak = s.streak;
      if (s.lastStudyDate === null) {
        streak = 1;
      } else if (s.lastStudyDate !== today) {
        const diff = daysBetween(s.lastStudyDate, today);
        streak = diff === 1 ? s.streak + 1 : diff > 1 ? 1 : s.streak;
      } else if (s.streak === 0) {
        streak = 1;
      }
      const completedLessons = s.completedLessons.includes(lessonId)
        ? s.completedLessons
        : [...s.completedLessons, lessonId];
      return {
        ...s,
        completedLessons,
        streak,
        lastStudyDate: today,
        totalMinutes: s.totalMinutes + minutes,
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState(() => DEFAULT_STATE);
  }, []);

  const allLessons = getAllLessons();
  const totalLessons = allLessons.length;
  const completedCount = state.completedLessons.length;
  const overallProgress = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const currentLevelData = COURSE.find((l) => l.id === state.currentLevel) ?? COURSE[0];
  const lessonsInLevel = currentLevelData.units.flatMap((u) => u.lessons);
  const completedInLevel = lessonsInLevel.filter((l) => state.completedLessons.includes(l.id)).length;
  const levelProgress =
    lessonsInLevel.length === 0 ? 0 : Math.round((completedInLevel / lessonsInLevel.length) * 100);

  const nextInLevel = lessonsInLevel.find((l) => !state.completedLessons.includes(l.id));
  let nextLesson: { levelId: string; unitId: string; lesson: typeof allLessons[number]["lesson"] } | null = null;
  if (nextInLevel) {
    const unit = currentLevelData.units.find((u) => u.lessons.includes(nextInLevel))!;
    nextLesson = { levelId: currentLevelData.id, unitId: unit.id, lesson: nextInLevel };
  } else {
    const next = allLessons.find((x) => !state.completedLessons.includes(x.lesson.id));
    nextLesson = next ?? null;
  }

  return {
    ...state,
    setProfile,
    completeLesson,
    resetAll,
    overallProgress,
    levelProgress,
    completedCount,
    totalLessons,
    nextLesson,
    isCloudSynced: cloudHydrated && currentUserId !== null,
  };
}
