// PersonalCard — exibido na Home.
// Lê dados reais de useMemory + useSRS + useProgress para gerar a mensagem do dia.
// Não usa frases pré-definidas rotacionadas: cada mensagem deriva de dados reais.

import { Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Info, MemoryStick } from "lucide-react";
import { useCSLE } from "@/store/useCSLE";
import { useState } from "react";
import { usePersonal, buildPersonalMessage, type PersonalContext } from "@/store/usePersonal";
import { useProgress } from "@/store/useProgress";
import { useMemory } from "@/store/useMemory";
import { useSRS } from "@/store/useSRS";

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const then = new Date(iso + "T00:00:00").getTime();
  const now = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
  return Math.round((now - then) / 86400000);
}

export function PersonalCard() {
  const { identity } = usePersonal();
  const progress = useProgress();
  const memory = useMemory();
  const srs = useSRS();
  const csle = useCSLE();
  const [showReason, setShowReason] = useState(false);

  if (!identity || !progress.profile) return null;

  // Build context from real system data — not hardcoded
  const lastSpeakingEntry = Object.values(memory["speaking"] ?? {})
    .sort((a, b) => (b.lastPracticed ?? "").localeCompare(a.lastPracticed ?? ""))
    .at(0);

  const speakingScore = lastSpeakingEntry
    ? (() => {
        const results = lastSpeakingEntry.results ?? [];
        const last = results.at(-1);
        if (!last) return null;
        if (last === "well") return 90;
        if (last === "partial") return 55;
        if (last === "portuguese") return 30;
        if (last === "struggled") return 15;
        return null;
      })()
    : null;

  const ctx: PersonalContext = {
    userName: progress.profile.name,
    lastStudyDate: progress.lastStudyDate,
    weakTopic: memory.weakTopics[0]?.topic ?? null,
    overdueCount: srs.dueToday.length,
    daysSinceLastStudy: daysSince(progress.lastStudyDate),
    hasProgress: progress.completedCount > 0,
    favoriteShows: progress.profile.favoriteShows ?? "",
    favoriteMusic: progress.profile.favoriteMusic ?? "",
    hobbies: progress.profile.hobbies ?? "",
    weakestPhrase: srs.weakest[0]?.en ?? null,
    lastSpeakingScore: speakingScore,
  };

  const msg = buildPersonalMessage(identity, ctx);

  // Render action as Link
  const actionHref = msg.action.to;

  const actionEl =
    msg.action.kind === "speak" ? (
      <Link
        to="/conversar"
        search={{ intent: msg.action.intent ?? "" }}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-smooth active:scale-95"
      >
        {msg.action.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    ) : (
      <Link
        to={actionHref as "/revisar" | "/legendas" | "/musica" | "/curso"}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-smooth active:scale-95"
      >
        {msg.action.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    );

  return (
    <div className="surface-card mx-5 rounded-2xl p-4 transition-smooth">
      {/* Coach identity */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-cta text-primary-foreground text-sm font-bold">
          {identity.name.slice(0, 1)}
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{identity.name}</span>
        <button
          onClick={() => setShowReason((v) => !v)}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-smooth"
          aria-label="Por que essa mensagem?"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Adaptive reason — shown on demand */}
      {showReason && (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-primary/8 px-3 py-2 animate-fade-in">
          <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-[0.72rem] leading-snug text-primary/80">
            {msg.reasonLabel}
          </p>
        </div>
      )}

      {/* Message */}
      <p className="text-sm leading-relaxed text-foreground">{msg.text}</p>

      {memory.hotEvents.length > 0 && (
        <div className="mt-3 rounded-xl border border-primary/10 bg-primary/6 px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-primary">
            <MemoryStick className="h-3 w-3" /> Memória ativa · {csle.modeLabel}
          </div>
          <p className="line-clamp-2 text-[0.72rem] leading-snug text-foreground/70">
            {memory.hotEvents[0].content}
          </p>
        </div>
      )}

      {/* Action */}
      <div className="mt-3">{actionEl}</div>
    </div>
  );
}
