import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Tv, Music, Youtube, ArrowRight, RefreshCw, Sparkles, Film } from "lucide-react";
import { useProgress } from "@/store/useProgress";
import { useSRS } from "@/store/useSRS";
import { ActivatePersonalCard } from "@/components/ActivatePersonalCard";

export const Route = createFileRoute("/explorar")({
  head: () => ({
    meta: [
      { title: "CSLE — Explorar" },
      {
        name: "description",
        content: "Aprenda inglês com séries, filmes e músicas que você já ama.",
      },
    ],
  }),
  component: ExplorarGuarded,
});

function Explorar() {
  const { profile, nextLesson } = useProgress();
  const srs = useSRS();
  const dueCount = srs.dueToday.length;

  return (
    <AppShell>
      <div className="px-5 pt-8 pb-2">
        <h1 className="text-2xl font-bold">Aprenda com o que você ama</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transforme séries, filmes e músicas em prática real de inglês.
        </p>
      </div>

      <div className="space-y-3 px-5 pt-4">
        <ActivatePersonalCard />

        {dueCount > 0 && (
          <Link
            to="/revisar"
            className="surface-card block rounded-2xl p-4 transition-smooth active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Revisar hoje · {dueCount}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Suas frases voltam no momento certo para fixar de verdade.
                </p>
              </div>
              <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* Hero feature: episodes */}
        <Link
          to="/legendas"
          className="block overflow-hidden rounded-3xl bg-gradient-cta p-5 text-primary-foreground shadow-glow transition-bounce active:scale-[0.99]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Film className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] opacity-85">
                Conteúdo real
              </div>
              <div className="mt-1 text-lg font-bold leading-snug">
                Acompanhe o episódio que você está assistindo
              </div>
              <p className="mt-1.5 text-sm opacity-90">
                Diga qual série e episódio — destacamos as frases mais importantes
                {nextLesson && " e conectamos com a sua lição"}.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/95 px-3 py-1.5 text-xs font-bold text-background">
                Começar <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/musica"
          className="surface-card block rounded-2xl p-4 transition-smooth active:scale-[0.99]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Music className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Pratique com a sua música</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile?.favoriteMusic
                  ? `Frases inspiradas em ${profile.favoriteMusic}`
                  : "Escolha um artista — geramos frases no estilo dele"}.
              </p>
            </div>
            <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <Link
          to="/curso"
          className="surface-card block rounded-2xl p-4 transition-smooth active:scale-[0.99]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Youtube className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Vídeos contextuais no YouTube</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada lição abre buscas no YouTube com vídeos do tema na vida real.
              </p>
            </div>
            <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        {profile?.favoriteShows && (
          <div className="surface-card rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Tv className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Suas referências</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Estamos puxando ideias de <strong className="text-foreground">{profile.favoriteShows}</strong> para deixar
                  os exemplos com a sua cara.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mx-5 mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <p className="text-xs text-muted-foreground">
          Aprenda com o conteúdo que você já ama — esse é o jeito mais rápido de fixar inglês de verdade.
        </p>
      </div>
    </AppShell>
  );
}

function ExplorarGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Explorar />
    </RequireAuth>
  );
}
