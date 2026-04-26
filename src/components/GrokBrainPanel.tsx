import { Link } from "@tanstack/react-router";
import { Brain, Clock3, MessageCircle, Mic, Sparkles, Zap } from "lucide-react";
import { useCSLE } from "@/store/useCSLE";
import { useGrokBrain } from "@/store/useGrokBrain";
import { useMemory } from "@/store/useMemory";
import { usePersonal } from "@/store/usePersonal";
import { useProgress } from "@/store/useProgress";
import { useSRS } from "@/store/useSRS";

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  const then = new Date(iso + "T00:00:00").getTime();
  const now = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
  return Math.round((now - then) / 86400000);
}

export function GrokBrainPanel({ compact = false }: { compact?: boolean }) {
  const csle = useCSLE();
  const memory = useMemory();
  const brain = useGrokBrain();
  const progress = useProgress();
  const srs = useSRS();
  const { identity } = usePersonal();

  if (!progress.profile) return null;

  const weakTopics = Array.from(new Set([...memory.weakTopics.map((t) => t.topic), ...srs.weakest.map((p) => p.topic)])).slice(0, 5);
  const snapshot = brain.buildSnapshot({
    csleMode: csle.mode,
    assistantName: identity?.name ?? "Mia",
    userName: progress.profile.name,
    weakTopics,
    hotMemories: memory.hotEvents,
    warmMemories: memory.warmEvents,
    dueCount: srs.dueToday.length,
    favoriteShows: progress.profile.favoriteShows,
    favoriteMusic: progress.profile.favoriteMusic,
    hobbies: progress.profile.hobbies,
    lastStudyDays: daysSince(progress.lastStudyDate),
  });

  return (
    <div className="surface-card mx-5 overflow-hidden rounded-3xl p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Brain className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">Grok level</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.62rem] font-bold text-primary">{snapshot.agent}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.62rem] font-semibold text-muted-foreground">{csle.modeLabel}</span>
          </div>
          <h3 className="mt-1 text-base font-bold leading-tight">{snapshot.headline}</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/75">{snapshot.opener}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-muted/55 px-2 py-2">
            <Sparkles className="mx-auto h-3.5 w-3.5 text-primary" />
            <div className="mt-1 text-[0.65rem] font-bold">{memory.hotEvents.length}</div>
            <div className="text-[0.58rem] text-muted-foreground">hot memories</div>
          </div>
          <div className="rounded-2xl bg-muted/55 px-2 py-2">
            <Zap className="mx-auto h-3.5 w-3.5 text-primary" />
            <div className="mt-1 text-[0.65rem] font-bold">{weakTopics.length}</div>
            <div className="text-[0.58rem] text-muted-foreground">alvos</div>
          </div>
          <div className="rounded-2xl bg-muted/55 px-2 py-2">
            <Clock3 className="mx-auto h-3.5 w-3.5 text-primary" />
            <div className="mt-1 text-[0.65rem] font-bold">{srs.dueToday.length}</div>
            <div className="text-[0.58rem] text-muted-foreground">SRS</div>
          </div>
        </div>
      )}

      {brain.latestVoiceReplay && !compact && (
        <div className="mt-3 rounded-2xl border border-primary/10 bg-primary/6 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[0.62rem] font-black uppercase tracking-wider text-primary">
            <Mic className="h-3 w-3" /> Replay da última sessão
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">{brain.latestVoiceReplay.summary}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/conversar"
          search={{ intent: snapshot.actionIntent }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-bounce active:scale-95"
        >
          <MessageCircle className="h-3.5 w-3.5" /> {snapshot.actionLabel}
        </Link>
        <Link
          to="/reflexao"
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-xs font-bold text-foreground transition-bounce active:scale-95"
        >
          Ver memória
        </Link>
      </div>
    </div>
  );
}
