// AdaptiveReason — exibido no topo de lições e da tela de revisão.
// Explica em linguagem humana por que o sistema escolheu esse conteúdo agora.
// Lê dados reais, sem texto genérico.

import { Brain, X } from "lucide-react";
import { useState } from "react";
import { useMemory } from "@/store/useMemory";
import { useSRS } from "@/store/useSRS";
import { useProgress } from "@/store/useProgress";

export type AdaptiveReasonContext =
  | { mode: "lesson"; lessonId: string; lessonTitle: string }
  | { mode: "review" };

interface Props {
  context: AdaptiveReasonContext;
}

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const then = new Date(iso + "T00:00:00").getTime();
  const now = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
  return Math.round((now - then) / 86400000);
}

export function AdaptiveReason({ context }: Props) {
  const memory = useMemory();
  const srs = useSRS();
  const progress = useProgress();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const lines: string[] = [];

  if (context.mode === "review") {
    const due = srs.dueToday.length;
    const upcoming = srs.upcoming[0];
    if (due > 0) {
      lines.push(
        `${due} frase${due > 1 ? "s" : ""} chegaram ao intervalo ideal de revisão hoje — o sistema de memória espaçada calculou esse momento.`,
      );
    }
    const weak = memory.weakTopics[0];
    if (weak) {
      lines.push(
        `"${weak.topic}" aparece como seu ponto mais fraco (${weak.incorrect} erros recentes) — esse tópico pode surgir na fila de hoje.`,
      );
    }
    if (upcoming && due === 0) {
      const d = new Date(upcoming.next_review);
      lines.push(
        `Sua próxima frase para revisão chega em ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}. Por enquanto está tudo em dia.`,
      );
    }
  }

  if (context.mode === "lesson") {
    const topicDiff = memory.getTopicDifficulty(context.lessonId);
    const daysSinceLast = daysSince(progress.lastStudyDate);
    const reinforcement = memory.getReinforcementPhrases(context.lessonId, 1);

    if (topicDiff === "hard") {
      lines.push(
        `"${context.lessonTitle}" está marcado como difícil no seu perfil. O sistema trouxe reforços extras nesta lição.`,
      );
    } else if (topicDiff === "easy") {
      lines.push(
        `Você domina bem "${context.lessonTitle}". Esta lição avança para conteúdo novo — o sistema detectou que você está pronto.`,
      );
    } else {
      lines.push(
        `"${context.lessonTitle}" é a próxima lição na sua trilha adaptativa. O sistema avança no ritmo que os seus dados indicam.`,
      );
    }

    if (reinforcement.length > 0) {
      lines.push(
        `Tópico "${reinforcement[0].topic}" ainda está difícil — aparece como reforço rápido antes da prática.`,
      );
    }

    if (daysSinceLast >= 2 && daysSinceLast < 9999) {
      lines.push(
        `Você ficou ${daysSinceLast} dia${daysSinceLast > 1 ? "s" : ""} afastado. O sistema começou com exemplos mais concretos para reconectar.`,
      );
    }

    const srsWeak = srs.weakest.filter((p) => p.lesson_id !== context.lessonId).slice(0, 1);
    if (srsWeak.length > 0) {
      lines.push(
        `A frase "${srsWeak[0].en}" está com dificuldade alta no seu banco de revisão — pode aparecer como reforço aqui.`,
      );
    }
  }

  if (lines.length === 0) return null;

  return (
    <div className="mx-5 mb-4 animate-fade-in-up rounded-2xl border border-primary/20 bg-primary/6 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-primary" />
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
            Por que esse conteúdo agora
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-smooth"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="space-y-1.5">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
            <p className="text-[0.75rem] leading-relaxed text-foreground/75">{line}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
