export type League = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export type BadgeId =
  | "first_mission"
  | "voice_rookie"
  | "circle_runner"
  | "spiral_diver"
  | "streak_3"
  | "streak_7"
  | "lesson_finisher"
  | "xp_500"
  | "xp_1500";

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  category: "missao" | "voz" | "csle" | "streak" | "xp";
}

export interface AwardedBadge {
  id: BadgeId;
  awardedAt: string;
}

export interface XpEvent {
  id: string;
  amount: number;
  reason: string;
  at: string;
}

export interface GamificationState {
  xp: number;
  weeklyXp: number;
  league: League;
  streak: number;
  lastPracticeDate: string | null;
  badges: AwardedBadge[];
  history: XpEvent[];
  stats: {
    missionsCompleted: number;
    voiceActions: number;
    circlesCompleted: number;
    spiralsOpened: number;
    lessonsCompleted: number;
  };
}

export const GAMIFICATION_STORAGE_KEY = "csle-gamification-v1";

export const BADGES: BadgeDefinition[] = [
  { id: "first_mission", name: "Primeira Missão", description: "Concluiu a primeira missão do Personal.", emoji: "🚀", category: "missao" },
  { id: "voice_rookie", name: "Voz Destravada", description: "Praticou speaking/voz pela primeira vez.", emoji: "🎙️", category: "voz" },
  { id: "circle_runner", name: "Círculo Ativado", description: "Transformou erro em reforço pelo método Círculo.", emoji: "⭕", category: "csle" },
  { id: "spiral_diver", name: "Mergulho Espiral", description: "Pediu aprofundamento em Espiral.", emoji: "🌀", category: "csle" },
  { id: "streak_3", name: "Ritmo Acordando", description: "Chegou a 3 dias de prática.", emoji: "🔥", category: "streak" },
  { id: "streak_7", name: "Semana Viva", description: "Chegou a 7 dias de prática.", emoji: "🏆", category: "streak" },
  { id: "lesson_finisher", name: "Lição Fechada", description: "Finalizou uma lição completa.", emoji: "✅", category: "missao" },
  { id: "xp_500", name: "Bronze Quente", description: "Acumulou 500 XP.", emoji: "🥉", category: "xp" },
  { id: "xp_1500", name: "Prata Chegando", description: "Acumulou 1500 XP.", emoji: "🥈", category: "xp" },
];

export const DEFAULT_GAMIFICATION: GamificationState = {
  xp: 0,
  weeklyXp: 0,
  league: "Bronze",
  streak: 0,
  lastPracticeDate: null,
  badges: [],
  history: [],
  stats: {
    missionsCompleted: 0,
    voiceActions: 0,
    circlesCompleted: 0,
    spiralsOpened: 0,
    lessonsCompleted: 0,
  },
};

export function leagueForXp(xp: number): League {
  if (xp >= 7000) return "Diamond";
  if (xp >= 3000) return "Platinum";
  if (xp >= 1500) return "Gold";
  if (xp >= 500) return "Silver";
  return "Bronze";
}

export function nextLeagueTarget(xp: number): { league: League; target: number } | null {
  if (xp < 500) return { league: "Silver", target: 500 };
  if (xp < 1500) return { league: "Gold", target: 1500 };
  if (xp < 3000) return { league: "Platinum", target: 3000 };
  if (xp < 7000) return { league: "Diamond", target: 7000 };
  return null;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

export function bumpStreak(state: GamificationState, at = todayISO()): GamificationState {
  let streak = state.streak;
  if (!state.lastPracticeDate) streak = 1;
  else if (state.lastPracticeDate !== at) {
    const diff = daysBetween(state.lastPracticeDate, at);
    streak = diff === 1 ? state.streak + 1 : diff > 1 ? 1 : state.streak;
  } else if (streak === 0) streak = 1;
  return { ...state, streak, lastPracticeDate: at };
}

export function badgeById(id: BadgeId) {
  return BADGES.find((badge) => badge.id === id)!;
}

export function hasBadge(state: GamificationState, id: BadgeId) {
  return state.badges.some((badge) => badge.id === id);
}

export function withBadge(state: GamificationState, id: BadgeId): GamificationState {
  if (hasBadge(state, id)) return state;
  return { ...state, badges: [{ id, awardedAt: new Date().toISOString() }, ...state.badges] };
}

export function normalizeGamification(input?: Partial<GamificationState> | null): GamificationState {
  const merged: GamificationState = {
    ...DEFAULT_GAMIFICATION,
    ...(input ?? {}),
    badges: Array.isArray(input?.badges) ? input!.badges! : [],
    history: Array.isArray(input?.history) ? input!.history! : [],
    stats: { ...DEFAULT_GAMIFICATION.stats, ...(input?.stats ?? {}) },
  };
  return { ...merged, league: leagueForXp(merged.xp) };
}

export function loadGamification(): GamificationState {
  if (typeof window === "undefined") return DEFAULT_GAMIFICATION;
  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    return raw ? normalizeGamification(JSON.parse(raw)) : DEFAULT_GAMIFICATION;
  } catch {
    return DEFAULT_GAMIFICATION;
  }
}

export function saveGamification(state: GamificationState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(normalizeGamification(state)));
    window.dispatchEvent(new CustomEvent("csle-gamification-updated", { detail: normalizeGamification(state) }));
  } catch {
    /* ignore */
  }
}

export function awardGamificationXP(amount: number, reason = "Progresso"): GamificationState {
  let state = bumpStreak(loadGamification());
  const event: XpEvent = {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    amount: Math.max(0, Math.round(amount)),
    reason,
    at: new Date().toISOString(),
  };
  state = {
    ...state,
    xp: state.xp + event.amount,
    weeklyXp: state.weeklyXp + event.amount,
    league: leagueForXp(state.xp + event.amount),
    history: [event, ...state.history].slice(0, 40),
  };
  if (/missão/i.test(reason)) {
    state = { ...state, stats: { ...state.stats, missionsCompleted: state.stats.missionsCompleted + 1 } };
    state = withBadge(state, "first_mission");
  }
  if (state.xp >= 500) state = withBadge(state, "xp_500");
  if (state.xp >= 1500) state = withBadge(state, "xp_1500");
  if (state.streak >= 3) state = withBadge(state, "streak_3");
  if (state.streak >= 7) state = withBadge(state, "streak_7");
  saveGamification(state);
  return state;
}
