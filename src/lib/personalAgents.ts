import type { CSLEMode } from "@/store/useCSLE";
import type { MemoryEvent } from "@/store/useMemory";

export type PersonalAgent = "Tutor" | "Companion" | "Navigator" | "Proactive";

export interface AgentContext {
  csleMode: CSLEMode;
  weakTopics: string[];
  hotMemories: MemoryEvent[];
  userName?: string | null;
  assistantName: string;
  intent?: string;
}

function firstName(name?: string | null) {
  return name?.split(" ")[0]?.trim() || "amigo";
}

export function pickPersonalAgent(ctx: AgentContext): PersonalAgent {
  if (ctx.csleMode === "CIRCLE") return "Tutor";
  if (ctx.csleMode === "SPIRAL") return "Navigator";
  if (ctx.intent || ctx.hotMemories.length > 0) return "Companion";
  return "Proactive";
}

export function buildAgentSystemHint(ctx: AgentContext): string {
  const agent = pickPersonalAgent(ctx);
  const memories = ctx.hotMemories
    .slice(0, 3)
    .map((m) => `- ${m.content} [tags: ${m.tags.join(", ") || "sem tags"}]`)
    .join("\n");
  const weak = ctx.weakTopics.length ? ctx.weakTopics.join(", ") : "nenhum tópico fraco detectado";

  return [
    `AGENTE ATIVO: ${agent}.`,
    `MODO CSLE: ${ctx.csleMode}.`,
    `USUÁRIO: ${firstName(ctx.userName)}. PERSONAL: ${ctx.assistantName}.`,
    `TÓPICOS FRACOS: ${weak}.`,
    memories ? `MEMÓRIAS RECENTES IMPORTANTES:\n${memories}` : "MEMÓRIAS RECENTES IMPORTANTES: nenhuma.",
    "COMPORTAMENTO:",
    "- Seja informal, próximo e útil, como um personal de aprendizado.",
    "- Ensine inglês sem perder a conversa humana.",
    "- Se o modo for CIRCLE, gere exemplos variados do mesmo conceito antes de avançar.",
    "- Se o modo for SPIRAL, aprofunde com desafio progressivo e depois puxe de volta para a linha principal.",
    "- Se houver memória recente relevante, mencione com cuidado e naturalidade, sem soar invasivo.",
  ].join("\n");
}

export function buildProactiveOpener(ctx: AgentContext): string {
  const name = firstName(ctx.userName);
  const memory = ctx.hotMemories[0];
  if (ctx.intent) {
    return `${ctx.assistantName} aqui. ${ctx.intent}.\nReady? Me responde em inglês do seu jeito — eu ajusto com você.`;
  }
  if (memory) {
    return `E aí, ${name}. Eu lembrei disso: ${memory.content}\nQuer me contar em inglês como isso ficou hoje? Pode ser frase curta.`;
  }
  if (ctx.weakTopics[0]) {
    return `${name}, bora destravar ${ctx.weakTopics[0]} hoje? Me manda uma frase em inglês e eu te guio sem pressão.`;
  }
  return `Hi ${name}! I'm ${ctx.assistantName}, your personal coach. Como foi seu dia? Me conta em inglês, nem que seja simples.`;
}
