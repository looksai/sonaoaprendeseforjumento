// Micro-praise system — controlled variation so the brain stays engaged.
// Used after every meaningful interaction. Tone: adult, calm, never childish.
// Rule: never repeat the same line twice in a row (per category).

type Category = "correct" | "partial" | "struggled" | "speakingWell" | "lessonDone";

const POOLS: Record<Category, string[]> = {
  correct: [
    "Limpo. Continua.",
    "Boa — saiu natural.",
    "Isso. Está mais rápido.",
    "Exato.",
    "Bem dito.",
    "Foi direto ao ponto.",
  ],
  partial: [
    "Quase — tenta de novo.",
    "Está perto. Ajusta e segue.",
    "Bom esforço — só uma correção.",
    "Quase lá. Olha a forma certa abaixo.",
  ],
  struggled: [
    "Sem pressa — vou trazer isso de novo.",
    "Anotado. A gente reforça em breve.",
    "Tudo bem travar. Marquei pra revisar.",
  ],
  speakingWell: [
    "Saiu firme. Som natural.",
    "Boa pronúncia. Mantém esse ritmo.",
    "Mandou bem — dá pra subir o nível.",
  ],
  lessonDone: [
    "Lição fechada. Você está mais solto.",
    "Pronto. Sente a diferença em frases curtas?",
    "Mais uma na conta — você está construindo base.",
    "Concluído. Amanhã a gente avança.",
  ],
};

const lastShown: Partial<Record<Category, string>> = {};

export function praise(cat: Category): string {
  const pool = POOLS[cat];
  const last = lastShown[cat];
  const choices = pool.length > 1 ? pool.filter((p) => p !== last) : pool;
  const pick = choices[Math.floor(Math.random() * choices.length)];
  lastShown[cat] = pick;
  return pick;
}

// Return triggers — leave an "open loop" so the user wants to come back.
// Used at end of lesson / session.
const RETURN_TEASERS = [
  "Amanhã a gente solta isso na fala.",
  "Da próxima: você responde sem pensar.",
  "Próxima sessão: usar isso numa conversa real.",
  "Em breve: testar isso com episódio de série.",
  "Amanhã isso volta na revisão — pra fixar.",
];

let lastTeaser: string | null = null;
export function returnTeaser(): string {
  const choices = RETURN_TEASERS.filter((t) => t !== lastTeaser);
  const pick = choices[Math.floor(Math.random() * choices.length)];
  lastTeaser = pick;
  return pick;
}
