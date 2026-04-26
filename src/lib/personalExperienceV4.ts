import type { CSLEMode } from "@/store/useCSLE";
import type { RitualKind } from "@/lib/memoryCoreV3";

export type SkillKey = "speaking" | "listening" | "grammar" | "vocabulary" | "pronunciation" | "confidence";

export type SkillGraph = Record<SkillKey, number>;

export type SkillEventType =
  | "chat_sent"
  | "voice_used"
  | "voice_success"
  | "voice_struggled"
  | "grammar_success"
  | "grammar_error"
  | "circle_completed"
  | "spiral_entered"
  | "lesson_completed"
  | "review_completed"
  | "mission_completed";

export type EnergyState = "flow" | "steady" | "confused" | "tired" | "returning";

export type MissionKind =
  | "quick_review"
  | "voice_training"
  | "circle_reinforcement"
  | "spiral_deep"
  | "conversation_light"
  | "comeback_mission";

export interface Mission {
  id: string;
  kind: MissionKind;
  title: string;
  promise: string;
  steps: string[];
  durationMinutes: number;
  targetSkills: SkillKey[];
  csleMode: CSLEMode;
  reason: string;
  createdAt: string;
  completedAt: string | null;
}

export interface MissionContext {
  csleMode: CSLEMode;
  errorCount: number;
  successStreak: number;
  engagementScore: number;
  dueCount: number;
  streak: number;
  lastStudyDate?: string | null;
  weakTopics: string[];
  ritualKind?: RitualKind;
  hasUsedVoice?: boolean;
  preferredInterest?: string | null;
}

export interface VoiceLine {
  text: string;
  agent: "Tutor" | "Coach" | "Companion" | "Librarian" | "Proactive";
  tone: "calm" | "warm" | "energetic" | "focused";
  speed: number;
  pitch: number;
}

export const DEFAULT_SKILL_GRAPH: SkillGraph = {
  speaking: 0.18,
  listening: 0.18,
  grammar: 0.2,
  vocabulary: 0.22,
  pronunciation: 0.16,
  confidence: 0.18,
};

const LABELS: Record<SkillKey, string> = {
  speaking: "Speaking",
  listening: "Listening",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  pronunciation: "Pronunciation",
  confidence: "Confidence",
};

export function skillLabel(skill: SkillKey) {
  return LABELS[skill];
}

export function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function normalizeSkillGraph(graph: Partial<SkillGraph> | null | undefined): SkillGraph {
  return {
    speaking: clamp01(graph?.speaking ?? DEFAULT_SKILL_GRAPH.speaking),
    listening: clamp01(graph?.listening ?? DEFAULT_SKILL_GRAPH.listening),
    grammar: clamp01(graph?.grammar ?? DEFAULT_SKILL_GRAPH.grammar),
    vocabulary: clamp01(graph?.vocabulary ?? DEFAULT_SKILL_GRAPH.vocabulary),
    pronunciation: clamp01(graph?.pronunciation ?? DEFAULT_SKILL_GRAPH.pronunciation),
    confidence: clamp01(graph?.confidence ?? DEFAULT_SKILL_GRAPH.confidence),
  };
}

export function updateSkillGraph(graph: SkillGraph, event: SkillEventType, weight = 1): SkillGraph {
  const next = { ...graph };
  const bump = (skill: SkillKey, amount: number) => {
    next[skill] = clamp01(next[skill] + amount * weight);
  };

  switch (event) {
    case "chat_sent":
      bump("speaking", 0.006);
      bump("confidence", 0.006);
      bump("vocabulary", 0.004);
      break;
    case "voice_used":
      bump("speaking", 0.012);
      bump("listening", 0.006);
      bump("confidence", 0.01);
      break;
    case "voice_success":
      bump("pronunciation", 0.026);
      bump("speaking", 0.018);
      bump("confidence", 0.02);
      break;
    case "voice_struggled":
      bump("pronunciation", -0.006);
      bump("confidence", -0.004);
      break;
    case "grammar_success":
      bump("grammar", 0.018);
      bump("confidence", 0.008);
      break;
    case "grammar_error":
      bump("grammar", -0.008);
      bump("confidence", -0.004);
      break;
    case "circle_completed":
      bump("grammar", 0.025);
      bump("vocabulary", 0.014);
      bump("confidence", 0.014);
      break;
    case "spiral_entered":
      bump("vocabulary", 0.018);
      bump("grammar", 0.012);
      bump("confidence", 0.012);
      break;
    case "lesson_completed":
      bump("grammar", 0.02);
      bump("vocabulary", 0.02);
      bump("listening", 0.01);
      bump("confidence", 0.018);
      break;
    case "review_completed":
      bump("grammar", 0.016);
      bump("vocabulary", 0.016);
      bump("confidence", 0.01);
      break;
    case "mission_completed":
      bump("speaking", 0.014);
      bump("listening", 0.014);
      bump("grammar", 0.014);
      bump("vocabulary", 0.014);
      bump("pronunciation", 0.014);
      bump("confidence", 0.018);
      break;
  }

  return normalizeSkillGraph(next);
}

