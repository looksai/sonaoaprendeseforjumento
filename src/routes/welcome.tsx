// Public landing — first screen anyone sees.
// Login-first: from here the user can sign in with Google or go to /auth.
// If already authenticated, redirect to the appropriate next step.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, Mic, Brain, Users, Tv, ArrowRight } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useConsent } from "@/store/useConsent";
import { useProgress } from "@/store/useProgress";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Last Course — Seu Personal de inglês" },
      {
        name: "description",
        content:
          "Seu Personal de inglês com memória, séries, voz e comunidade. Comece em segundos.",
      },
      { property: "og:title", content: "Last Course — Seu Personal de inglês" },
      {
        property: "og:description",
        content: "Memória, séries, voz e comunidade. O último curso de inglês que você precisa.",
      },
    ],
  }),
  component: WelcomeLanding,
});

function WelcomeLanding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { decided } = useConsent();
  const { profile } = useProgress();

  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);

  // Already authenticated? Send them to the right next step.
  useEffect(() => {
    if (loading || !user) return;
    if (!decided) {
      navigate({ to: "/consent" });
    } else if (!profile) {
      navigate({ to: "/onboarding" });
    } else {
      navigate({ to: "/" });
    }
  }, [user, loading, decided, profile, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      {/* Decorative aura */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-foreground">Last Course</div>
            <div className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              o último curso de inglês
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-12 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> A1 → B2 com presença real
          </div>
          <h1 className="mt-5 text-[2.4rem] font-black leading-[1.05] tracking-tight text-foreground">
            Seu Personal de inglês
            <span className="block bg-gradient-cta bg-clip-text text-transparent">
              com memória, séries,
            </span>
            <span className="block bg-gradient-cta bg-clip-text text-transparent">
              voz e comunidade.
            </span>
          </h1>
          <p className="mt-5 max-w-sm text-[0.98rem] leading-relaxed text-foreground/80">
            Não é mais um app de listas. É um Personal que escuta sua voz, lembra do que você
            erra, e adapta cada lição ao que importa pra você.
          </p>

          {/* Pillars */}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <Pillar icon={<Mic className="h-4 w-4" />} label="Voz real" />
            <Pillar icon={<Brain className="h-4 w-4" />} label="Memória ativa" />
            <Pillar icon={<Tv className="h-4 w-4" />} label="Séries & filmes" />
            <Pillar icon={<Users className="h-4 w-4" />} label="Comunidade" />
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 space-y-3">
          <Link
            to="/auth"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-cta text-base font-bold text-primary-foreground shadow-glow transition-bounce active:scale-[0.99]"
          >
            Entrar ou criar conta <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-card text-base font-bold text-foreground shadow-card transition-bounce active:scale-[0.99]"
          >
            Continuar sem login para testar
          </Link>

          <p className="pt-2 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            Ao continuar, você concorda em receber lembretes opcionais e usar voz para prática.
            Você decide o que ativar no próximo passo.
          </p>
        </div>
      </div>
    </div>
  );
}

function Pillar({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-3 backdrop-blur">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="text-sm font-bold text-foreground">{label}</span>
    </div>
  );
}
