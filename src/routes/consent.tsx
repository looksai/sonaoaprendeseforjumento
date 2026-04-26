// Consent screen — shown after first login, before onboarding.
// Explains what data the app uses and lets the user accept or customize.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Mic, Users, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/store/useAuth";
import { useConsent } from "@/store/useConsent";
import { useProgress } from "@/store/useProgress";

export const Route = createFileRoute("/consent")({
  head: () => ({
    meta: [
      { title: "Last Course — Permissões e privacidade" },
      {
        name: "description",
        content:
          "Como o Last Course usa seus dados de aprendizado, voz e perfil social para personalizar sua experiência.",
      },
    ],
  }),
  component: ConsentPage,
});

function ConsentPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { decided, analytics, voice, decide, setAnalytics, setVoice } = useConsent();
  const { profile } = useProgress();

  const [busy, setBusy] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  // Local toggles for the custom view (defaults: both on).
  const [optAnalytics, setOptAnalytics] = useState(true);
  const [optVoice, setOptVoice] = useState(true);

  // Not logged in? Send to welcome.
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/welcome" });
  }, [user, loading, navigate]);

  // Already decided? Skip ahead.
  useEffect(() => {
    if (loading || !user || !decided) return;
    if (!profile) navigate({ to: "/onboarding" });
    else navigate({ to: "/" });
  }, [decided, loading, user, profile, navigate]);

  // Initialize toggles from current store on mount.
  useEffect(() => {
    setOptAnalytics(analytics || true);
    setOptVoice(voice || true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptAll() {
    setBusy(true);
    try {
      await decide(true);
      // navigation handled by the effect above
    } finally {
      setBusy(false);
    }
  }

  async function saveCustom() {
    setBusy(true);
    try {
      await setAnalytics(optAnalytics);
      await setVoice(optVoice);
      await decide(optAnalytics || optVoice);
      // mark decided even if user opted out of both
      if (!optAnalytics && !optVoice) await decide(false);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-foreground">Privacidade</div>
            <div className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              o que usamos pra te ajudar
            </div>
          </div>
        </div>

        <div className="mt-8 flex-1">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-foreground">
            Pra te dar a melhor experiência, o app aprende com você.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Tudo é seu, fica no seu perfil, e você pode mudar a qualquer momento em Configurações.
          </p>

          {!showCustom ? (
            <div className="mt-7 space-y-3">
              <Item
                icon={<Brain className="h-5 w-5" />}
                title="Memória de aprendizado"
                desc="Lembramos quais palavras e frases você erra ou esquece, pra revisar na hora certa."
              />
              <Item
                icon={<Mic className="h-5 w-5" />}
                title="Prática de voz"
                desc="Sua voz é processada pra te dar feedback de pronúncia. Áudio não é guardado."
              />
              <Item
                icon={<Users className="h-5 w-5" />}
                title="Perfil social"
                desc="Seu nome, @username e avatar ficam visíveis pra amigos e na comunidade."
              />
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              <Toggle
                icon={<Brain className="h-5 w-5" />}
                title="Memória de aprendizado"
                desc="Personaliza missões e revisões com base no seu histórico."
                value={optAnalytics}
                onChange={setOptAnalytics}
              />
              <Toggle
                icon={<Mic className="h-5 w-5" />}
                title="Prática de voz"
                desc="Permite usar microfone para feedback de pronúncia."
                value={optVoice}
                onChange={setOptVoice}
              />
              <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                Perfil social é necessário para usar comunidade e chat — você pode escolher o
                modo invisível depois.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {!showCustom ? (
            <>
              <Button
                onClick={acceptAll}
                disabled={busy}
                className="h-12 w-full rounded-xl bg-gradient-cta text-base font-bold text-primary-foreground shadow-glow"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Aceitar e começar"}
              </Button>
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="block w-full text-center text-sm font-semibold text-foreground/70 hover:text-foreground"
              >
                Personalizar permissões
              </button>
            </>
          ) : (
            <>
              <Button
                onClick={saveCustom}
                disabled={busy}
                className="h-12 w-full rounded-xl bg-gradient-cta text-base font-bold text-primary-foreground shadow-glow"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar e continuar"}
              </Button>
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="block w-full text-center text-sm font-semibold text-foreground/70 hover:text-foreground"
              >
                Voltar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Item({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <div>
        <div className="text-sm font-black text-foreground">{title}</div>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-foreground/75">{desc}</p>
      </div>
    </div>
  );
}

function Toggle({
  icon,
  title,
  desc,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-black text-foreground">{title}</div>
          <Switch checked={value} onCheckedChange={onChange} />
        </div>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-foreground/75">{desc}</p>
      </div>
    </div>
  );
}
