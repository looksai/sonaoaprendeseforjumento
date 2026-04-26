import { Link } from "@tanstack/react-router";
import { BrainCircuit, CalendarClock, History, MessageCircle, Repeat2, Sparkles } from "lucide-react";
import { useMemory } from "@/store/useMemory";
import { useMemoryCoreV3 } from "@/store/useMemoryCoreV3";
import { useProgress } from "@/store/useProgress";
import { useSRS } from "@/store/useSRS";
import { usePersonal } from "@/store/usePersonal";

function daysSince(iso?: string | null) {
  if (!iso) return 9999;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 9999;
  return Math.floor((Date.now() - t) / 86400000);
}

export function MemoryCoreV3Panel({ compact = false }: { compact?: boolean }) {
  const memory = useMemory();
  const core = useMemoryCoreV3();
  const progress = useProgress();
  const srs = useSRS();
  const { identity } = usePersonal();

  if (!progress.profile) return null;

  const weakTopics = Array.from(new Set([...memory.weakTopics.map((topic) => topic.topic), ...srs.weakest.map((phrase) => phrase.topic)])).slice(0, 4);
  const ritual = core.getRitual({
    dueCount: srs.dueToday.length,
    streak: progress.streak,
    lastStudyDate: progress.lastStudyDate,
    assistantName: identity?.name ?? "Mia",
    userName: progress.profile.name,
    weakTopics,
    hotMemories: memory.hotEvents,
    energy: daysSince(progress.lastStudyDate) > 2 ? "low" : "normal",
  });

  return (
    <div className="surface-card mx-5 overflow-hidden rounded-3xl p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-accent">Memory Core v3</span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.62rem] font-bold text-accent">{ritual.kind.replace("_", " ")}</span>
          </div>
          <h3 className="mt-1 text-base font-bold leading-tight">{ritual.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/75">{ritual.line}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-muted/55 px-2 py-2">
            <CalendarClock className="mx-auto h-3.5 w-3.5 text-accent" />
            <div className="mt-1 text-[0.65rem] font-bold">{core.dailySummaries.length}</div>
            <div className="text-[0.58rem] text-muted-foreground">dias</div>
          </div>
          <div className="rounded-2xl bg-muted/55 px-2 py-2">
            <Sparkles className="mx-auto h-3.5 w-3.5 text-accent" />
            <div className="mt-1 text-[0.65rem] font-bold">{core.permanentMemories.length}</div>
            <div className="text-[0.58rem] text-muted-foreground">permanentes</div>
          </div>
          <div className="rounded-2xl bg-muted/55 px-2 py-2">
            <History className="mx-auto h-3.5 w-3.5 text-accent" />
            <div className="mt-1 text-[0.65rem] font-bold">{core.sessionReplays.length}</div>
            <div className="text-[0.58rem] text-muted-foreground">replays</div>
          </div>
        </div>
      )}

      {core.latestReplay && !compact && (
        <div className="mt-3 rounded-2xl border border-accent/10 bg-accent/6 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[0.62rem] font-black uppercase tracking-wider text-accent">
            <Repeat2 className="h-3 w-3" /> Último replay
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">{core.latestReplay.message}</p>
          <p className="mt-1 line-clamp-1 text-[0.68rem] font-semibold text-foreground/75">{core.latestReplay.nextStep}</p>
        </div>
      )}

      {core.latestDaily && !compact && (
        <div className="mt-3 rounded-2xl bg-muted/45 px-3 py-2">
          <p className="text-[0.62rem] font-black uppercase tracking-wider text-muted-foreground">Resumo consolidado</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">{core.latestDaily.summary}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/conversar"
          search={{ intent: ritual.intent }}
          onClick={() => core.markRitualShown(ritual.kind)}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition-bounce active:scale-95"
        >
          <MessageCircle className="h-3.5 w-3.5" /> {ritual.actionLabel}
        </Link>
        <Link
          to="/reflexao"
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-xs font-bold text-foreground transition-bounce active:scale-95"
        >
          Ver replay
        </Link>
      </div>
    </div>
  );
}
