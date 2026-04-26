// Modo Personal — coach proativo baseado em dados reais do sistema.
// buildPersonalMessage recebe contexto real de useMemory + useSRS + useProgress.
// Zero aleatoriedade pura — cada mensagem tem uma razão derivada de dados.

import { useEffect, useState, useCallback } from "react";

export type PersonalStyle = "masc" | "fem";

export interface PersonalIdentity {
  name: string;
  style: PersonalStyle;
  activatedAt: string;
}

export type PersonalAction =
  | { kind: "episode"; label: string; to: "/legendas" }
  | { kind: "music"; label: string; to: "/musica" }
  | { kind: "speak"; label: string; to: "/conversar"; intent?: string }
  | { kind: "review"; label: string; to: "/revisar" }
  | { kind: "lesson"; label: string; to: "/curso" };

export interface PersonalMessage {
  text: string;
  action: PersonalAction;
  /** Machine-readable reason — usado no AdaptiveReason banner */
  reason:
    | "missed_reviews"
    | "weak_topic_speak"
    | "weak_topic_lesson"
    | "returning_after_gap"
    | "overdue_srs"
    | "contextual_episode"
    | "contextual_music"
    | "first_time"
    | "daily_nudge";
  /** Texto curto explicando por que o sistema gerou essa mensagem */
  reasonLabel: string;
  seed: string;
}

export interface PersonalContext {
  userName: string;
  lastStudyDate: string | null;
  weakTopic: string | null;
  overdueCount: number;
  daysSinceLastStudy: number;
  hasProgress: boolean;
  favoriteShows: string;
  favoriteMusic: string;
  hobbies: string;
  weakestPhrase: string | null;
  lastSpeakingScore: number | null;
}

const STORAGE_KEY = "csle-personal-v1";
interface Stored { identity: PersonalIdentity | null; lastSeenDay: string | null; }
const DEFAULT_IDENTITY: PersonalIdentity = {
  name: "Mia",
  style: "fem",
  activatedAt: new Date().toISOString(),
};
const DEFAULT: Stored = { identity: DEFAULT_IDENTITY, lastSeenDay: null };

function load(): Stored {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}
function save(s: Stored) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /**/ } }

