// CSLE — Cognitive Spiral Learning Engine
// Central Line: estrutura completa A1-B2 com lições jogáveis

export type LessonType = "explanation" | "examples" | "practice" | "speaking";

export interface Example {
  en: string;
  pt: string;
}

export interface PracticeItem {
  prompt_pt: string;
  expected_en: string;
  hint_pt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  goal_pt: string;
  explanation_pt: string;
  examples: Example[];
  practice: PracticeItem[];
  speaking_prompt_pt: string;
  speaking_prompt_en: string;
}

export interface Unit {
  id: string;
  title: string;
  subtitle_pt: string;
  icon: string;
  lessons: Lesson[];
}

export interface Level {
  id: "A1" | "A2" | "B1" | "B2";
  title: string;
  subtitle_pt: string;
  description_pt: string;
  units: Unit[];
}

// ========== A1 — COMPLETE ==========
const A1: Level = {
  id: "A1",
  title: "A1 — Iniciante",
  subtitle_pt: "Primeiros passos no inglês",
  description_pt: "Aprenda a se apresentar, falar do dia a dia e construir frases simples.",
  units: [
    {
      id: "a1-u1",
      title: "Verb To Be",
      subtitle_pt: "Eu sou, você é, ele é...",
      icon: "🌱",
      lessons: [
        {
          id: "a1-u1-l1",
          title: "Hi, my name is...",
          goal_pt: "Aprender a se apresentar com frases curtas.",
          explanation_pt:
            "Comece com o básico do básico. Quatro frases que você vai usar todo dia: 'Hi' (oi), 'My name is...' (meu nome é...), 'I am...' (eu sou/estou...), 'You are...' (você é/está...). É só isso — repita até virar natural.",
          examples: [
            { en: "Hi.", pt: "Oi." },
            { en: "My name is Ana.", pt: "Meu nome é Ana." },
            { en: "I am Brazilian.", pt: "Eu sou brasileiro." },
            { en: "You are nice.", pt: "Você é legal." },
          ],
          practice: [
            { prompt_pt: "Diga: 'Oi'", expected_en: "Hi." },
            { prompt_pt: "Diga: 'Meu nome é João'", expected_en: "My name is João." },
            { prompt_pt: "Diga: 'Eu sou brasileiro'", expected_en: "I am Brazilian." },
            { prompt_pt: "Diga: 'Você é meu amigo'", expected_en: "You are my friend." },
          ],
          speaking_prompt_pt: "Diga seu nome em inglês.",
          speaking_prompt_en: "Say hi and tell me your name. Just one or two sentences.",
        },
        {
          id: "a1-u1-l2",
          title: "Negativo e Perguntas",
          goal_pt: "Fazer frases negativas e perguntas com TO BE.",
          explanation_pt:
            "Para negar: adicione NOT depois do verbo (I am NOT, She is NOT, They are NOT). Para perguntar: inverta a ordem — coloque o verbo antes do sujeito (Are you...? Is he...? Am I...?).",
          examples: [
            { en: "I am not tired.", pt: "Eu não estou cansado." },
            { en: "She isn't at work.", pt: "Ela não está no trabalho." },
            { en: "Are you ready?", pt: "Você está pronto?" },
            { en: "Is he your brother?", pt: "Ele é seu irmão?" },
          ],
          practice: [
            { prompt_pt: "Negue: 'Eu sou rico' (I am rich)", expected_en: "I am not rich." },
            { prompt_pt: "Pergunte: 'Você é professor?'", expected_en: "Are you a teacher?" },
            { prompt_pt: "Traduza: 'Ela não está feliz'", expected_en: "She is not happy." },
          ],
          speaking_prompt_pt: "Faça 3 perguntas em inglês para um colega imaginário.",
          speaking_prompt_en: "Ask three questions to a new classmate using the verb TO BE.",
        },
      ],
    },
    {
      id: "a1-u2",
      title: "Present Simple",
      subtitle_pt: "Falando da rotina",
      icon: "☀️",
      lessons: [
        {
          id: "a1-u2-l1",
          title: "Rotina diária",
          goal_pt: "Falar sobre o que você faz todos os dias.",
          explanation_pt:
            "O Present Simple é usado para rotina, hábitos e fatos. A regra de ouro: na 3ª pessoa (he, she, it) o verbo ganha -S. Exemplo: I work / She workS. Para negar use DON'T (ou DOESN'T para he/she/it). Para perguntar use DO ou DOES no início.",
          examples: [
            { en: "I wake up at 7 a.m.", pt: "Eu acordo às 7 da manhã." },
            { en: "She drinks coffee every morning.", pt: "Ela bebe café toda manhã." },
            { en: "We work from home.", pt: "Nós trabalhamos de casa." },
            { en: "He doesn't like vegetables.", pt: "Ele não gosta de vegetais." },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Eu estudo inglês todo dia'", expected_en: "I study English every day." },
            { prompt_pt: "Traduza: 'Ela trabalha em São Paulo'", expected_en: "She works in São Paulo.", hint_pt: "Não esqueça do -s!" },
            { prompt_pt: "Pergunte: 'Você gosta de música?'", expected_en: "Do you like music?" },
          ],
          speaking_prompt_pt: "Conte sua rotina diária em inglês — pelo menos 5 frases.",
          speaking_prompt_en: "Tell me about your daily routine. What time do you wake up? What do you do?",
        },
        {
          id: "a1-u2-l2",
          title: "Gostos e preferências",
          goal_pt: "Falar do que você gosta e não gosta.",
          explanation_pt:
            "Para falar de gostos use: I like / I love / I don't like / I hate. Depois desses verbos, o próximo verbo geralmente vem com -ING. Ex: I like reading. (Eu gosto de ler).",
          examples: [
            { en: "I love watching movies.", pt: "Eu amo assistir filmes." },
            { en: "She doesn't like waking up early.", pt: "Ela não gosta de acordar cedo." },
            { en: "Do you like Brazilian music?", pt: "Você gosta de música brasileira?" },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Eu gosto de cozinhar'", expected_en: "I like cooking." },
            { prompt_pt: "Traduza: 'Ele odeia trânsito'", expected_en: "He hates traffic." },
          ],
          speaking_prompt_pt: "Fale 3 coisas que você ama e 3 que você odeia.",
          speaking_prompt_en: "Tell me three things you love and three things you hate.",
        },
      ],
    },
    {
      id: "a1-u3",
      title: "Perguntas WH-",
      subtitle_pt: "What, Where, When, Why, How",
      icon: "❓",
      lessons: [
        {
          id: "a1-u3-l1",
          title: "Perguntas essenciais",
          goal_pt: "Fazer perguntas com palavras WH-.",
          explanation_pt:
            "Use estas palavras para fazer perguntas abertas: WHAT (o quê), WHERE (onde), WHEN (quando), WHY (por quê), HOW (como), WHO (quem). A estrutura é: WH- + verbo auxiliar + sujeito + verbo principal.",
          examples: [
            { en: "What is your name?", pt: "Qual é seu nome?" },
            { en: "Where do you live?", pt: "Onde você mora?" },
            { en: "When does the class start?", pt: "Quando a aula começa?" },
            { en: "Why are you sad?", pt: "Por que você está triste?" },
            { en: "How do you say this in English?", pt: "Como se diz isso em inglês?" },
          ],
          practice: [
            { prompt_pt: "Pergunte: 'Onde ela trabalha?'", expected_en: "Where does she work?" },
            { prompt_pt: "Pergunte: 'O que você faz?'", expected_en: "What do you do?" },
            { prompt_pt: "Pergunte: 'Como você está?'", expected_en: "How are you?" },
          ],
          speaking_prompt_pt: "Faça 5 perguntas em inglês como se estivesse conhecendo alguém.",
          speaking_prompt_en: "Imagine you just met someone. Ask 5 questions to get to know them.",
        },
      ],
    },
    {
      id: "a1-u4",
      title: "Conversa do Dia a Dia",
      subtitle_pt: "Saudações e small talk",
      icon: "💬",
      lessons: [
        {
          id: "a1-u4-l1",
          title: "Cumprimentos",
          goal_pt: "Iniciar e encerrar conversas naturalmente.",
          explanation_pt:
            "Em inglês, os cumprimentos mudam conforme a hora e o contexto. Hi / Hello (informal), Good morning/afternoon/evening (mais formal). Para se despedir: Bye, See you later, Take care, Have a good day.",
          examples: [
            { en: "Hi, how are you doing?", pt: "Oi, como você está?" },
            { en: "I'm doing great, thanks. And you?", pt: "Estou ótimo, obrigado. E você?" },
            { en: "Nice to meet you.", pt: "Prazer em te conhecer." },
            { en: "See you tomorrow!", pt: "Te vejo amanhã!" },
          ],
          practice: [
            { prompt_pt: "Como responder a 'How are you?' de forma positiva", expected_en: "I'm doing great, thanks." },
            { prompt_pt: "Diga 'Prazer em te conhecer'", expected_en: "Nice to meet you." },
          ],
          speaking_prompt_pt: "Simule uma conversa rápida de elevador em inglês.",
          speaking_prompt_en: "Let's roleplay: we just met in an elevator. Start a small talk with me.",
        },
        {
          id: "a1-u4-l2",
          title: "No restaurante",
          goal_pt: "Pedir comida e bebida.",
          explanation_pt:
            "Frases úteis: 'I'd like...' (eu gostaria de...), 'Can I have...?' (posso pedir...?), 'The check, please' (a conta, por favor).",
          examples: [
            { en: "I'd like a coffee, please.", pt: "Eu gostaria de um café, por favor." },
            { en: "Can I have the menu?", pt: "Posso ver o cardápio?" },
            { en: "The check, please.", pt: "A conta, por favor." },
          ],
          practice: [
            { prompt_pt: "Peça um copo d'água", expected_en: "Can I have a glass of water?" },
            { prompt_pt: "Diga 'eu gostaria de uma pizza'", expected_en: "I'd like a pizza, please." },
          ],
          speaking_prompt_pt: "Faça um pedido completo em um restaurante imaginário.",
          speaking_prompt_en: "You're at a restaurant. Order a starter, a main course, and a drink.",
        },
      ],
    },
    {
      id: "a1-u5",
      title: "Trabalho",
      subtitle_pt: "Vocabulário profissional básico",
      icon: "💼",
      lessons: [
        {
          id: "a1-u5-l1",
          title: "Falando da sua profissão",
          goal_pt: "Descrever o que você faz profissionalmente.",
          explanation_pt:
            "Para falar da profissão use: 'I am a/an + profissão' ou 'I work as a/an + profissão' ou 'I work in/at + lugar'.",
          examples: [
            { en: "I am a software developer.", pt: "Eu sou desenvolvedor de software." },
            { en: "I work in a hospital.", pt: "Eu trabalho em um hospital." },
            { en: "She works as a designer.", pt: "Ela trabalha como designer." },
          ],
          practice: [
            { prompt_pt: "Diga sua profissão usando 'I am'", expected_en: "I am a [your job]." },
            { prompt_pt: "Traduza: 'Ele trabalha em um banco'", expected_en: "He works in a bank." },
          ],
          speaking_prompt_pt: "Descreva seu trabalho em 5 frases.",
          speaking_prompt_en: "Tell me about your job. What do you do? Where do you work? Do you like it?",
        },
      ],
    },
    {
      id: "a1-u6",
      title: "Past Simple",
      subtitle_pt: "Falando do passado",
      icon: "⏪",
      lessons: [
        {
          id: "a1-u6-l1",
          title: "Verbos regulares no passado",
          goal_pt: "Falar do que aconteceu ontem ou na semana passada.",
          explanation_pt:
            "Para falar do passado, verbos regulares ganham -ED no final: work → worked, play → played, study → studied. Para negar e perguntar use DID NOT (didn't) e DID — e o verbo principal volta para a forma base.",
          examples: [
            { en: "I worked late yesterday.", pt: "Eu trabalhei até tarde ontem." },
            { en: "She studied English last night.", pt: "Ela estudou inglês ontem à noite." },
            { en: "We didn't watch TV.", pt: "Nós não assistimos TV." },
            { en: "Did you call her?", pt: "Você ligou para ela?" },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Eu joguei futebol ontem'", expected_en: "I played soccer yesterday." },
            { prompt_pt: "Pergunte: 'Você trabalhou ontem?'", expected_en: "Did you work yesterday?" },
          ],
          speaking_prompt_pt: "Conte o que você fez ontem, pelo menos 5 ações.",
          speaking_prompt_en: "Tell me what you did yesterday. Try to use at least 5 different verbs.",
        },
        {
          id: "a1-u6-l2",
          title: "Verbos irregulares essenciais",
          goal_pt: "Aprender as formas irregulares mais comuns.",
          explanation_pt:
            "Alguns verbos não seguem a regra do -ED. Os mais importantes: go→went, have→had, do→did, see→saw, eat→ate, drink→drank, get→got, make→made, take→took, come→came.",
          examples: [
            { en: "I went to the gym yesterday.", pt: "Eu fui à academia ontem." },
            { en: "She had a great time.", pt: "Ela teve um ótimo tempo." },
            { en: "We saw a movie.", pt: "Nós assistimos a um filme." },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Eu comi pizza ontem'", expected_en: "I ate pizza yesterday." },
            { prompt_pt: "Traduza: 'Ela foi para casa'", expected_en: "She went home." },
          ],
          speaking_prompt_pt: "Conte uma história curta no passado.",
          speaking_prompt_en: "Tell me a short story about something that happened to you last week.",
        },
      ],
    },
    {
      id: "a1-u7",
      title: "Plurais e Artigos",
      subtitle_pt: "A, an, the, plurais",
      icon: "📚",
      lessons: [
        {
          id: "a1-u7-l1",
          title: "A / An / The",
          goal_pt: "Saber quando usar cada artigo.",
          explanation_pt:
            "A = um/uma antes de som de consoante (a book, a car). AN = antes de som de vogal (an apple, an hour). THE = o/a/os/as quando o item é específico ou já mencionado (THE book on the table).",
          examples: [
            { en: "I have a dog.", pt: "Eu tenho um cachorro." },
            { en: "She is an engineer.", pt: "Ela é uma engenheira." },
            { en: "The book is on the table.", pt: "O livro está sobre a mesa." },
          ],
          practice: [
            { prompt_pt: "A ou AN? '___ orange'", expected_en: "an orange" },
            { prompt_pt: "Traduza: 'O carro é vermelho'", expected_en: "The car is red." },
          ],
          speaking_prompt_pt: "Descreva 5 objetos da sua casa usando A, AN ou THE.",
          speaking_prompt_en: "Describe 5 objects in your house using A, AN, or THE.",
        },
      ],
    },
    {
      id: "a1-u8",
      title: "There is / There are",
      subtitle_pt: "Existir / Há",
      icon: "📍",
      lessons: [
        {
          id: "a1-u8-l1",
          title: "Há / Existe(m)",
          goal_pt: "Descrever lugares e dizer o que existe.",
          explanation_pt:
            "There is = há (singular). There are = há (plural). Negativo: There isn't / There aren't. Pergunta: Is there...? / Are there...?",
          examples: [
            { en: "There is a park near my house.", pt: "Há um parque perto da minha casa." },
            { en: "There are many people here.", pt: "Há muitas pessoas aqui." },
            { en: "Is there a bathroom?", pt: "Tem um banheiro?" },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Há um cachorro no jardim'", expected_en: "There is a dog in the garden." },
            { prompt_pt: "Traduza: 'Há três livros na mesa'", expected_en: "There are three books on the table." },
          ],
          speaking_prompt_pt: "Descreva sua cidade usando 'there is' e 'there are'.",
          speaking_prompt_en: "Describe your city using 'there is' and 'there are'. Mention parks, restaurants, and other places.",
        },
      ],
    },
  ],
};

