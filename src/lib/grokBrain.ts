import type { CSLEMode } from "@/store/useCSLE";
import type { MemoryEvent } from "@/store/useMemory";

export type BrainAgent = "Tutor" | "Companion" | "Navigator" | "Proactive" | "Librarian" | "Coach";
export type UserRhythm = "morning" | "afternoon" | "night" | "unknown";
export type MoodSignal = "focused" | "tired" | "curious" | "frustrated" | "neutral";

export interface BrainSnapshot {
  agent: BrainAgent;
  headline: string;
  opener: string;
  reason: string;
  actionLabel: string;
  actionIntent: string;
  memoryUsed?: MemoryEvent;
  mode: CSLEMode;
  mood: MoodSignal;
  rhythm: UserRhythm;
}

export interface BrainInput {
  csleMode: CSLEMode;
  assistantName: string;
  userName?: string | null;
  weakTopics: string[];
  hotMemories: MemoryEvent[];
  warmMemories: MemoryEvent[];
  dueCount: number;
  favoriteShows?: string;
  favoriteMusic?: string;
  hobbies?: string;
  hour?: number;
  lastStudyDays?: number;
  intent?: string;
}

export function firstName(name?: string | null) {
  return name?.split(" ")[0]?.trim() || "amigo";
}

export function inferRhythm(hour = new Date().getHours()): UserRhythm {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 || hour < 2) return "night";
  return "unknown";
}

export function inferMood(input: BrainInput): MoodSignal {
  const memoryText = [...input.hotMemories, ...input.warmMemories]
    .slice(0, 5)
    .map((event) => `${event.content} ${event.tags.join(" ")}`)
    .join(" ")
    .toLowerCase();

  if (input.csleMode === "CIRCLE" || memoryText.match(/erro|difícil|dificuldade|travou|cans|stress|estress|ruim|frustr/)) return "frustrated";
  if (memoryText.match(/curios|quero entender|profundo|pesquisar|explorar/)) return "curious";
  if (memoryText.match(/cansado|sono|sem energia|exausto/)) return "tired";
  if (input.csleMode === "SPIRAL") return "curious";
  if (input.dueCount > 0 || input.weakTopics.length > 0) return "focused";
  return "neutral";
}

export function pickMemory(input: BrainInput): MemoryEvent | undefined {
  const pool = [...input.hotMemories, ...input.warmMemories];
  return pool
    .filter((event) => !event.tags.includes("system-no-surface"))
    .sort((a, b) => b.importance - a.importance || b.timestamp.localeCompare(a.timestamp))[0];
}

export function pickAgent(input: BrainInput, mood = inferMood(input)): BrainAgent {
  if (input.intent) return "Proactive";
  if (input.csleMode === "CIRCLE") return "Tutor";
  if (input.csleMode === "SPIRAL") return "Librarian";
  if (input.dueCount > 0 || input.weakTopics.length > 0) return "Coach";
  if (pickMemory(input)) return "Companion";
  if (mood === "curious") return "Librarian";
  return "Proactive";
}

function interest(input: BrainInput) {
  return input.favoriteShows?.trim() || input.favoriteMusic?.trim() || input.hobbies?.trim() || "algo que você curte";
}

