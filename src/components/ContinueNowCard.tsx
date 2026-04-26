// "Continue Now" — guided hero block on Home.
// Pulls the user forward: shows next lesson, today's plan, and a single
// strong CTA. Designed to remove friction and decision fatigue.
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, RefreshCw, Mic } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { evolutionLine } from "@/lib/narrative";

interface Props {
  lessonTitle: string;
  lessonGoal: string;
  levelId: string;
  unitId: string;
  lessonId: string;
  levelLabel: string;
  levelProgress: number;
  dueCount: number;
  completedCount: number;
}

export function ContinueNowCard({
  lessonTitle,
  lessonGoal,
  levelId,
  unitId,
  lessonId,
  levelLabel,
  levelProgress,
  dueCount,
  completedCount,
}: Props) {
  const minutes = 5;
  const evolution = evolutionLine(levelLabel, completedCount);
  return (
    <Link
      to="/licao/$levelId/$unitId/$lessonId"
      params={{ levelId, unitId, lessonId }}
      className="block"
    >
      <div className="surface-elevated relative overflow-hidden rounded-3xl p-5 transition-bounce active:scale-[0.99]">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/15 px-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
              🔥 Continue agora
            </span>
            <span className="text-[0.65rem] font-semibold text-muted-foreground">
              · {minutes} min
            </span>
          </div>

          <h2 className="mt-3 text-[1.35rem] font-bold leading-tight text-foreground">
            {lessonTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{lessonGoal}</p>

          <div className="mt-4 space-y-1.5">
            <PlanLine icon={<BookOpen className="h-3.5 w-3.5" />} text="Praticar 3 frases novas" />
            {dueCount > 0 && (
              <PlanLine
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                text={`Revisar ${dueCount} ${dueCount === 1 ? "item" : "itens"}`}
              />
            )}
            <PlanLine icon={<Mic className="h-3.5 w-3.5" />} text="Falar por 2 minutos" />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>{levelLabel}</span>
              <span className="truncate text-right normal-case tracking-normal italic font-medium text-foreground/75">
                {evolution}
              </span>
            </div>
            <Progress value={levelProgress} className="mt-1.5 h-1.5 bg-white/40" />
          </div>

          <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-cta px-5 py-3.5 text-base font-bold text-white shadow-glow">
            Começar agora <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlanLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[0.78rem] text-foreground/85">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/60 text-primary">
        {icon}
      </span>
      <span className="font-medium">{text}</span>
    </div>
  );
}
