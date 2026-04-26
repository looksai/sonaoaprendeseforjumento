import type { CSLEMode } from "@/store/useCSLE";
import type { MemoryEvent } from "@/store/useMemory";
import type { ChatMessage } from "@/hooks/useChat";

export type MemoryCoreSource = "chat" | "lesson" | "voice" | "reflection" | "system";
export type MemoryCoreLayer = "hot" | "warm" | "cold" | "archive" | "permanent";
export type RitualKind = "habit_time" | "srs_due" | "streak_recovery" | "low_energy" | "memory_followup" | "quick_win";
export type EnergySignal = "high" | "normal" | "low";

export interface DailySummary {
  id: string;
  day: string;
  title: string;
  summary: string;
  highlights: string[];
  weakSignals: string[];
  emotionalTone: "positive" | "neutral" | "negative";
  importance: number;
  createdAt: string;
}

export interface WeeklySummary {
  id: string;
  week: string;
  summary: string;
  themes: string[];
  recommendedFocus: string;
  createdAt: string;
}

export interface PermanentMemory {
  id: string;
  content: string;
  reason: string;
  tags: string[];
  createdAt: string;
  lastSeenAt: string;
  strength: number;
}

export interface SessionReplay {
  id: string;
  startedAt: string;
  endedAt: string;
  title: string;
  learned: string[];
  mistakes: string[];
  improved: string[];
  nextStep: string;
  message: string;
  csleMode: CSLEMode;
  agent?: string;
}

export interface RitualStats {
  preferredHour: number | null;
  sessionCountByHour: Record<string, number>;
  lastRitualAt: string | null;
  lastKind: RitualKind | null;
  streakRecoveryCount: number;
}

export interface RitualContext {
  dueCount: number;
  streak: number;
  lastStudyDate?: string | null;
  assistantName: string;
  userName?: string | null;
  weakTopics: string[];
  hotMemories: MemoryEvent[];
  energy?: EnergySignal;
  now?: Date;
}