export function weakestSkills(graph: SkillGraph, count = 2): SkillKey[] {
  return (Object.keys(graph) as SkillKey[]).sort((a, b) => graph[a] - graph[b]).slice(0, count);
}

export function strongestSkills(graph: SkillGraph, count = 2): SkillKey[] {
  return (Object.keys(graph) as SkillKey[]).sort((a, b) => graph[b] - graph[a]).slice(0, count);
}

export function masteryScore(graph: SkillGraph) {
  const values = Object.values(graph);
  return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function daysSince(date?: string | null) {
  if (!date) return 999;
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return 999;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

export function detectEnergyState(context: MissionContext): EnergyState {
  const awayDays = daysSince(context.lastStudyDate);
  if (awayDays >= 3 || context.ritualKind === "streak_recovery") return "returning";
  if (context.errorCount >= 2 || context.csleMode === "CIRCLE") return "confused";
  if (context.successStreak >= 3 || context.csleMode === "SPIRAL" || context.engagementScore > 0.72) return "flow";
  if (context.engagementScore < 0.35) return "tired";
  return "steady";
}

function missionId(kind: MissionKind) {
  return `mission-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function baseReason(context: MissionContext, energy: EnergyState) {
  if (energy === "returning") return "Você ficou um tempo longe. O melhor agora é uma volta leve, curta e vencível.";
  if (energy === "confused") return "O CSLE percebeu atrito. Em vez de forçar avanço, vamos criar um Círculo com exemplos diferentes.";
  if (energy === "flow") return "Você mostrou ritmo e acerto. O sistema liberou uma Espiral curta para aproveitar o hiperfoco.";
  if (energy === "tired") return "Seu engajamento parece baixo. O Personal reduz pressão e mantém contato com conversa leve.";
  if (context.dueCount > 0) return "Tem revisão vencendo hoje. Revisar agora fixa com menos esforço.";
  return "Missão curta para manter constância sem sobrecarregar.";
}

export function generateMission(context: MissionContext, graph: SkillGraph): Mission {
  const energy = detectEnergyState(context);
  const weakSkill = weakestSkills(graph, 1)[0];
  const weakTopic = context.weakTopics[0] ?? "a frase principal de hoje";
  const interest = context.preferredInterest || "algo que você gosta";

  let kind: MissionKind = "quick_review";
  if (energy === "returning") kind = "comeback_mission";
  else if (energy === "tired") kind = "conversation_light";
  else if (energy === "confused") kind = "circle_reinforcement";
  else if (energy === "flow") kind = "spiral_deep";
  else if (weakSkill === "pronunciation" || weakSkill === "speaking" || !context.hasUsedVoice) kind = "voice_training";
  else if (context.dueCount > 0) kind = "quick_review";

  const reason = baseReason(context, energy);
  const now = new Date().toISOString();

  const missionMap: Record<MissionKind, Omit<Mission, "id" | "kind" | "createdAt" | "completedAt" | "reason">> = {
    quick_review: {
      title: "Missão rápida: revisar e avançar",
      promise: "5 minutos para proteger o que você já conquistou.",
      steps: ["Revisar 3 itens vencidos", `Usar ${weakTopic} em uma frase simples`, "Finalizar com uma resposta em voz ou texto"],
      durationMinutes: 5,
      targetSkills: ["grammar", "vocabulary", "confidence"],
      csleMode: "LINE",
    },
    voice_training: {
      title: "Missão de voz: falar sem travar",
      promise: "Treinar fala curta com correção gentil.",
      steps: ["Ouvir uma frase curta", "Repetir em voz alta", "Receber ajuste de pronúncia sem pressão"],
      durationMinutes: 4,
      targetSkills: ["speaking", "pronunciation", "confidence"],
      csleMode: "COMPANION",
    },
    circle_reinforcement: {
      title: "Missão Círculo: destravar o ponto fraco",
      promise: "O mesmo conceito por três caminhos diferentes.",
      steps: [`Ver ${weakTopic} com exemplo normal`, `Ver ${weakTopic} usando ${interest}`, "Responder uma frase parecida sozinho"],
      durationMinutes: 6,
      targetSkills: ["grammar", "vocabulary", "confidence"],
      csleMode: "CIRCLE",
    },
    spiral_deep: {
      title: "Missão Espiral: aproveitar o flow",
      promise: "Aprofundar sem perder a linha principal.",
      steps: ["Pegar a frase base", "Criar uma versão negativa ou pergunta", "Voltar para a linha central com 1 aprendizado novo"],
      durationMinutes: 7,
      targetSkills: ["grammar", "vocabulary", "speaking"],
      csleMode: "SPIRAL",
    },
    conversation_light: {
      title: "Missão leve: só conversar",
      promise: "Sem cobrança. Só manter o inglês vivo hoje.",
      steps: ["Contar como foi o dia", "Aprender 2 expressões úteis", "Sair com uma frase pronta para amanhã"],
      durationMinutes: 5,
      targetSkills: ["speaking", "listening", "confidence"],
      csleMode: "COMPANION",
    },
    comeback_mission: {
      title: "Missão resgate: voltar sem culpa",
      promise: "Recomeçar pequeno para recuperar ritmo.",
      steps: ["Uma conversa curta", "Uma revisão fácil", "Uma vitória visível no Passe do Aluno"],
      durationMinutes: 3,
      targetSkills: ["confidence", "vocabulary", "speaking"],
      csleMode: "COMPANION",
    },
  };

  return {
    id: missionId(kind),
    kind,
    ...missionMap[kind],
    reason,
    createdAt: now,
    completedAt: null,
  };
}

export function buildVoiceLine(args: {
  assistantName: string;
  userName?: string | null;
  mission?: Mission | null;
  energy: EnergyState;
  mode: CSLEMode;
  weakTopics: string[];
}): VoiceLine {
  const firstName = args.userName?.split(" ")[0] || "meu parceiro";
  const weak = args.weakTopics[0];
  const agent: VoiceLine["agent"] =
    args.energy === "confused" ? "Tutor" : args.energy === "returning" || args.energy === "tired" ? "Companion" : args.energy === "flow" ? "Coach" : "Proactive";
  const tone: VoiceLine["tone"] =
    args.energy === "confused" || args.energy === "tired" ? "calm" : args.energy === "flow" ? "energetic" : "warm";

  const missionText = args.mission ? `Bora uma ${args.mission.title.toLowerCase()}? ${args.mission.promise}` : "Bora fazer uma missão curta agora?";
  const weakText = weak ? ` Eu também vou ficar de olho em ${weak}, sem te deixar se perder.` : " Eu seguro a linha central para você não se perder.";
  return {
    text: `E aí, ${firstName}. ${missionText}${weakText}`,
    agent,
    tone,
    speed: tone === "calm" ? 0.88 : tone === "energetic" ? 1.08 : 0.98,
    pitch: tone === "calm" ? 0.92 : tone === "energetic" ? 1.06 : 1,
  };
}

export function missionToPrompt(mission: Mission | null) {
  if (!mission) return "Nenhuma missão ativa.";
  return `${mission.title}\nPromessa: ${mission.promise}\nModo CSLE: ${mission.csleMode}\nPassos: ${mission.steps.join("; ")}\nMotivo: ${mission.reason}`;
}