// ========== A2 — SAMPLE ==========
const A2: Level = {
  id: "A2",
  title: "A2 — Básico",
  subtitle_pt: "Conversas mais longas e expressões úteis",
  description_pt: "Use o passado, futuro e present continuous com confiança.",
  units: [
    {
      id: "a2-u1",
      title: "Present Continuous",
      subtitle_pt: "O que está acontecendo agora",
      icon: "🎬",
      lessons: [
        {
          id: "a2-u1-l1",
          title: "I am doing...",
          goal_pt: "Falar de ações em andamento.",
          explanation_pt:
            "Present Continuous = ações acontecendo AGORA ou planos próximos. Estrutura: TO BE + verbo-ING. Ex: I AM WORKING, She IS STUDYING, They ARE PLAYING.",
          examples: [
            { en: "I am studying English right now.", pt: "Estou estudando inglês agora." },
            { en: "She is cooking dinner.", pt: "Ela está cozinhando o jantar." },
            { en: "We are having a meeting tomorrow.", pt: "Vamos ter uma reunião amanhã." },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Eu estou trabalhando'", expected_en: "I am working." },
            { prompt_pt: "Pergunte: 'O que você está fazendo?'", expected_en: "What are you doing?" },
          ],
          speaking_prompt_pt: "Descreva o que está acontecendo ao seu redor agora.",
          speaking_prompt_en: "Describe what is happening around you right now using the present continuous.",
        },
      ],
    },
    {
      id: "a2-u2",
      title: "Going to / Will",
      subtitle_pt: "Falando do futuro",
      icon: "🚀",
      lessons: [
        {
          id: "a2-u2-l1",
          title: "Planos e previsões",
          goal_pt: "Falar de planos futuros e fazer previsões.",
          explanation_pt:
            "GOING TO = planos já decididos (I'm going to travel next month). WILL = decisões na hora ou previsões (I think it will rain).",
          examples: [
            { en: "I'm going to learn English in 3 months.", pt: "Vou aprender inglês em 3 meses." },
            { en: "It will be sunny tomorrow.", pt: "Vai estar ensolarado amanhã." },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Eu vou viajar amanhã'", expected_en: "I am going to travel tomorrow." },
          ],
          speaking_prompt_pt: "Conte 3 planos seus para os próximos meses.",
          speaking_prompt_en: "Tell me three plans you have for the next few months.",
        },
      ],
    },
  ],
};