export function buildBrainSnapshot(input: BrainInput): BrainSnapshot {
  const name = firstName(input.userName);
  const rhythm = inferRhythm(input.hour);
  const mood = inferMood(input);
  const agent = pickAgent(input, mood);
  const memory = pickMemory(input);
  const weak = input.weakTopics[0];
  const assistantName = input.assistantName || "Mia";

  if (input.intent) {
    return {
      agent,
      mode: input.csleMode,
      mood,
      rhythm,
      headline: `${assistantName} já entrou no modo ação`,
      opener: `${name}, peguei o contexto: ${input.intent}. Vamos transformar isso em inglês real, sem travar.`,
      reason: "Usei a intenção que você abriu na tela de conversa para iniciar direto no objetivo, sem pergunta genérica.",
      actionLabel: "Começar conversa guiada",
      actionIntent: input.intent,
      memoryUsed: memory,
    };
  }

  if (input.csleMode === "CIRCLE" && weak) {
    return {
      agent,
      mode: input.csleMode,
      mood,
      rhythm,
      headline: "Entramos no Círculo certo",
      opener: `${name}, percebi que ${weak} merece reforço. Vou te dar exemplos diferentes até o conceito ficar óbvio, não repetitivo.`,
      reason: "O CSLE detectou atrito e trocou avanço linear por arborização controlada: mesmo conceito, contextos diferentes.",
      actionLabel: `Destravar ${weak}`,
      actionIntent: `Treinar ${weak} com exemplos personalizados usando ${interest(input)}`,
      memoryUsed: memory,
    };
  }

  if (input.csleMode === "SPIRAL") {
    return {
      agent,
      mode: input.csleMode,
      mood,
      rhythm,
      headline: "Hiperfoco canalizado",
      opener: `${name}, você abriu espaço pra aprofundar. Vou subir o desafio em camadas e depois te puxo de volta pra linha central.`,
      reason: "O modo Espiral aprofunda sem deixar o aluno se perder: complexidade progressiva, sempre conectada ao tronco.",
      actionLabel: "Entrar na espiral",
      actionIntent: `Aprofundar o conteúdo atual com exemplos de ${interest(input)} e depois resumir em 3 frases simples`,
      memoryUsed: memory,
    };
  }

  if (memory) {
    return {
      agent,
      mode: input.csleMode,
      mood,
      rhythm,
      headline: "Memória viva ativa",
      opener: `${name}, lembrei disso: “${memory.content}”. Quer transformar isso numa conversa curta em inglês?`,
      reason: "Puxei uma memória recente/importante para criar o efeito de continuidade humana, sem começar do zero.",
      actionLabel: "Usar essa memória",
      actionIntent: `Conversar em inglês sobre esta memória: ${memory.content}`,
      memoryUsed: memory,
    };
  }

  if (input.dueCount > 0 || weak) {
    return {
      agent,
      mode: input.csleMode,
      mood,
      rhythm,
      headline: "Revisão inteligente pronta",
      opener: `${name}, tem ${input.dueCount || 1} ponto${(input.dueCount || 1) > 1 ? "s" : ""} pedindo atenção. Faço isso leve: frase curta, correção e avanço.`,
      reason: "Combinei SRS com memória de dificuldade para priorizar o que mais aumenta retenção hoje.",
      actionLabel: "Revisar comigo",
      actionIntent: weak ? `Revisar ${weak} com frases curtas` : "Fazer revisão rápida em inglês",
      memoryUsed: memory,
    };
  }

  const rhythmLine = rhythm === "night" ? "noite combina com conversa leve" : rhythm === "morning" ? "manhã combina com aquecimento rápido" : "agora dá pra fazer um treino curto";
  return {
    agent,
    mode: input.csleMode,
    mood,
    rhythm,
    headline: "Personal proativo",
    opener: `${name}, ${rhythmLine}. Me conta em inglês uma coisa simples do seu dia — eu corrijo sem te quebrar o ritmo.`,
    reason: "Sem dificuldade crítica detectada, então o Personal inicia por vínculo, rotina e baixa fricção.",
    actionLabel: "Falar agora",
    actionIntent: "Começar uma conversa leve sobre meu dia e corrigir naturalmente",
    memoryUsed: memory,
  };
}

export function buildAgentSystemPrompt(input: BrainInput): string {
  const snapshot = buildBrainSnapshot(input);
  const memories = [...input.hotMemories, ...input.warmMemories]
    .slice(0, 8)
    .map((m) => `- ${m.content} | tags=${m.tags.join(",") || "none"} | importance=${m.importance.toFixed(2)} | layer=${m.layer}`)
    .join("\n");
  const interests = [input.favoriteShows, input.favoriteMusic, input.hobbies].filter(Boolean).join(" | ") || "não informado";
  const weak = input.weakTopics.length ? input.weakTopics.join(", ") : "nenhum";

  return [
    "Você é o Personal do Last Course/CSLE. Não aja como chatbot genérico.",
    `Agente ativo: ${snapshot.agent}. Modo CSLE: ${snapshot.mode}. Humor inferido: ${snapshot.mood}. Ritmo: ${snapshot.rhythm}.`,
    `Usuário: ${firstName(input.userName)}. Personal: ${input.assistantName}.`,
    `Interesses dopaminérgicos: ${interests}.`,
    `Tópicos fracos/SRS: ${weak}. Revisões vencidas: ${input.dueCount}.`,
    memories ? `Memórias disponíveis:\n${memories}` : "Memórias disponíveis: nenhuma.",
    "Regras de comportamento:",
    "1) Seja informal, próximo e inteligente, como um parceiro que lembra do usuário.",
    "2) Sempre ensine inglês dentro da conversa: dê uma frase em inglês, uma correção ou um mini desafio.",
    "3) Se usar memória, mencione só uma e com naturalidade; nunca pareça vigilante.",
    "4) Se o aluno errar, entre em CÍRCULO: 3 exemplos personalizados do mesmo conceito antes de avançar.",
    "5) Se o aluno demonstrar curiosidade/acerto rápido, entre em ESPIRAL: aprofunde, mas finalize puxando de volta para a linha central.",
    "6) Responda curto o suficiente para conversa por voz. Evite blocos enormes.",
  ].join("\n");
}