const listeners = new Set<(s: Stored) => void>();
let cache: Stored | null = null;
function getState(): Stored { if (cache) return cache; cache = load(); return cache; }
function setState(updater: (s: Stored) => Stored) {
  const next = updater(getState()); cache = next; save(next); listeners.forEach((l) => l(next));
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function timeOfDay(): "morning" | "afternoon" | "night" {
  const h = new Date().getHours();
  if (h < 12) return "morning"; if (h < 18) return "afternoon"; return "night";
}
function fn(name: string) { return name.split(" ")[0] || "amigo"; }

// ============= Core decision engine =============
// Ordem de prioridade: urgência > fraqueza recente > contexto > rotina

function decide(ctx: PersonalContext): Omit<PersonalMessage, "seed"> {
  const name = fn(ctx.userName);
  const tod = timeOfDay();

  // 1. RETORNO APÓS GAP
  if (ctx.daysSinceLastStudy >= 2 && ctx.daysSinceLastStudy < 9999) {
    const d = ctx.daysSinceLastStudy;
    return {
      action: ctx.overdueCount > 0
        ? { kind: "review", label: `Revisar ${ctx.overdueCount}`, to: "/revisar" }
        : { kind: "lesson", label: "Retomar o curso", to: "/curso" },
      reason: "returning_after_gap",
      reasonLabel: `Você ficou ${d} dia${d > 1 ? "s" : ""} sem estudar — o sistema priorizou retomada gradual.`,
      text: d >= 5
        ? `${name}, faz ${d} dias. Sem julgamento — bora retomar de onde parou, leve.`
        : `${name}, você sumiu por ${d} dias. ${ctx.overdueCount > 0 ? `Tem ${ctx.overdueCount} frases esperando revisão.` : "Uma lição rápida já retoma o ritmo."}`,
    };
  }

  // 2. MUITAS REVISÕES VENCIDAS
  if (ctx.overdueCount >= 4) {
    return {
      action: { kind: "review", label: `Revisar ${ctx.overdueCount}`, to: "/revisar" },
      reason: "missed_reviews",
      reasonLabel: `${ctx.overdueCount} frases chegaram ao ponto ideal de revisão — perder esse momento reduz a retenção em 40%.`,
      text: `${name}, tem ${ctx.overdueCount} frases no momento exato de revisar. 5 minutos agora valem por horas depois.`,
    };
  }

  // 3. TÓPICO FRACO — memória registrou dificuldade
  if (ctx.weakTopic) {
    if (tod !== "morning") {
      return {
        action: { kind: "speak", label: "Treinar com Mia", to: "/conversar", intent: `Preciso praticar ${ctx.weakTopic}` },
        reason: "weak_topic_speak",
        reasonLabel: `"${ctx.weakTopic}" aparece como seu ponto mais difícil agora. Conversação é o jeito mais rápido de destravar.`,
        text: `${name}, você travou em "${ctx.weakTopic}" recentemente. Bora falar disso comigo — 3 min e a gente destrava.`,
      };
    }
    return {
      action: { kind: "lesson", label: "Voltar ao curso", to: "/curso" },
      reason: "weak_topic_lesson",
      reasonLabel: `"${ctx.weakTopic}" ainda está marcado como difícil no seu perfil adaptativo.`,
      text: `Bom dia ${name}. O sistema marcou "${ctx.weakTopic}" como seu ponto mais fraco. Que tal atacar isso logo cedo?`,
    };
  }

  // 4. SPEAKING BAIXO
  if (ctx.lastSpeakingScore !== null && ctx.lastSpeakingScore < 60) {
    return {
      action: { kind: "speak", label: "Praticar fala", to: "/conversar", intent: "quero melhorar minha pronúncia" },
      reason: "weak_topic_speak",
      reasonLabel: `Seu último exercício de fala marcou ${ctx.lastSpeakingScore}/100. O sistema está priorizando mais prática oral.`,
      text: `${name}, sua fala evoluiu mas ainda tem espaço. Bora mais um round de conversação?`,
    };
  }

  // 5. REVISÕES PENDENTES (poucas)
  if (ctx.overdueCount > 0) {
    return {
      action: { kind: "review", label: `Revisar ${ctx.overdueCount}`, to: "/revisar" },
      reason: "overdue_srs",
      reasonLabel: `${ctx.overdueCount} frase${ctx.overdueCount > 1 ? "s" : ""} estão no intervalo ideal de revisão espaçada hoje.`,
      text: `Tem ${ctx.overdueCount} frase${ctx.overdueCount > 1 ? "s" : ""} pra revisar, ${name}. Rápido e faz diferença real na memória.`,
    };
  }

  // 6. CONTEXTUAL — série
  if (ctx.favoriteShows.trim()) {
    const show = ctx.favoriteShows.split(",")[0]?.trim() || "sua série";
    return {
      action: { kind: "episode", label: "Estudar com episódio", to: "/legendas" },
      reason: "contextual_episode",
      reasonLabel: `Você mencionou "${show}" no seu perfil. O sistema conecta seus interesses ao conteúdo de prática.`,
      text: `${name}, bora usar ${show} pra praticar hoje? O inglês que você aprende com o que curte fica de verdade.`,
    };
  }

  // 7. CONTEXTUAL — música
  if (ctx.favoriteMusic.trim()) {
    const artist = ctx.favoriteMusic.split(",")[0]?.trim() || "seu artista";
    return {
      action: { kind: "music", label: "Treinar com música", to: "/musica" },
      reason: "contextual_music",
      reasonLabel: `Você gosta de "${artist}". O sistema usa seus gostos pra tornar a prática mais natural e duradoura.`,
      text: `Oi ${name}. E se hoje a gente treinasse com ${artist}? Frases do estilo, no seu ritmo.`,
    };
  }

  // 8. PRIMEIRO USO
  if (!ctx.hasProgress) {
    return {
      action: { kind: "lesson", label: "Começar agora", to: "/curso" },
      reason: "first_time",
      reasonLabel: "Você ainda não tem histórico — o sistema começa a adaptar na sua primeira lição.",
      text: `Oi ${name}! Uma lição curta já ativa o sistema de memória adaptativa. Bora?`,
    };
  }

  // 9. ROTINA
  const greetings = { morning: `Bom dia ${name}.`, afternoon: `E aí ${name}.`, night: `Boa noite ${name}.` };
  return {
    action: { kind: "lesson", label: "Continuar curso", to: "/curso" },
    reason: "daily_nudge",
    reasonLabel: "Nenhuma urgência detectada — o sistema sugere continuar o progresso diário no curso.",
    text: `${greetings[tod]} Tudo certo por aqui. Bora avançar uma lição hoje?`,
  };
}

export function buildPersonalMessage(
  _identity: PersonalIdentity,
  ctx: PersonalContext,
): PersonalMessage {
  return {
    ...decide(ctx),
    seed: `${todayISO()}-${timeOfDay()}`,
  };
}

// ============= Hook =============

export function usePersonal() {
  const [stored, setLocal] = useState<Stored>(() => getState());
  useEffect(() => {
    const l = (s: Stored) => setLocal(s);
    listeners.add(l); setLocal(getState()); return () => { listeners.delete(l); };
  }, []);
  const activate = useCallback((name: string, style: PersonalStyle) => {
    const trimmed = name.trim().slice(0, 24) || (style === "fem" ? "Mia" : "Alex");
    setState((s) => ({ ...s, identity: { name: trimmed, style, activatedAt: new Date().toISOString() }, lastSeenDay: todayISO() }));
  }, []);
  const deactivate = useCallback(() => { setState((s) => ({ ...s, identity: null })); }, []);
  const rename = useCallback((name: string) => {
    setState((s) => s.identity ? { ...s, identity: { ...s.identity, name: name.trim().slice(0, 24) } } : s);
  }, []);
  return { identity: stored.identity, isActive: stored.identity !== null, activate, deactivate, rename };
}
