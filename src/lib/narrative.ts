// Narrative-of-evolution: replace cold "30% complete" with phrases that
// describe what the user can DO at this stage. Keeps the home screen
// emotional and meaningful instead of mechanical.

export function evolutionLine(level: string, completedCount: number): string {
  if (completedCount === 0) {
    return "Hoje começa a sua jornada — vamos com calma e firme.";
  }
  if (level === "A1") {
    if (completedCount < 3) return "Você está soltando suas primeiras frases reais.";
    return "Você já está montando frases simples sozinho — sinta isso.";
  }
  if (level === "A2") {
    if (completedCount < 8) return "Você já segura uma conversa básica do dia a dia.";
    return "Suas frases estão começando a fluir — está pegando ritmo.";
  }
  if (level === "B1") {
    return "Você já entende conversas reais e responde com confiança.";
  }
  if (level === "B2") {
    return "Você está pensando em inglês — não traduzindo mais.";
  }
  return "Cada lição te leva mais perto de pensar em inglês.";
}

export function retentionNudge(daysSinceLast: number | null): string | null {
  if (daysSinceLast === null) return null;
  if (daysSinceLast === 1) return "Vamos terminar o que você começou ontem.";
  if (daysSinceLast >= 2 && daysSinceLast <= 4)
    return `Faz ${daysSinceLast} dias — bora retomar do ponto certo.`;
  if (daysSinceLast >= 5)
    return "Sentimos sua falta. Comece com uma revisão rápida hoje.";
  return null;
}