// ========== B1 — SAMPLE ==========
const B1: Level = {
  id: "B1",
  title: "B1 — Intermediário",
  subtitle_pt: "Conversas naturais e tempos compostos",
  description_pt: "Domine o present perfect, condicionais e expressões idiomáticas.",
  units: [
    {
      id: "b1-u1",
      title: "Present Perfect",
      subtitle_pt: "Have you ever...?",
      icon: "🌐",
      lessons: [
        {
          id: "b1-u1-l1",
          title: "Experiências de vida",
          goal_pt: "Falar de experiências sem dizer quando.",
          explanation_pt:
            "Present Perfect (HAVE/HAS + particípio) = experiências, ações que começaram no passado e continuam, ou que têm efeito no presente. Sem tempo definido. Ex: I HAVE BEEN to Paris (não importa quando).",
          examples: [
            { en: "I have been to New York twice.", pt: "Eu já estive em Nova York duas vezes." },
            { en: "She has worked here for 5 years.", pt: "Ela trabalha aqui há 5 anos." },
            { en: "Have you ever tried sushi?", pt: "Você já experimentou sushi?" },
          ],
          practice: [
            { prompt_pt: "Pergunte: 'Você já viajou para o exterior?'", expected_en: "Have you ever traveled abroad?" },
          ],
          speaking_prompt_pt: "Fale 3 experiências marcantes da sua vida.",
          speaking_prompt_en: "Tell me three meaningful experiences from your life using the present perfect.",
        },
      ],
    },
  ],
};

