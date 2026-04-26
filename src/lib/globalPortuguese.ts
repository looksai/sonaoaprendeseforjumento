export type PortugueseMode = "english" | "spanish" | "french" | "mixed";
export type SubscriptionTier = "free" | "global" | "native_plus";
export type AccentId = "nordeste" | "carioca" | "paulista" | "mineiro" | "sul" | "norte";

export type AccentPack = {
  id: AccentId;
  name: string;
  region: string;
  listeningDifficulty: 1 | 2 | 3 | 4 | 5;
  samplePhrase: string;
  meaningEN: string;
  notes: string[];
  roomName: string;
};

export type PortugueseTrackUnit = {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  title: string;
  lineGoal: string;
  circleExamples: string[];
  spiralPrompts: string[];
};

export type CreditPackage = {
  id: string;
  label: string;
  credits: number;
  price: string;
  description: string;
};

export const ACCENT_PACKS: AccentPack[] = [
  {
    id: "nordeste",
    name: "Nordeste raiz",
    region: "PE / BA / CE / RN",
    listeningDifficulty: 4,
    samplePhrase: "Oxente, bora ali rapidinho tomar um café?",
    meaningEN: "Hey, let's go over there quickly to have coffee?",
    notes: ["Ritmo mais musical", "Expressões como oxente, visse, mainha", "Ótimo para escuta real de rua"],
    roomName: "Português Nordeste Raiz",
  },
  {
    id: "carioca",
    name: "Carioca cotidiano",
    region: "Rio de Janeiro",
    listeningDifficulty: 4,
    samplePhrase: "Pô, fechou então, a gente se encontra mais tarde.",
    meaningEN: "Cool, deal, we meet later.",
    notes: ["S e R bem marcados", "Gírias urbanas", "Muito útil para música, praia e conversa informal"],
    roomName: "Sotaque Carioca",
  },
  {
    id: "paulista",
    name: "Paulista urbano",
    region: "São Paulo",
    listeningDifficulty: 3,
    samplePhrase: "Meu, pega o metrô e desce na próxima estação.",
    meaningEN: "Dude, take the subway and get off at the next station.",
    notes: ["Ritmo mais direto", "Vocabulário urbano/profissional", "Bom para negócios e vida na cidade"],
    roomName: "Português São Paulo",
  },
  {
    id: "mineiro",
    name: "Mineiro afetivo",
    region: "Minas Gerais",
    listeningDifficulty: 3,
    samplePhrase: "Uai, cê vai mesmo? Então toma um cafézim antes.",
    meaningEN: "Oh, are you really going? Then have a little coffee first.",
    notes: ["Contrações naturais", "Tom afetivo", "Excelente para entender fala reduzida"],
    roomName: "Português Mineiro",
  },
  {
    id: "sul",
    name: "Sul brasileiro",
    region: "RS / SC / PR",
    listeningDifficulty: 3,
    samplePhrase: "Bah, que frio hoje. Vamos tomar um chimarrão?",
    meaningEN: "Wow, it's cold today. Shall we have chimarrão?",
    notes: ["Influências regionais fortes", "Vocabulário cultural", "Bom para viagens ao Sul"],
    roomName: "Português do Sul",
  },
  {
    id: "norte",
    name: "Norte amazônico",
    region: "PA / AM",
    listeningDifficulty: 5,
    samplePhrase: "Égua, essa comida tá muito boa mesmo.",
    meaningEN: "Wow, this food is really good.",
    notes: ["Expressões próprias", "Ritmo e vocabulário ricos", "Treino avançado de escuta real"],
    roomName: "Português Norte",
  },
];

export const PORTUGUESE_TRACK: PortugueseTrackUnit[] = [
  {
    id: "pt-a1-survival",
    level: "A1",
    title: "Sobrevivência no Brasil",
    lineGoal: "Cumprimentar, pedir ajuda e se apresentar sem travar.",
    circleExamples: ["Oi, tudo bem?", "Meu nome é Alex.", "Você fala inglês?", "Onde fica o banheiro?"],
    spiralPrompts: ["Transformar em pergunta", "Trocar para situação de aeroporto", "Ouvir com sotaque nordestino"],
  },
  {
    id: "pt-a2-food",
    level: "A2",
    title: "Comida, mercado e restaurante",
    lineGoal: "Pedir comida, entender preço e explicar preferência.",
    circleExamples: ["Eu quero um café, por favor.", "Sem cebola, por favor.", "Quanto custa?", "Pode dividir a conta?"],
    spiralPrompts: ["Falar com garçom rápido", "Comparar gírias por região", "Treinar áudio de balcão barulhento"],
  },
  {
    id: "pt-b1-social",
    level: "B1",
    title: "Conversa real com nativos",
    lineGoal: "Manter papo informal sem traduzir tudo mentalmente.",
    circleExamples: ["O que você faz da vida?", "Você curte que tipo de música?", "Foi mal, não entendi essa parte.", "Pode falar mais devagar?"],
    spiralPrompts: ["Usar humor leve", "Entrar em sala regional", "Gravar resposta de voz"],
  },
  {
    id: "pt-b2-work",
    level: "B2",
    title: "Português profissional",
    lineGoal: "Participar de reunião, apresentar ideia e negociar.",
    circleExamples: ["Na minha opinião...", "Podemos alinhar isso amanhã?", "Eu tenho uma proposta.", "Qual é o próximo passo?"],
    spiralPrompts: ["Simular reunião", "Formal vs informal", "Feedback de pronúncia"],
  },
];

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", label: "Starter", credits: 30, price: "US$ 4.90", description: "Teste uma chamada curta com nativo." },
  { id: "practice", label: "Practice", credits: 90, price: "US$ 12.90", description: "Três conversas rápidas de 10 minutos." },
  { id: "deep", label: "Deep Talk", credits: 240, price: "US$ 29.90", description: "Sessões longas para sotaque e fluência." },
];

export function getTierLabel(tier: SubscriptionTier) {
  if (tier === "native_plus") return "Native+";
  if (tier === "global") return "Global PT-BR";
  return "Free Preview";
}

export function getTutorLanguageLabel(mode: PortugueseMode) {
  if (mode === "spanish") return "Espanhol → Português";
  if (mode === "french") return "Francês → Português";
  if (mode === "mixed") return "Multilíngue";
  return "English → Portuguese";
}

export function estimateCallCost(minutes: number) {
  return Math.max(5, Math.ceil(minutes * 3));
}
