import type React from "react";
import { Crown, Flame, Sparkles, Trophy } from "lucide-react";
import { useGamification } from "@/store/useGamification";

const leagueTone: Record<string, string> = {
  Bronze: "from-amber-500/20 to-orange-500/10 text-amber-700",
  Silver: "from-slate-400/20 to-slate-200/10 text-slate-700",
  Gold: "from-yellow-400/25 to-amber-300/10 text-yellow-700",
  Platinum: "from-cyan-400/20 to-blue-400/10 text-cyan-700",
  Diamond: "from-violet-400/25 to-fuchsia-400/10 text-violet-700",
};

export function LeagueProgress({ compact = false }: { compact?: boolean }) {
  const gamification = useGamification();
  const next = gamification.nextLeague;

  return (
    <div className="mx-5 overflow-hidden rounded-3xl border border-primary/15 bg-card/90 shadow-soft backdrop-blur-md">
      <div className={`bg-gradient-to-br ${leagueTone[gamification.league] ?? leagueTone.Bronze} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-primary">
              <Trophy className="h-3 w-3" /> Gamification Core v1
            </p>
            <h3 className="mt-3 text-xl font-black leading-tight text-foreground">Liga {gamification.league}</h3>
            <p className="mt-1 text-sm text-foreground/70">
              {gamification.xp} XP acumulado · {gamification.weeklyXp} XP esta semana
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/75 text-primary shadow-soft">
            <Crown className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs font-bold text-foreground/70">
            <span>{next ? `Rumo à liga ${next.league}` : "Liga máxima desbloqueada"}</span>
            <span>{gamification.progressToNext}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-background/60">
            <div className="h-full rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${Math.max(5, gamification.progressToNext)}%` }} />
          </div>
          {next && <p className="mt-1 text-[0.68rem] text-foreground/60">Faltam {Math.max(0, next.target - gamification.xp)} XP.</p>}
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-3 gap-2 p-3">
          <MiniStat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${gamification.streak}d`} />
          <MiniStat icon={<Sparkles className="h-4 w-4" />} label="Missões" value={gamification.stats.missionsCompleted} />
          <MiniStat icon={<Trophy className="h-4 w-4" />} label="Badges" value={gamification.badges.filter((b) => b.awarded).length} />
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-muted/55 px-3 py-2 text-center">
      <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <div className="mt-1 text-[0.62rem] font-black uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-black text-foreground">{value}</div>
    </div>
  );
}