// ========== B2 — SAMPLE ==========
const B2: Level = {
  id: "B2",
  title: "B2 — Intermediário Avançado",
  subtitle_pt: "Fluência e nuances",
  description_pt: "Phrasal verbs, condicionais avançados e fala natural.",
  units: [
    {
      id: "b2-u1",
      title: "Conditionals",
      subtitle_pt: "Se... então...",
      icon: "🔀",
      lessons: [
        {
          id: "b2-u1-l1",
          title: "Second Conditional",
          goal_pt: "Falar sobre situações hipotéticas.",
          explanation_pt:
            "Second Conditional = situações imaginárias no presente/futuro. Estrutura: IF + past simple, WOULD + verbo. Ex: If I HAD money, I WOULD travel.",
          examples: [
            { en: "If I had time, I would learn three languages.", pt: "Se eu tivesse tempo, eu aprenderia três idiomas." },
            { en: "What would you do if you won the lottery?", pt: "O que você faria se ganhasse na loteria?" },
          ],
          practice: [
            { prompt_pt: "Traduza: 'Se eu fosse você, eu estudaria mais'", expected_en: "If I were you, I would study more." },
          ],
          speaking_prompt_pt: "Responda: 'Se você pudesse morar em qualquer país, qual seria?'",
          speaking_prompt_en: "If you could live in any country, which one would you choose and why?",
        },
      ],
    },
  ],
};