export interface RitualSuggestion {
  kind: RitualKind;
  title: string;
  line: string;
  actionLabel: string;
  intent: string;
  weight: number;
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "amigo";
}

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function inferEventTone(events: MemoryEvent[]): DailySummary["emotionalTone"] {
  const score = events.reduce((acc, event) => {
    if (event.emotion === "positive") return acc + 1;
    if (event.emotion === "negative") return acc - 1;
    return acc;
  }, 0);
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export function extractWeakSignals(events: MemoryEvent[]) {
  return Array.from(
    new Set(
      events
        .filter((event) => event.tags.includes("difficulty") || /erro|dif[ií]cil|travei|travou|confus|n[aã]o entendi|cansad|frustr/i.test(event.content))
        .map((event) => event.content.replace(/^Conversa com .*?:/i, "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 5);
}

export function extractHighlights(events: MemoryEvent[]) {
  return events
    .slice()
    .sort((a, b) => b.importance - a.importance || b.timestamp.localeCompare(a.timestamp))
    .map((event) => event.content.replace(/^Conversa com .*?:/i, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function consolidateDaily(events: MemoryEvent[], date = new Date()): DailySummary | null {
  const day = dayKey(date);
  const dayEvents = events.filter((event) => event.timestamp.startsWith(day));
  if (dayEvents.length < 2) return null;

  const highlights = extractHighlights(dayEvents);
  const weakSignals = extractWeakSignals(dayEvents);
  const tone = inferEventTone(dayEvents);
  const importance = Math.min(1, 0.38 + highlights.length * 0.08 + weakSignals.length * 0.1);
  const title = tone === "positive" ? "Dia com boa energia" : tone === "negative" ? "Dia que pediu cuidado" : "Dia consolidado";
  const summary = [
    highlights.length ? `Hoje apareceram estes pontos principais: ${highlights.join(" · ")}.` : "Hoje o Personal coletou sinais leves de uso.",
    weakSignals.length ? `Sinais para reforço: ${weakSignals.join(" · ")}.` : "Nenhum atrito forte detectado.",
    "A próxima abertura deve usar isso sem parecer robótica: uma memória, uma pergunta e uma microação em inglês.",
  ].join(" ");

  return {
    id: uid("daily"),
    day,
    title,
    summary: summary.slice(0, 900),
    highlights,
    weakSignals,
    emotionalTone: tone,
    importance: Number(importance.toFixed(2)),
    createdAt: new Date().toISOString(),
  };
}

export function consolidateWeekly(dailySummaries: DailySummary[], date = new Date()): WeeklySummary | null {
  const week = weekKey(date);
  const summaries = dailySummaries.filter((summary) => weekKey(new Date(`${summary.day}T12:00:00`)) === week);
  if (summaries.length < 3) return null;

  const themes = Array.from(new Set(summaries.flatMap((summary) => [...summary.highlights, ...summary.weakSignals]).map((x) => x.slice(0, 80)))).slice(0, 6);
  const weak = summaries.flatMap((summary) => summary.weakSignals)[0];
  const recommendedFocus = weak ? `Reforçar: ${weak}` : "Manter sessões curtas e consistentes para alimentar memória e SRS.";

  return {
    id: uid("weekly"),
    week,
    summary: `Semana consolidada com ${summaries.length} dias úteis de sinais. Temas principais: ${themes.join(" · ") || "rotina, continuidade e revisão"}.`,
    themes,
    recommendedFocus,
    createdAt: new Date().toISOString(),
  };
}

export function extractPermanentMemories(events: MemoryEvent[], existing: PermanentMemory[] = []): PermanentMemory[] {
  const currentByContent = new Map(existing.map((memory) => [normalize(memory.content), memory]));
  const candidates = events.filter((event) => event.importance >= 0.76 || event.tags.some((tag) => ["preference", "goal", "personal"].includes(tag)));

  for (const event of candidates) {
    const content = event.content.replace(/^Conversa com .*?:/i, "").trim().slice(0, 260);
    if (!content || content.length < 8) continue;
    const key = normalize(content);
    const prev = currentByContent.get(key);
    if (prev) {
      currentByContent.set(key, { ...prev, lastSeenAt: event.timestamp, strength: Math.min(1, Number((prev.strength + 0.08).toFixed(2))) });
    } else {
      currentByContent.set(key, {
        id: uid("perm"),
        content,
        reason: event.tags.includes("preference") ? "preferência recorrente" : event.tags.includes("goal") ? "objetivo declarado" : "memória pessoal importante",
        tags: event.tags.slice(0, 8),
        createdAt: event.timestamp,
        lastSeenAt: event.timestamp,
        strength: event.importance,
      });
    }
  }

  return Array.from(currentByContent.values())
    .sort((a, b) => b.strength - a.strength || b.lastSeenAt.localeCompare(a.lastSeenAt))
    .slice(0, 60);
}

export function buildSessionReplay(args: {
  messages: ChatMessage[];
  csleMode: CSLEMode;
  weakTopics: string[];
  agent?: string;
  startedAt?: string | null;
}): SessionReplay | null {
  const userMessages = args.messages.filter((m) => m.role === "user");
  const assistantMessages = args.messages.filter((m) => m.role === "assistant");
  if (userMessages.length < 1 || assistantMessages.length < 2) return null;

  const lastUser = userMessages.at(-1)?.content ?? "";
  const allUser = userMessages.map((m) => m.content).join(" ");
  const text = normalize(allUser);
  const mistakes: string[] = [];
  if (/\bi eats\b|\bhe eat\b|\bshe eat\b|\bit eat\b/.test(text)) mistakes.push("Presente simples com he/she/it: he eats, she likes, it works.");
  if (/\bi am agree\b|\bi have .* years\b/.test(text)) mistakes.push("Estruturas comuns em inglês: I agree / I am 30 years old.");
  if (args.weakTopics[0] && mistakes.length === 0) mistakes.push(`Reforçar ${args.weakTopics[0]} em frases curtas.`);

  const learned = [
    args.csleMode === "CIRCLE" ? "Você treinou o mesmo conceito por ângulos diferentes." : args.csleMode === "SPIRAL" ? "Você aprofundou um conteúdo sem sair da linha central." : "Você manteve conversa real em inglês com apoio do Personal.",
    lastUser.length > 20 ? `Você trouxe contexto próprio: “${lastUser.slice(0, 90)}${lastUser.length > 90 ? "…" : "”"}` : "Você iniciou uma resposta curta, boa para treino oral.",
  ];

  const improved = [
    userMessages.length >= 2 ? "Você sustentou mais de uma troca, o que aumenta fluência." : "Você deu o primeiro passo da sessão.",
    args.csleMode === "COMPANION" ? "Você praticou inglês dentro de uma conversa natural." : "Você alimentou o motor CSLE com dados reais de aprendizagem.",
  ];

  const nextStep = mistakes[0] ? `Próximo passo: ${mistakes[0]}` : "Próximo passo: transformar essa conversa em 3 frases faladas em voz alta.";
  const message = mistakes.length
    ? "Boa. Teve atrito, mas atrito é exatamente onde o CSLE fica inteligente. Amanhã eu puxo isso mais leve."
    : "Boa sessão. Você alimentou memória, contexto e fluência ao mesmo tempo — isso é progresso composto.";

  return {
    id: uid("replay"),
    startedAt: args.startedAt ?? new Date().toISOString(),
    endedAt: new Date().toISOString(),
    title: args.agent ? `Replay com agente ${args.agent}` : "Replay da sessão",
    learned: learned.slice(0, 4),
    mistakes: mistakes.slice(0, 4),
    improved: improved.slice(0, 4),
    nextStep,
    message,
    csleMode: args.csleMode,
    agent: args.agent,
  };
}

function daysSinceISO(iso?: string | null) {
  if (!iso) return 9999;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 9999;
  return Math.floor((Date.now() - t) / 86400000);
}

export function updateRitualHour(stats: RitualStats, date = new Date()): RitualStats {
  const hour = date.getHours();
  const key = String(hour);
  const sessionCountByHour = { ...stats.sessionCountByHour, [key]: (stats.sessionCountByHour[key] ?? 0) + 1 };
  const preferredHour = Number(
    Object.entries(sessionCountByHour).sort((a, b) => b[1] - a[1])[0]?.[0] ?? hour,
  );
  return { ...stats, sessionCountByHour, preferredHour };
}

export function chooseRitual(stats: RitualStats, context: RitualContext): RitualSuggestion {
  const now = context.now ?? new Date();
  const hour = now.getHours();
  const name = firstName(context.userName);
  const assistant = context.assistantName || "Mia";
  const weak = context.weakTopics[0];
  const hot = context.hotMemories.find((memory) => memory.importance > 0.55);
  const days = daysSinceISO(context.lastStudyDate);
  const nearPreferred = stats.preferredHour === null ? false : Math.abs(hour - stats.preferredHour) <= 1;

  const options: RitualSuggestion[] = [
    {
      kind: "srs_due",
      title: "Ritual de revisão",
      line: `${name}, tem ${context.dueCount} revisão${context.dueCount === 1 ? "" : "ões"} pedindo atenção. A gente faz em 5 minutos, sem drama.`,
      actionLabel: "Revisar agora",
      intent: weak ? `Revisar ${weak} em 5 minutos com correção leve` : "Fazer revisão curta de SRS",
      weight: context.dueCount > 0 ? 0.9 : 0,
    },
    {
      kind: "streak_recovery",
      title: "Ritual de retomada",
      line: `${name}, você ficou um tempinho fora. Volta leve: uma frase sobre seu dia e eu seguro o resto.`,
      actionLabel: "Retomar leve",
      intent: "Retomar inglês com uma conversa simples sobre meu dia",
      weight: days >= 2 || context.streak === 0 ? 0.82 : 0,
    },
    {
      kind: "habit_time",
      title: "Ritual do horário certo",
      line: `${name}, esse horário costuma combinar com seu estudo. Quer fazer uma vitória pequena agora?`,
      actionLabel: "Vitória rápida",
      intent: "Fazer uma micro sessão de inglês no meu horário habitual",
      weight: nearPreferred ? 0.7 : 0,
    },
    {
      kind: "low_energy",
      title: "Ritual sem pressão",
      line: `${name}, energia baixa detectada. Hoje pode ser só conversa leve com ${assistant}, sem cobrança.`,
      actionLabel: "Conversar leve",
      intent: "Conversar em inglês sem pressão, com frases curtas",
      weight: context.energy === "low" ? 0.76 : 0,
    },
    {
      kind: "memory_followup",
      title: "Ritual de continuidade",
      line: hot ? `${name}, lembrei disso: “${hot.content.slice(0, 120)}”. Quer transformar em inglês comigo?` : "",
      actionLabel: "Usar memória",
      intent: hot ? `Conversar em inglês sobre esta memória: ${hot.content}` : "Conversar usando uma memória recente",
      weight: hot ? 0.68 : 0,
    },
    {
      kind: "quick_win",
      title: "Ritual da vitória pequena",
      line: `${name}, me dá uma frase simples em inglês sobre agora. Eu corrijo e transformo em 3 versões melhores.`,
      actionLabel: "Começar rápido",
      intent: "Fazer uma frase simples e receber 3 versões melhores",
      weight: 0.35,
    },
  ];

  return options.sort((a, b) => b.weight - a.weight)[0];
}
