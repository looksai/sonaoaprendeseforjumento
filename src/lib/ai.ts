import { supabase } from "@/integrations/supabase/client";
import type { DopamineProfile } from "@/store/useProgress";

interface SpiralResponse {
  deeper_explanation_pt: string;
  advanced_examples: { en: string; pt: string }[];
  variations: { context_pt: string; en: string; pt: string }[];
  challenge_pt: string;
}

interface CheckResponse {
  correct: boolean;
  score: number;
  feedback_pt: string;
  corrected_en: string;
  tip_pt: string;
}

function profileForAi(p: DopamineProfile | null) {
  if (!p) return undefined;
  return {
    name: p.name,
    favoriteShows: p.favoriteShows,
    favoriteMusic: p.favoriteMusic,
    hobbies: p.hobbies,
    motivation: p.motivation,
  };
}

async function callAi<T>(body: Record<string, unknown>): Promise<T> {
  try {
    const { data, error } = await supabase.functions.invoke("csle-ai", { body });
    if (error) {
      // Try to surface the function's JSON error message if present.
      const ctx = (error as { context?: { error?: string } }).context;
      const msg = ctx?.error || error.message || "A IA está indisponível no momento. Tente novamente.";
      throw new Error(msg);
    }
    if (data && typeof data === "object" && "error" in data) {
      throw new Error(String((data as { error: string }).error));
    }
    return data as T;
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("A IA está indisponível no momento. Tente novamente.");
  }
}

export async function spiralDeeper(args: {
  topic: string;
  explanation_pt: string;
  examples: { en: string; pt: string }[];
  level: string;
  profile: DopamineProfile | null;
}): Promise<SpiralResponse> {
  return callAi<SpiralResponse>({
    mode: "spiral",
    topic: args.topic,
    explanation_pt: args.explanation_pt,
    examples: args.examples,
    level: args.level,
    profile: profileForAi(args.profile),
  });
}

export async function checkAnswer(args: {
  prompt_pt: string;
  expected_en: string;
  user_answer: string;
}): Promise<CheckResponse> {
  return callAi<CheckResponse>({
    mode: "check",
    prompt_pt: args.prompt_pt,
    expected_en: args.expected_en,
    user_answer: args.user_answer,
  });
}

export async function chatWithMia(args: {
  messages: { role: "user" | "assistant"; content: string }[];
  level: string;
  profile: DopamineProfile | null;
  voiceMode?: "off" | "normal" | "driving";
  weakTopics?: string[];
  guided?: boolean;
  assistantName?: string;
}): Promise<{ reply: string }> {
  return callAi<{ reply: string }>({
    mode: "chat",
    messages: args.messages,
    level: args.level,
    profile: profileForAi(args.profile),
    voice_mode: args.voiceMode ?? "off",
    weak_topics: args.weakTopics ?? [],
    guided: args.guided ?? true,
    assistant_name: args.assistantName ?? "Mia",
  });
}

export interface EpisodePhrase {
  en: string;
  pt: string;
  why_pt: string;
  context_pt: string;
  related_to_lesson: boolean;
}

export async function fetchEpisodePhrases(args: {
  series: string;
  season?: string;
  episode?: string;
  title?: string;
  lesson_topic: string;
  level: string;
}): Promise<{ episode_summary_pt: string; phrases: EpisodePhrase[] }> {
  return callAi({
    mode: "episode_phrases",
    series: args.series,
    season: args.season,
    episode: args.episode,
    title: args.title,
    lesson_topic: args.lesson_topic,
    level: args.level,
  });
}

export interface ExtractedPhrase {
  en: string;
  pt: string;
  why_pt: string;
  related_to_lesson: boolean;
}

export interface EpisodeMeta {
  series: string;
  season?: number | string;
  episode?: number | string;
  title?: string;
}

export async function extractPhrasesFromSubtitle(args: {
  subtitle_text: string;
  lesson_topic: string;
  level: string;
  episode?: EpisodeMeta;
}): Promise<{ phrases: ExtractedPhrase[] }> {
  return callAi<{ phrases: ExtractedPhrase[] }>({
    mode: "extract_phrases",
    subtitle_text: args.subtitle_text,
    lesson_topic: args.lesson_topic,
    level: args.level,
    episode: args.episode,
  });
}

export interface MusicPhrase {
  en: string;
  pt: string;
  tip_pt: string;
}

export async function fetchMusicPractice(args: {
  artist: string;
  mood?: string;
  lesson_topic: string;
  level: string;
}): Promise<{ style_pt: string; phrases: MusicPhrase[] }> {
  return callAi({
    mode: "music_practice",
    artist: args.artist,
    mood: args.mood,
    lesson_topic: args.lesson_topic,
    level: args.level,
  });
}

export interface PhoneticItem {
  word: string;
  pt_adapted: string;
  ipa: string;
  tip_pt: string;
}

export async function fetchPhonetics(words: string[]): Promise<{ items: PhoneticItem[] }> {
  return callAi<{ items: PhoneticItem[] }>({ mode: "phonetics", words });
}

// ============= Personalized lesson example =============
// Gera um exemplo personalizado baseado nos interesses do usuário para uma lição.
// Usado dentro da tela de lição para substituir 1 exemplo estático.

export interface PersonalizedExample {
  en: string;
  pt: string;
  context_pt: string; // ex: "No estilo de Breaking Bad"
}

export async function fetchPersonalizedExample(args: {
  lesson_topic: string;
  grammar_point: string; // ex: "Present Simple affirmative"
  profile: DopamineProfile | null;
  level: string;
}): Promise<PersonalizedExample | null> {
  if (!args.profile) return null;
  const interests = [
    args.profile.favoriteShows,
    args.profile.favoriteMusic,
    args.profile.hobbies,
  ]
    .filter(Boolean)
    .join(", ");
  if (!interests) return null;
  try {
    return await callAi<PersonalizedExample>({
      mode: "personalized_example",
      lesson_topic: args.lesson_topic,
      grammar_point: args.grammar_point,
      interests,
      level: args.level,
    });
  } catch {
    return null; // graceful fallback — lição continua com exemplos estáticos
  }
}