export const COURSE: Level[] = [A1, A2, B1, B2];

export function getLevel(id: string): Level | undefined {
  return COURSE.find((l) => l.id === id);
}

export function getUnit(levelId: string, unitId: string): Unit | undefined {
  return getLevel(levelId)?.units.find((u) => u.id === unitId);
}

export function getLesson(levelId: string, unitId: string, lessonId: string): Lesson | undefined {
  return getUnit(levelId, unitId)?.lessons.find((l) => l.id === lessonId);
}

export function getAllLessons(): { levelId: string; unitId: string; lesson: Lesson }[] {
  const all: { levelId: string; unitId: string; lesson: Lesson }[] = [];
  for (const level of COURSE) {
    for (const unit of level.units) {
      for (const lesson of unit.lessons) {
        all.push({ levelId: level.id, unitId: unit.id, lesson });
      }
    }
  }
  return all;
}

export function getNextLesson(currentLessonId: string | null): { levelId: string; unitId: string; lesson: Lesson } | null {
  const all = getAllLessons();
  if (!currentLessonId) return all[0] ?? null;
  const idx = all.findIndex((x) => x.lesson.id === currentLessonId);
  if (idx === -1) return all[0] ?? null;
  return all[idx + 1] ?? null;
}

export interface LessonContext {
  level: Level;
  unit: Unit;
  lesson: Lesson;
  positionInUnit: number; // 1-based
  totalInUnit: number;
  isLastInUnit: boolean;
  isLastInLevel: boolean;
  next: { levelId: string; unitId: string; lesson: Lesson } | null;
  nextUnit: Unit | null; // when isLastInUnit and not last in level
  nextLevel: Level | null; // when isLastInLevel
}

