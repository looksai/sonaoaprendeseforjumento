import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhrasePlayer } from "@/components/PhrasePlayer";
import { SpeechRateToggle } from "@/components/SpeechRateToggle";
import { PronunciationPractice } from "@/components/PronunciationPractice";
import { getLessonContext, getYoutubeSuggestions } from "@/data/course";
import { useProgress } from "@/store/useProgress";
import { useSpeech, getSavedRate, type SpeechRate } from "@/hooks/useSpeech";
import { AdaptiveReason } from "@/components/AdaptiveReason";
import { CSLEModeBanner } from "@/components/CSLEModeBanner";
import {
  fetchPersonalizedExample,
  spiralDeeper,
  checkAnswer,
  type PersonalizedExample,
} from "@/lib/ai";
import { useMemory, type SpeakingResult } from "@/store/useMemory";
import { useSRS } from "@/store/useSRS";
import { useCSLE } from "@/store/useCSLE";
import { usePersonalExperienceV4 } from "@/store/usePersonalExperienceV4";
import { useGamification } from "@/store/useGamification";
import {
  ArrowLeft,
  Sparkles,
  Mic,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Lightbulb,
  Youtube,
  Trophy,
  ArrowRight,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { awardXP } from "@/lib/xp";
import { logEvent } from "@/lib/events";
import { praise, returnTeaser } from "@/lib/praise";

export const Route = createFileRoute("/licao/$levelId/$unitId/$lessonId")({
  head: () => ({
    meta: [
      { title: "CSLE — Lição" },
      {
        name: "description",
        content: "Lição estruturada CSLE: explicação, exemplos, prática e fala.",
      },
    ],
  }),
  component: LicaoGuarded,
});

interface SpiralData {
  deeper_explanation_pt: string;
  advanced_examples: { en: string; pt: string }[];
  variations: { context_pt: string; en: string; pt: string }[];
  challenge_pt: string;
}

function Licao() {
  const { levelId, unitId, lessonId } = Route.useParams();
  const navigate = useNavigate();
  const progress = useProgress();
  const memory = useMemory();
  const srs = useSRS();
  const csle = useCSLE();
  const experience = usePersonalExperienceV4();
  const gamification = useGamification();
  const ctx = getLessonContext(levelId, unitId, lessonId);
  const speech = useSpeech("en-US");
  const [rate, setRate] = useState<SpeechRate>("normal");
  const [speakingMarked, setSpeakingMarked] = useState(false);

  useEffect(() => {
    setRate(getSavedRate());
  }, []);

  const [tab, setTab] = useState<"explain" | "examples" | "practice" | "speak">("explain");
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<{
    correct: boolean;
    score: number;
    feedback_pt: string;
    corrected_en: string;
    tip_pt: string;
  } | null>(null);
  const [spiralLoading, setSpiralLoading] = useState(false);
  const [spiral, setSpiral] = useState<SpiralData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [personalizedExample, setPersonalizedExample] = useState<PersonalizedExample | null>(null);

  // Fetch one personalized example based on user interests — runs once per lesson
  useEffect(() => {
    if (!ctx || !progress.profile) return;
    void fetchPersonalizedExample({
      lesson_topic: ctx.lesson.title,
      grammar_point: ctx.lesson.goal_pt,
      profile: progress.profile,
      level: ctx.level.id,
    }).then((ex) => {
      if (ex) setPersonalizedExample(ex);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.lesson?.id]);

  // Seed lesson examples into SRS so they appear in tomorrow's review queue.
  // MUST run before any conditional return to keep hook order stable.
  const lessonForEffect = ctx?.lesson;
  useEffect(() => {
    if (!lessonForEffect) return;
    let cancelled = false;
    (async () => {
      for (const ex of lessonForEffect.examples.slice(0, 3)) {
        if (cancelled) return;
        try {
          await srs.addOrTouch({
            en: ex.en,
            pt: ex.pt,
            topic: lessonForEffect.title,
            lesson_id: lessonForEffect.id,
            source: "lesson",
          });
        } catch {
          /* ignore — SRS is best-effort */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonForEffect?.id]);

  useEffect(() => {
    if (!lessonForEffect) return;
    csle.signal("lesson_opened", { topic: lessonForEffect.title, lessonId: lessonForEffect.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonForEffect?.id]);

  if (!ctx) {
    return (
      <AppShell>
        <div className="px-5 pt-12 text-center">
          <p>Lição não encontrada.</p>
          <Link to="/curso" className="mt-4 inline-block text-primary underline">
            Voltar ao curso
          </Link>
        </div>
      </AppShell>
    );
  }

  const {
    level,
    unit,
    lesson,
    positionInUnit,
    totalInUnit,
    isLastInUnit,
    isLastInLevel,
    next,
    nextUnit,
    nextLevel,
  } = ctx;
  const youtubeSuggestions = getYoutubeSuggestions(lesson, level);
  const topicDifficulty = memory.getTopicDifficulty(lesson.id);
  const memoryReinforcement = memory.getReinforcementPhrases(lesson.id, 2);
  // Adaptive loop: also pull the user's SRS-weakest phrases from other lessons.
  const srsReinforcement = srs.weakest
    .filter((p) => p.lesson_id !== lesson.id)
    .slice(0, 2)
    .map((p) => ({ key: p.phrase_key, en: p.en, pt: p.pt ?? "" }));
  // Combined reinforcement list (SRS first — it's backend-backed and more accurate)
  const reinforcementPhrases = [
    ...srsReinforcement,
    ...memoryReinforcement
      .filter((m) => !srsReinforcement.some((s) => s.en === m.en))
      .map((p) => ({ key: p.key, en: p.en, pt: p.pt ?? "" })),
  ].slice(0, 3);
  const shouldNudgeSpiral = memory.shouldSuggestSpiral(lesson.id);

  const tabs = [
    { id: "explain" as const, label: "Explicação" },
    { id: "examples" as const, label: "Exemplos" },
    { id: "practice" as const, label: "Prática" },
    { id: "speak" as const, label: "Falar" },
  ];

  async function handleSpiral() {
    csle.signal("spiral_requested", { topic: lesson.title, lessonId: lesson.id });
    memory.recordEvent({
      content: `Entrou em Espiral no tópico ${lesson.title}`,
      emotion: "positive",
      tags: ["spiral", "learning", "goal"],
      source: "lesson",
    });
    setSpiralLoading(true);
    try {
      const data = await spiralDeeper({
        topic: lesson.title,
        explanation_pt: lesson.explanation_pt,
        examples: lesson.examples,
        level: level.id,
        profile: progress.profile,
      });
      setSpiral(data);
      toast.success("🌀 Spiral aprofundada!");
      gamification.registerAction("spiral", { reason: "Spiral Deeper" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao aprofundar");
    } finally {
      setSpiralLoading(false);
    }
  }

  async function handleCheck() {
    if (!answer.trim()) return;
    setChecking(true);
    setCheck(null);
    try {
      const item = lesson.practice[practiceIdx];
      const res = await checkAnswer({
        prompt_pt: item.prompt_pt,
        expected_en: item.expected_en,
        user_answer: answer,
      });
      setCheck(res);
      memory.recordPractice(lesson.id, item.expected_en, item.prompt_pt, res.correct);
      csle.signal(res.correct ? "practice_correct" : "practice_incorrect", { topic: lesson.title, lessonId: lesson.id });
      experience.recordSkillEvent(res.correct ? "grammar_success" : "grammar_error");
      if (!res.correct) gamification.registerAction("circle", { xp: 20, reason: "Círculo ativado" });
      memory.recordEvent({
        content: res.correct
          ? `Acertou prática de ${lesson.title}: ${item.expected_en}`
          : `Dificuldade em ${lesson.title}: tentou "${answer}" para "${item.expected_en}"`,
        emotion: res.correct ? "positive" : "negative",
        tags: res.correct ? ["lesson", "success"] : ["lesson", "difficulty"],
        source: "lesson",
      });
      // Adaptive loop: feed practiced phrase into SRS so it shows up in review.
      try {
        await srs.grade(item.expected_en, res.correct ? "easy" : "hard");
        await srs.addOrTouch({
          en: item.expected_en,
          pt: item.prompt_pt,
          topic: lesson.title,
          lesson_id: lesson.id,
          source: "lesson",
        });
      } catch {
        /* ignore — SRS is best-effort */
      }
      if (res.correct) {
        toast.success(praise("correct"));
        awardXP(10, "Frase praticada");
      } else {
        toast(praise("partial"), { duration: 1800 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao verificar");
    } finally {
      setChecking(false);
    }
  }

  function nextPractice() {
    if (practiceIdx < lesson.practice.length - 1) {
      setPracticeIdx(practiceIdx + 1);
      setAnswer("");
      setCheck(null);
    } else {
      setTab("speak");
    }
  }

  function handleComplete() {
    csle.signal("lesson_completed", { topic: lesson.title, lessonId: lesson.id });
    experience.recordSkillEvent("lesson_completed");
    experience.completeMission();
    gamification.registerAction("lesson_completed", { xp: 0, reason: "Lição completa" });
    memory.summarizeDay();
    progress.completeLesson(lesson.id, 8);
    void logEvent("lesson_completed", {
      lesson_id: lesson.id,
      level_id: levelId,
      unit_id: unitId,
    });
    speech.cancel();
    setCompleted(true);
    toast.success(praise("lessonDone"));
    awardXP(40, "Lição completa");
  }

  function markSpeaking(result: SpeakingResult) {
    memory.recordSpeaking(lesson.id, lesson.speaking_prompt_en, result);
    csle.signal(result === "well" || result === "partial" ? "speaking_success" : "speaking_struggled", { topic: lesson.title, lessonId: lesson.id });
    experience.recordSkillEvent(result === "well" || result === "partial" ? "voice_success" : "voice_struggled");
    if (result === "well" || result === "partial") gamification.registerAction("voice", { xp: 0, reason: "Speaking" });
    memory.recordEvent({
      content: `Speaking em ${lesson.title}: ${result}`,
      emotion: result === "well" ? "positive" : result === "struggled" ? "negative" : "neutral",
      tags: ["speaking", result === "well" ? "success" : "difficulty"],
      source: "speaking",
    });
    setSpeakingMarked(true);
    if (result === "well") {
      toast.success(praise("speakingWell"));
      awardXP(15, "Speaking");
    } else if (result === "partial") {
      toast(praise("partial"), { duration: 1800 });
      awardXP(5, "Speaking");
    } else if (result === "portuguese") {
      toast("Tenta de novo em inglês — sem pressa.", { duration: 1800 });
    } else {
      toast(praise("struggled"), { duration: 1800 });
    }
  }

  function goToNext() {
    speech.cancel();
    if (next) {
      navigate({
        to: "/licao/$levelId/$unitId/$lessonId",
        params: { levelId: next.levelId, unitId: next.unitId, lessonId: next.lesson.id },
      });
    } else {
      navigate({ to: "/curso" });
    }
  }

  return (
    <AppShell hideNav screen="focus">
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => {
              speech.cancel();
              navigate({ to: "/curso" });
            }}
            className="rounded-full p-2 transition-smooth active:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 truncate">
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {level.id} · {unit.title} · {positionInUnit}/{totalInUnit}
            </div>
            <div className="truncate text-base font-bold">{lesson.title}</div>
          </div>
          <SpeechRateToggle onChange={setRate} />
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                speech.cancel();
                setTab(t.id);
              }}
              className={`flex-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition-smooth ${
                tab === t.id ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 pb-8 animate-fade-in-up">
        {/* Adaptive reason — explains why this lesson was selected */}
        <AdaptiveReason context={{ mode: "lesson", lessonId: lesson.id, lessonTitle: lesson.title }} />
        <div className="mx-0 mb-4">
          <CSLEModeBanner />
        </div>

        {tab === "explain" && (
          <div>
            {topicDifficulty === "hard" && (
              <div className="mb-4 rounded-2xl border-2 border-warning/40 bg-warning/10 p-4 animate-fade-in-up">
                <div className="flex items-start gap-2">
                  <Heart className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                  <div>
                    <div className="text-sm font-bold">Vamos reforçar isso 💪</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Você teve dificuldade com este tópico antes. Sem pressa — leia com calma e
                      use o Spiral Deeper para mais exemplos.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {topicDifficulty === "easy" && (
              <div className="mb-4 rounded-2xl border-2 border-success/40 bg-success/10 p-3 animate-fade-in-up">
                <div className="text-xs font-medium text-success">
                  ✨ Você está evoluindo bem nesse tópico — revisão rápida
                </div>
              </div>
            )}
            <div className="rounded-2xl bg-gradient-card p-5 shadow-soft">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">Objetivo</div>
              <p className="mt-1 text-sm font-medium">{lesson.goal_pt}</p>
            </div>
            <div className="mt-4 rounded-2xl bg-card p-5 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Explicação 🇧🇷
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed">{lesson.explanation_pt}</p>
            </div>

            {shouldNudgeSpiral && !spiral && (
              <p className="mt-4 text-center text-xs font-medium text-accent">
                💡 Sugerimos aprofundar — você teve dificuldade aqui antes
              </p>
            )}
            <button
              onClick={handleSpiral}
              disabled={spiralLoading}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-accent p-4 font-semibold text-accent-foreground shadow-glow transition-bounce active:scale-[0.98] disabled:opacity-60 ${
                shouldNudgeSpiral && !spiral ? "animate-pulse-glow" : ""
              }`}
            >
              {spiralLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {spiralLoading ? "Aprofundando..." : "🌀 Spiral Deeper"}
            </button>

            {spiral && (
              <div className="mt-5 space-y-4 animate-fade-in-up">
                <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent">
                    Aprofundamento
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                    {spiral.deeper_explanation_pt}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Exemplos avançados
                  </h4>
                  <div className="space-y-2">
                    {spiral.advanced_examples.map((ex, i) => (
                      <PhrasePlayer key={i} en={ex.en} pt={ex.pt} />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Variações em contexto real
                  </h4>
                  <div className="space-y-2">
                    {spiral.variations.map((v, i) => (
                      <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
                        <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-accent">
                          {v.context_pt}
                        </div>
                        <PhrasePlayer en={v.en} pt={v.pt} variant="flat" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-primary p-5 shadow-glow">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/90">
                    <Lightbulb className="h-4 w-4" /> Desafio
                  </div>
                  <p className="mt-2 text-sm font-medium text-white">{spiral.challenge_pt}</p>
                </div>
              </div>
            )}

            <details className="mt-5 rounded-2xl bg-card shadow-soft">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold">
                <Youtube className="h-4 w-4 text-destructive" />
                Ver no YouTube
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                  apoio
                </span>
              </summary>
              <div className="space-y-1.5 px-3 pb-3">
                {youtubeSuggestions.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl bg-muted/50 px-3 py-2.5 text-sm transition-smooth active:bg-muted"
                  >
                    {s.title}
                  </a>
                ))}
                <p className="px-1 pt-2 text-[0.65rem] text-muted-foreground">
                  Vídeos do YouTube relacionados ao tópico — apoio, não substitui a lição.
                </p>
              </div>
            </details>

            <Button
              onClick={() => setTab("examples")}
              className="mt-5 w-full rounded-2xl bg-gradient-primary py-6 font-semibold shadow-glow"
            >
              Ver exemplos
            </Button>
          </div>
        )}

        {tab === "examples" && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Exemplos · toque para ouvir com karaokê
            </h3>
            <div className="mt-3 space-y-2.5">
              {lesson.examples.map((ex, i) => (
                <PhrasePlayer key={i} en={ex.en} pt={ex.pt} size="lg" controls />
              ))}
            </div>

            {/* Personalized example from user interests */}
            {personalizedExample && (
              <div className="mt-4 animate-fade-in-up">
                <div className="mb-2 flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-primary" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                    {personalizedExample.context_pt}
                  </span>
                </div>
                <PhrasePlayer en={personalizedExample.en} pt={personalizedExample.pt} size="lg" controls />
              </div>
            )}

            <Button
              onClick={() => setTab("practice")}
              className="mt-6 w-full rounded-2xl bg-gradient-primary py-6 font-semibold shadow-glow"
            >
              Praticar agora
            </Button>
          </div>
        )}

        {tab === "practice" && (
          <div>
            {practiceIdx === 0 && reinforcementPhrases.length > 0 && (
              <div className="mb-4 rounded-2xl border-2 border-accent/30 bg-accent/5 p-4 animate-fade-in-up">
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-accent">
                  🌀 Reforço rápido
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Frases de tópicos anteriores que ainda estão difíceis — escute antes de praticar:
                </p>
                <div className="mt-3 space-y-2">
                  {reinforcementPhrases.map((p) => (
                    <PhrasePlayer
                      key={p.key}
                      en={p.en}
                      pt={p.pt ?? ""}
                      variant="flat"
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Prática {practiceIdx + 1} de {lesson.practice.length}
              </h3>
              <div className="flex gap-1">
                {lesson.practice.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full ${
                      i === practiceIdx ? "bg-primary" : i < practiceIdx ? "bg-success" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {csle.mode === "CIRCLE" && check && !check.correct && (
              <div className="mb-4 rounded-2xl border-2 border-primary/25 bg-primary/7 p-4 animate-fade-in-up">
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                  Círculo ativado
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Mesmo conceito, outro caminho. Leia os exemplos abaixo e tente novamente sem pressa.
                </p>
                <div className="mt-3 space-y-2">
                  {lesson.examples.slice(0, 3).map((ex, i) => (
                    <PhrasePlayer key={i} en={ex.en} pt={ex.pt} variant="flat" size="sm" />
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-gradient-card p-5 shadow-card">
              <p className="text-base font-medium">{lesson.practice[practiceIdx].prompt_pt}</p>
              {lesson.practice[practiceIdx].hint_pt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  💡 {lesson.practice[practiceIdx].hint_pt}
                </p>
              )}
            </div>

            <div className="mt-4">
              <Input
                placeholder="Sua resposta em inglês..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="h-14 rounded-2xl border-2 text-base"
                disabled={!!check?.correct}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              />
            </div>

            {!check && (
              <Button
                onClick={handleCheck}
                disabled={checking || !answer.trim()}
                className="mt-3 w-full rounded-2xl bg-gradient-primary py-6 font-semibold shadow-glow"
              >
                {checking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Verificar
                  </>
                )}
              </Button>
            )}

            {check && (
              <div className="mt-4 animate-fade-in-up">
                <div
                  className={`rounded-2xl p-4 ${
                    check.correct
                      ? "bg-success/15 border-2 border-success/40"
                      : "bg-warning/10 border-2 border-warning/40"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {check.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-warning" />
                    )}
                    {check.correct ? "Boa — saiu bem" : "Quase — ajusta e segue"}
                    <span className="ml-auto text-sm">{check.score}/100</span>
                  </div>
                  <p className="mt-2 text-sm">{check.feedback_pt}</p>
                  <div className="mt-3">
                    <div className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                      Forma correta · ouça e repita
                    </div>
                    <PhrasePlayer
                      en={check.corrected_en}
                      pt={check.tip_pt || check.feedback_pt}
                      size="md"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!check.correct) {
                      setCheck(null);
                      setAnswer("");
                      return;
                    }
                    nextPractice();
                  }}
                  className="mt-3 w-full rounded-2xl bg-gradient-primary py-6 font-semibold shadow-glow"
                >
                  {!check.correct
                    ? "Tentar de novo com os exemplos"
                    : practiceIdx < lesson.practice.length - 1
                      ? "Próxima prática"
                      : "Ir para fala"}
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === "speak" && (
          <div>
            <div className="rounded-2xl bg-gradient-card p-5 shadow-card">
              <div className="text-xs font-bold uppercase tracking-wider text-accent">
                🎤 Prática oral
              </div>
              <p className="mt-2 text-base font-medium">{lesson.speaking_prompt_pt}</p>
              <div className="mt-3">
                <PhrasePlayer en={lesson.speaking_prompt_en} controls size="md" />
              </div>
            </div>

            <div className="mt-4">
              <PronunciationPractice
                en={lesson.speaking_prompt_en}
                onResult={(score, missed) => {
                  const result: SpeakingResult =
                    score >= 80 ? "well" : score >= 50 ? "partial" : "struggled";
                  memory.recordSpeaking(lesson.id, lesson.speaking_prompt_en, result);
                  csle.signal(result === "well" || result === "partial" ? "speaking_success" : "speaking_struggled", { topic: lesson.title, lessonId: lesson.id });
    experience.recordSkillEvent(result === "well" || result === "partial" ? "voice_success" : "voice_struggled");
    if (result === "well" || result === "partial") gamification.registerAction("voice", { xp: 0, reason: "Speaking" });
                  memory.recordEvent({
                    content: `Pronúncia em ${lesson.title}: ${score}/100`,
                    emotion: score >= 80 ? "positive" : score < 50 ? "negative" : "neutral",
                    tags: ["speaking", score >= 80 ? "success" : "difficulty"],
                    source: "speaking",
                  });
                  for (const w of missed.slice(0, 6)) {
                    memory.recordPractice(lesson.id, w, undefined, false);
                  }
                  // Adaptive loop: feed pronunciation result into SRS.
                  const quality: "easy" | "medium" | "hard" =
                    score >= 80 ? "easy" : score >= 50 ? "medium" : "hard";
                  void srs
                    .addOrTouch({
                      en: lesson.speaking_prompt_en,
                      topic: lesson.title,
                      lesson_id: lesson.id,
                      source: "lesson",
                    })
                    .then(() =>
                      srs.grade(lesson.speaking_prompt_en, quality, {
                        pronunciationScore: score,
                      }),
                    )
                    .catch(() => {
                      /* SRS best-effort */
                    });
                  setSpeakingMarked(true);
                }}
              />
            </div>

            {speech.supported ? (
              <div className="mt-5">
                <button
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary text-white shadow-glow transition-bounce active:scale-95 ${
                    speech.listening ? "animate-pulse-glow" : ""
                  }`}
                >
                  <Mic className="h-10 w-10" />
                </button>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {speech.listening ? "Ouvindo..." : "Toque para falar em inglês"}
                </p>
                {speech.transcript && (
                  <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
                    <div className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                      Você disse
                    </div>
                    <p className="mt-1 text-base">{speech.transcript}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-warning/10 border-2 border-warning/30 p-4 text-sm">
                Reconhecimento de voz não disponível neste navegador. Use Chrome ou Safari no
                celular.
              </div>
            )}

            {speech.transcript && !speakingMarked && !completed && (
              <div className="mt-5 rounded-2xl bg-card p-4 shadow-soft animate-fade-in-up">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Como foi sua resposta?
                </div>
                <p className="mt-1 text-[0.7rem] text-muted-foreground">
                  Seja honesto — vou usar isso para personalizar suas próximas lições.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => markSpeaking("well")}
                    className="rounded-xl bg-success/15 px-3 py-3 text-xs font-semibold text-success active:scale-95 transition-bounce"
                  >
                    😎 Mandei bem
                  </button>
                  <button
                    onClick={() => markSpeaking("partial")}
                    className="rounded-xl bg-primary/15 px-3 py-3 text-xs font-semibold text-primary active:scale-95 transition-bounce"
                  >
                    🙂 Parcial
                  </button>
                  <button
                    onClick={() => markSpeaking("portuguese")}
                    className="rounded-xl bg-warning/15 px-3 py-3 text-xs font-semibold text-warning active:scale-95 transition-bounce"
                  >
                    🇧🇷 Caí no PT
                  </button>
                  <button
                    onClick={() => markSpeaking("struggled")}
                    className="rounded-xl bg-destructive/15 px-3 py-3 text-xs font-semibold text-destructive active:scale-95 transition-bounce"
                  >
                    😅 Travei
                  </button>
                </div>
              </div>
            )}
            {speakingMarked && !completed && (
              <div className="mt-4 rounded-xl bg-success/10 px-3 py-2 text-center text-xs font-medium text-success animate-fade-in-up">
                ✓ Anotado na sua memória adaptativa
              </div>
            )}

            {!completed ? (
              <Button
                onClick={handleComplete}
                className="mt-6 w-full rounded-2xl bg-gradient-success py-6 font-bold text-success-foreground shadow-glow"
              >
                ✓ Marcar lição como concluída
              </Button>
            ) : (
              <div className="mt-8 animate-fade-in-up">
                <div className="rounded-3xl bg-gradient-primary p-6 text-center shadow-glow">
                  <Trophy className="mx-auto h-12 w-12 text-white" />
                  <h3 className="mt-3 text-xl font-bold text-white">
                    {isLastInLevel
                      ? `🏆 Nível ${level.id} concluído!`
                      : isLastInUnit
                        ? `🎉 Unidade "${unit.title}" concluída!`
                        : "🌟 Lição concluída!"}
                  </h3>
                  <p className="mt-1 text-sm text-white/85">
                    {isLastInLevel && nextLevel
                      ? `Pronto para o ${nextLevel.id}? A jornada continua.`
                      : isLastInLevel
                        ? "Você completou todo o curso disponível. Parabéns!"
                        : isLastInUnit && nextUnit
                          ? `Próxima unidade: ${nextUnit.title}`
                          : next
                            ? `Próxima: ${next.lesson.title}`
                            : "Você concluiu o curso!"}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-medium text-white/95 backdrop-blur">
                    ✨ {returnTeaser()}
                  </div>
                </div>
                {next ? (
                  <Button
                    onClick={goToNext}
                    className="mt-4 w-full rounded-2xl bg-gradient-success py-6 font-bold text-success-foreground shadow-glow"
                  >
                    {isLastInLevel
                      ? `Começar ${nextLevel?.id}`
                      : isLastInUnit
                        ? "Ir para próxima unidade"
                        : "Próxima lição"}
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Button>
                ) : (
                  <Link to="/curso" className="mt-4 block">
                    <Button className="w-full rounded-2xl bg-gradient-primary py-6 font-bold shadow-glow">
                      Voltar ao curso
                    </Button>
                  </Link>
                )}
                <button
                  onClick={() => {
                    speech.cancel();
                    navigate({ to: "/curso" });
                  }}
                  className="mt-3 w-full rounded-2xl py-3 text-sm font-medium text-muted-foreground transition-smooth active:bg-muted"
                >
                  Voltar ao mapa do curso
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LicaoGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Licao />
    </RequireAuth>
  );
}
