import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { BadgeCard } from "@/components/BadgeCard";
import { LeagueProgress } from "@/components/LeagueProgress";
import { useGamification } from "@/store/useGamification";

export const Route = createFileRoute("/conquistas")({
  head: () => ({
    meta: [
      { title: "Last Course — Conquistas" },
      { name: "description", content: "XP, ligas, streaks e badges do seu Passe do Aluno." },
    ],
  }),
  component: ConquistasGuarded,
});

function Conquistas() {
  const gamification = useGamification();
  const unlocked = gamification.badges.filter((badge) => badge.awarded).length;

  return (
    <AppShell>
      <div className="px-5 pt-8 pb-28">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link to="/perfil" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 text-center">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">Parte 1</p>
            <h1 className="text-xl font-black text-foreground">Gamificação + Perfil Vivo</h1>
          </div>
          <Button variant="outline" size="icon" className="rounded-full" onClick={gamification.resetGamification} title="Resetar gamificação local">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="-mx-5">
          <LeagueProgress />
        </div>

        <div className="mt-5 rounded-3xl border border-primary/15 bg-card/88 p-4 shadow-soft backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">{unlocked}/{gamification.badges.length} badges desbloqueados</p>
              <p className="text-xs text-muted-foreground">O Personal usa esses marcos para comemorar e puxar novas missões.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {gamification.badges.map((badge) => (
            <BadgeCard key={badge.id} {...badge} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ConquistasGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Conquistas />
    </RequireAuth>
  );
}
