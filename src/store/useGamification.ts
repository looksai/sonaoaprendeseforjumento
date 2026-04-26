import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BADGES,
  DEFAULT_GAMIFICATION,
  awardGamificationXP,
  badgeById,
  loadGamification,
  nextLeagueTarget,
  normalizeGamification,
  saveGamification,
  withBadge,
  type BadgeId,
  type GamificationState,
} from "@/lib/gamification";

type ActionKind = "mission_completed" | "voice" | "circle" | "spiral" | "lesson_completed" | "practice";

const listeners = new Set<(state: GamificationState) => void>();
let cache: GamificationState | null = null;

function getState() {
  if (!cache) cache = loadGamification();
  return cache;
}

function setState(updater: (state: GamificationState) => GamificationState) {
  const next = normalizeGamification(updater(getState()));
  cache = next;
  saveGamification(next);
  listeners.forEach((listener) => listener(next));
}

function awardBadgeInternal(id: BadgeId) {
  let awarded = false;
  setState((state) => {
    if (state.badges.some((badge) => badge.id === id)) return state;
    awarded = true;
    return withBadge(state, id);
  });
  if (awarded) {
    const badge = badgeById(id);
    toast.success(`${badge.emoji} Badge desbloqueado: ${badge.name}`, { duration: 2400 });
  }
}

export function useGamification() {
  const [state, setLocal] = useState<GamificationState>(() => getState());

  useEffect(() => {
    const listener = (next: GamificationState) => setLocal(next);
    listeners.add(listener);
    setLocal(getState());
    const onExternal = (event: Event) => {
      const detail = (event as CustomEvent<GamificationState>).detail;
      cache = normalizeGamification(detail ?? loadGamification());
      setLocal(cache);
    };
    window.addEventListener("csle-gamification-updated", onExternal as EventListener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("csle-gamification-updated", onExternal as EventListener);
    };
  }, []);

  const addXP = useCallback((amount: number, reason = "Progresso") => {
    const before = getState();
    const next = awardGamificationXP(amount, reason);
    cache = next;
    listeners.forEach((listener) => listener(next));
    if (before.league !== next.league) {
      toast.success(`🏆 Você subiu para a liga ${next.league}!`, { duration: 2600 });
    }
    return next;
  }, []);

  const registerAction = useCallback((kind: ActionKind, metadata?: { xp?: number; reason?: string }) => {
    const xp = metadata?.xp ?? ({ mission_completed: 60, voice: 15, circle: 20, spiral: 25, lesson_completed: 40, practice: 10 }[kind]);
    if (xp > 0) addXP(xp, metadata?.reason ?? "Progresso");
    setState((state) => {
      const stats = { ...state.stats };
      if (kind === "mission_completed") stats.missionsCompleted += 1;
      if (kind === "voice") stats.voiceActions += 1;
      if (kind === "circle") stats.circlesCompleted += 1;
      if (kind === "spiral") stats.spiralsOpened += 1;
      if (kind === "lesson_completed") stats.lessonsCompleted += 1;
      return { ...state, stats };
    });
    const after = getState();
    if (kind === "mission_completed" && after.stats.missionsCompleted >= 1) awardBadgeInternal("first_mission");
    if (kind === "voice" && after.stats.voiceActions >= 1) awardBadgeInternal("voice_rookie");
    if (kind === "circle" && after.stats.circlesCompleted >= 1) awardBadgeInternal("circle_runner");
    if (kind === "spiral" && after.stats.spiralsOpened >= 1) awardBadgeInternal("spiral_diver");
    if (kind === "lesson_completed" && after.stats.lessonsCompleted >= 1) awardBadgeInternal("lesson_finisher");
  }, [addXP]);

  const resetGamification = useCallback(() => {
    cache = DEFAULT_GAMIFICATION;
    saveGamification(cache);
    listeners.forEach((listener) => listener(cache!));
  }, []);

  const badges = useMemo(() => {
    return BADGES.map((definition) => ({
      ...definition,
      awarded: state.badges.some((badge) => badge.id === definition.id),
      awardedAt: state.badges.find((badge) => badge.id === definition.id)?.awardedAt ?? null,
    }));
  }, [state.badges]);

  const nextLeague = useMemo(() => nextLeagueTarget(state.xp), [state.xp]);
  const progressToNext = nextLeague ? Math.min(100, Math.round((state.xp / nextLeague.target) * 100)) : 100;

  return {
    ...state,
    badges,
    nextLeague,
    progressToNext,
    addXP,
    registerAction,
    resetGamification,
  };
}
