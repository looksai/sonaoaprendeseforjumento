// Revisão inteligente — Phase 2 SRS UI.
// Combines:
//  • Phrase reviews due today (from useSRS — backend backed)
//  • Topic-level reinforcements (from useMemory — local heuristic)
// User grades each item Easy / Medium / Hard → schedules the next review.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { PhrasePlayer } from "@/components/PhrasePlayer";
import { SpeechRateToggle } from "@/components/SpeechRateToggle";
import { useMemory } from "@/store/useMemory";
import { useSRS, type PhraseReview, type ReviewQuality } from "@/store/useSRS";
import { useSpeech, getSavedRate, type SpeechRate } from "@/hooks/useSpeech";
import { AdaptiveReason } from "@/components/AdaptiveReason";
import { ArrowLeft, RefreshCw, Sparkles, Trophy, Calendar, Zap, Tv } from "lucide-react";

export const Route = createFileRoute("/revisar")({
  head: () => ({
    meta: [
      { title: "CSLE — Revisão inteligente" },
      {
        name: "description",
        content: "Revise no momento certo — repetição espaçada CSLE.",
      },
    ],
  }),
  component: RevisarGuarded,
});

type QueueItem =
  | { kind: "phrase"; phrase: PhraseReview }
  | { kind: "topic"; topic: string; level: string; correct: number; incorrect: number };

