import { Link } from "@tanstack/react-router";
import { Award, ChevronRight } from "lucide-react";
import { useGamification } from "@/store/useGamification";
import { LeagueProgress } from "@/components/LeagueProgress";

export function GamificationPanel({ compact = false }: { compact?: boolean }) {
  const gamification = useGamification();
  const unlocked = gamification.badges.filter((badge) => badge.awarded).slice(0, 4);

  return (
    <div className="space-y-3">
      <LeagueProgress compact={compact} />
      {!compact && (
        <div className="mx-5 rounded-3xl border border-border bg-card/88 p-4 shadow-soft backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">Conquistas</p>
              <h3 className="mt-1 text-base font-black text-foreground">Badges do seu passe</h3>
            </div>
            <Link to="/conquistas" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {unlocked.length > 0 ? unlocked.map((badge) => (
              <div key={badge.id} className="rounded-2xl bg-muted/55 px-2 py-3 text-center" title={badge.name}>
                <div className="text-2xl">{badge.emoji}</div>
                <div className="mt-1 truncate text-[0.6rem] font-black text-foreground/70">{badge.name}</div>
              </div>
            )) : (
              <div className="col-span-4 flex items-center gap-2 rounded-2xl bg-muted/55 px-3 py-3 text-xs text-muted-foreground">
                <Award className="h-4 w-4" /> Complete uma missão ou lição para desbloquear o primeiro badge.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