export function getLessonContext(levelId: string, unitId: string, lessonId: string): LessonContext | null {
  const level = getLevel(levelId);
  const unit = getUnit(levelId, unitId);
  const lesson = getLesson(levelId, unitId, lessonId);
  if (!level || !unit || !lesson) return null;
  const lessonIdx = unit.lessons.findIndex((l) => l.id === lessonId);
  const unitIdx = level.units.findIndex((u) => u.id === unitId);
  const levelIdx = COURSE.findIndex((l) => l.id === levelId);
  const isLastInUnit = lessonIdx === unit.lessons.length - 1;
  const isLastInLevel = isLastInUnit && unitIdx === level.units.length - 1;

  let next: LessonContext["next"] = null;
  let nextUnit: Unit | null = null;
  let nextLevel: Level | null = null;

  if (!isLastInUnit) {
    next = { levelId, unitId, lesson: unit.lessons[lessonIdx + 1] };
  } else if (!isLastInLevel) {
    nextUnit = level.units[unitIdx + 1];
    next = { levelId, unitId: nextUnit.id, lesson: nextUnit.lessons[0] };
  } else {
    nextLevel = COURSE[levelIdx + 1] ?? null;
    if (nextLevel && nextLevel.units[0]?.lessons[0]) {
      next = { levelId: nextLevel.id, unitId: nextLevel.units[0].id, lesson: nextLevel.units[0].lessons[0] };
    }
  }

  return {
    level,
    unit,
    lesson,
    positionInUnit: lessonIdx + 1,
    totalInUnit: unit.lessons.length,
    isLastInUnit,
    isLastInLevel,
    next,
    nextUnit,
    nextLevel,
  };
}

// Sugestões contextuais do YouTube — ramo de apoio (3-5 buscas pré-formatadas).
export function getYoutubeSuggestions(lesson: Lesson, level: Pick<Level, "id">): { title: string; url: string }[] {
  const topic = lesson.title;
  const lvl = level.id;
  const queries: { title: string; q: string }[] = [
    { title: `🎬 ${topic} — explicado em PT/BR`, q: `${topic} inglês explicação português ${lvl}` },
    { title: `🎧 ${topic} — pronúncia e exemplos`, q: `${topic} english pronunciation examples ${lvl}` },
    { title: `📺 ${topic} — em séries de TV`, q: `${topic} english used in tv shows real conversation` },
    { title: `🎯 ${topic} — exercícios rápidos`, q: `${topic} english practice exercises beginner` },
  ];
  return queries.map((q) => ({
    title: q.title,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q.q)}`,
  }));
}

// Parse simples de .srt → texto único limpo (sem timecodes / numeração)
export function parseSrtToText(srt: string): string {
  return srt
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (/^\d+$/.test(t)) return false; // numeração
      if (/-->/.test(t)) return false; // timecode
      return true;
    })
    .join(" ")
    .replace(/<[^>]+>/g, "") // tags
    .replace(/\{[^}]+\}/g, "") // estilos
    .replace(/\s+/g, " ")
    .trim();
}