function fmtNextReview(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = d.getTime() - now;
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays <= 0) return "hoje";
  if (diffDays === 1) return "amanhã";
  if (diffDays < 7) return `em ${diffDays} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function Revisar() {
  const navigate = useNavigate();
  const memory = useMemory();
  const srs = useSRS();
  const speech = useSpeech("en-US");
  const [, setRate] = useState<SpeechRate>("normal");
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => setRate(getSavedRate()), []);

  // Build the today queue: SRS-due phrases first, then topic-level fallback.
  const queue: QueueItem[] = useMemo(() => {
    const items: QueueItem[] = [];
    srs.dueToday.slice(0, 12).forEach((p) => items.push({ kind: "phrase", phrase: p }));
    if (items.length < 6) {
      memory.weakTopics.slice(0, 4).forEach((t) =>
        items.push({
          kind: "topic",
          topic: t.topic,
          level: t.level,
          correct: t.correct,
          incorrect: t.incorrect,
        }),
      );
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srs.dueToday.length, memory.weakTopics.length]);

  if (queue.length === 0) {
    const upcoming = srs.upcoming[0];
    return (
      <AppShell>
        <div className="px-5 pt-12">
          <button
            onClick={() => navigate({ to: "/" })}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="rounded-3xl bg-gradient-success p-8 text-center shadow-glow">
            <Trophy className="mx-auto h-14 w-14 text-success-foreground" />
            <h2 className="mt-4 text-2xl font-bold text-success-foreground">Tudo em dia ✨</h2>
            <p className="mt-2 text-sm text-success-foreground/85">
              Nada para revisar agora. Continue praticando — vou agendar revisões automáticas
              conforme você aprende novas frases.
            </p>
          </div>

          {upcoming && (
            <div className="mt-5 rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Próxima revisão
              </div>
              <div className="mt-2 text-sm font-semibold">{upcoming.en}</div>
              <div className="text-xs text-muted-foreground">
                {fmtNextReview(upcoming.next_review)} · {upcoming.topic}
              </div>
            </div>
          )}

          <Link to="/curso" className="mt-6 block">
            <Button className="w-full rounded-2xl bg-gradient-primary py-6 font-semibold shadow-glow">
              Continuar o curso
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (done) {
    return (
      <AppShell>
        <div className="px-5 pt-12">
          <div className="rounded-3xl bg-gradient-primary p-8 text-center shadow-glow">
            <Trophy className="mx-auto h-14 w-14 text-white" />
            <h2 className="mt-4 text-2xl font-bold text-white">Revisão concluída! 🌟</h2>
            <p className="mt-2 text-sm text-white/85">
              {srs.upcoming[0]
                ? `Próxima revisão ${fmtNextReview(srs.upcoming[0].next_review)}.`
                : "Volte amanhã para a próxima rodada."}
            </p>
          </div>
          <Link to="/curso" className="mt-6 block">
            <Button className="w-full rounded-2xl bg-gradient-primary py-6 font-semibold shadow-glow">
              Continuar o curso
            </Button>
          </Link>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-3 w-full rounded-2xl py-3 text-sm font-medium text-muted-foreground"
          >
            Voltar ao início
          </button>
        </div>
      </AppShell>
    );
  }

  const current = queue[idx];
  const total = queue.length;

  function nextItem() {
    speech.cancel();
    if (idx < total - 1) setIdx(idx + 1);
    else setDone(true);
  }

  async function gradePhrase(quality: ReviewQuality) {
    if (current.kind !== "phrase") return;
    await srs.grade(current.phrase.en, quality);
    // Mirror to local memory engine for in-session UI updates
    if (current.phrase.lesson_id) {
      memory.recordPractice(
        current.phrase.lesson_id,
        current.phrase.en,
        current.phrase.pt ?? undefined,
        quality !== "hard",
      );
    }
    nextItem();
  }

  function gradeTopic(quality: ReviewQuality) {
    if (current.kind !== "topic") return;
    const target = memory.getLessonForTopic(current.topic);
    if (target) {
      memory.recordPractice(
        target.lesson.id,
        target.lesson.examples[0]?.en ?? current.topic,
        target.lesson.examples[0]?.pt,
        quality !== "hard",
      );
    }
    nextItem();
  }

  return (
    <AppShell screen="focus">
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => {
              speech.cancel();
              navigate({ to: "/" });
            }}
            className="rounded-full p-2 active:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Revisar hoje · {idx + 1}/{total}
            </div>
            <div className="text-base font-bold flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-accent" /> Repetição espaçada
            </div>
          </div>
          <SpeechRateToggle onChange={setRate} />
        </div>
        <div className="px-4 pb-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-smooth"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-8 animate-fade-in-up">
        {idx === 0 && <AdaptiveReason context={{ mode: "review" }} />}
        {current.kind === "phrase" ? (
          <PhraseReviewCard phrase={current.phrase} onGrade={gradePhrase} />
        ) : (
          <TopicReviewCard
            topic={current.topic}
            level={current.level}
            correct={current.correct}
            incorrect={current.incorrect}
            onPractice={() => {
              const target = memory.getLessonForTopic(current.topic);
              if (target) {
                speech.cancel();
                navigate({
                  to: "/licao/$levelId/$unitId/$lessonId",
                  params: {
                    levelId: target.levelId,
                    unitId: target.unitId,
                    lessonId: target.lesson.id,
                  },
                });
              }
            }}
            onGrade={gradeTopic}
          />
        )}

        {srs.upcoming.length > 0 && (
          <div className="mt-6 rounded-2xl bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Próxima revisão programada
            </div>
            <div className="mt-1 text-foreground">
              {srs.upcoming[0].en}
              <span className="ml-1 text-muted-foreground">· {fmtNextReview(srs.upcoming[0].next_review)}</span>
            </div>
          </div>
        )}

        <button
          onClick={nextItem}
          className="mt-3 w-full rounded-2xl py-3 text-sm font-medium text-muted-foreground active:bg-muted"
        >
          Pular este
        </button>
      </div>
    </AppShell>
  );
}

function PhraseReviewCard({
  phrase,
  onGrade,
}: {
  phrase: PhraseReview;
  onGrade: (q: ReviewQuality) => void;
}) {
  const sourceLabel: Record<string, { label: string; icon: React.ReactNode }> = {
    lesson: { label: "Lição", icon: <Sparkles className="h-3 w-3" /> },
    episode: { label: "Episódio", icon: <Tv className="h-3 w-3" /> },
    conversation: { label: "Conversa", icon: <Zap className="h-3 w-3" /> },
  };
  const src = sourceLabel[phrase.source] ?? sourceLabel.lesson;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5">
          {src.icon} {src.label}
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{phrase.topic}</span>
      </div>
      <PhrasePlayer en={phrase.en} pt={phrase.pt ?? ""} size="lg" controls />
      <p className="mt-3 text-xs text-muted-foreground">
        Ouça com calma, repita em voz alta. Como foi para você?
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button
          onClick={() => onGrade("hard")}
          variant="outline"
          className="rounded-2xl border-2 border-destructive/40 py-5 text-xs font-semibold text-destructive"
        >
          😅 Difícil
          <div className="ml-1 text-[0.6rem] font-normal opacity-70">+1d</div>
        </Button>
        <Button
          onClick={() => onGrade("medium")}
          variant="outline"
          className="rounded-2xl border-2 border-warning/40 py-5 text-xs font-semibold text-warning"
        >
          🤔 Médio
          <div className="ml-1 text-[0.6rem] font-normal opacity-70">+3d</div>
        </Button>
        <Button
          onClick={() => onGrade("easy")}
          className="rounded-2xl bg-gradient-success py-5 text-xs font-semibold text-success-foreground shadow-glow"
        >
          😎 Fácil
          <div className="ml-1 text-[0.6rem] font-normal opacity-80">+7d</div>
        </Button>
      </div>
    </div>
  );
}

function TopicReviewCard({
  topic,
  level,
  correct,
  incorrect,
  onPractice,
  onGrade,
}: {
  topic: string;
  level: string;
  correct: number;
  incorrect: number;
  onPractice: () => void;
  onGrade: (q: ReviewQuality) => void;
}) {
  return (
    <div>
      <div className="rounded-2xl bg-gradient-card p-5 shadow-card">
        <div className="text-[0.65rem] font-bold uppercase tracking-wider text-warning">
          Tópico para reforçar
        </div>
        <h2 className="mt-1 text-2xl font-bold">{topic}</h2>
        <div className="mt-2 text-xs text-muted-foreground">
          Nível {level} · {correct} acertos · {incorrect} erros
        </div>
      </div>
      <Button
        onClick={onPractice}
        className="mt-4 w-full rounded-2xl bg-gradient-primary py-6 font-semibold shadow-glow"
      >
        <Sparkles className="mr-1 h-4 w-4" /> Praticar este tópico
      </Button>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button onClick={() => onGrade("hard")} variant="outline" className="rounded-2xl border-2 py-4 text-xs">
          😅 Difícil
        </Button>
        <Button onClick={() => onGrade("medium")} variant="outline" className="rounded-2xl border-2 py-4 text-xs">
          🤔 Médio
        </Button>
        <Button onClick={() => onGrade("easy")} variant="outline" className="rounded-2xl border-2 py-4 text-xs">
          😎 Fácil
        </Button>
      </div>
    </div>
  );
}

function RevisarGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Revisar />
    </RequireAuth>
  );
}
