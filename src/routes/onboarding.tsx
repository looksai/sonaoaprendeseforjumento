import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProgress, type DopamineProfile } from "@/store/useProgress";
import { ArrowRight, ArrowLeft, Sparkles, Volume2, User, UserRound } from "lucide-react";
import { ComoUsar } from "@/components/CSLEIntro";
import { InterestPicker } from "@/components/InterestPicker";
import { AvatarUpload } from "@/components/AvatarUpload";
import { usePersonal, type PersonalStyle } from "@/store/usePersonal";
import { useVoicePrefs, VOICES, type VoiceId } from "@/store/useVoicePrefs";
import { useEnglishVoice } from "@/hooks/useEnglishVoice";
import {
  SHOW_SUGGESTIONS,
  MUSIC_SUGGESTIONS,
  HOBBY_SUGGESTIONS,
} from "@/data/interestSuggestions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Last Course — Comece sua jornada" },
      {
        name: "description",
        content:
          "Last Course: o último curso de inglês que você precisa. Personalize sua jornada em poucos passos.",
      },
    ],
  }),
  component: OnboardingGuarded,
});

const STEPS = 11;

function Onboarding() {
  const navigate = useNavigate();
  const { setProfile } = useProgress();
  const personal = usePersonal();
  const voicePrefs = useVoicePrefs();
  const englishVoice = useEnglishVoice();

  const [step, setStep] = useState(0);
  const [profile, setProfileState] = useState<DopamineProfile>({
    name: "",
    avatar: undefined,
    favoriteShows: "",
    favoriteMusic: "",
    hobbies: "",
    motivation: "",
    level: "A1",
    hoursPerDay: 4,
  });

  // Personal setup state — applied at finish().
  const [personalName, setPersonalName] = useState("Mia");
  const [personalVoice, setPersonalVoice] = useState<VoiceId>("sarah");
  const [personalStyle, setPersonalStyle] = useState<PersonalStyle>("fem");

  function update<K extends keyof DopamineProfile>(key: K, value: DopamineProfile[K]) {
    setProfileState((p) => ({ ...p, [key]: value }));
  }

  function next() {
    if (step < STEPS - 1) setStep(step + 1);
    else finish();
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }
  function finish() {
    const cleaned: DopamineProfile = {
      ...profile,
      name: profile.name.trim(),
      favoriteShows: profile.favoriteShows.trim(),
      favoriteMusic: profile.favoriteMusic.trim(),
      hobbies: profile.hobbies.trim(),
      motivation: profile.motivation.trim(),
    };
    setProfile(cleaned);
    // Persist Personal identity & voice choice.
    voicePrefs.setVoice(personalVoice);
    personal.activate(personalName.trim() || (personalStyle === "fem" ? "Mia" : "Alex"), personalStyle);
    // Send the user to the guided first-experience.
    navigate({ to: "/welcome" });
  }

  function previewVoice(voice: VoiceId) {
    setPersonalVoice(voice);
    englishVoice.play("Hi, I'm your personal. Nice to meet you.", { voice });
  }

  const canProceed = (() => {
    if (step === 2) return profile.name.trim().length >= 1;
    if (step === 8) return personalName.trim().length >= 1;
    return true;
  })();

  return (
    <AppShell hideNav>
      <div className="flex min-h-screen flex-col px-6 py-8">
        <div className="flex justify-center gap-1.5 pb-8">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-smooth ${
                i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/60" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 animate-fade-in-up">
          {step === 0 && (
            <Step
              eyebrow="Bem-vindo"
              title="Last Course"
              subtitle="Este é o último curso de inglês que você vai precisar comprar."
            >
              <div className="space-y-3">
                <div className="rounded-2xl bg-gradient-primary p-5 text-white shadow-glow">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/85">
                    <Sparkles className="h-4 w-4" /> Por que diferente
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/95">
                    Sem lições aleatórias. Sem repetição sem sentido. Você aprende com o que ama —
                    séries, música, conversas reais — e o sistema se adapta a você.
                  </p>
                </div>
                <Bullet text="Aprenda com o que você já consome" />
                <Bullet text="O sistema escuta, lembra e se adapta" />
                <Bullet text="Pare de pular de curso em curso" />
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step
              eyebrow="Como funciona"
              title="Um fluxo simples, todos os dias"
              subtitle="Sem sobrecarga. Sempre uma próxima ação clara."
            >
              <ComoUsar />
            </Step>
          )}

          {step === 2 && (
            <Step
              eyebrow="Vamos começar"
              title="Como podemos te chamar?"
              subtitle="Vamos personalizar a sua jornada."
            >
              <Input
                autoFocus
                placeholder="Seu nome ou apelido"
                value={profile.name}
                onChange={(e) => update("name", e.target.value)}
                className="h-14 rounded-2xl border-2 text-lg"
                maxLength={40}
              />
            </Step>
          )}

          {step === 3 && (
            <Step
              eyebrow="Sua jornada"
              title="Adicione sua foto"
              subtitle="Esse espaço é seu. (Opcional — você pode pular.)"
            >
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <AvatarUpload
                  value={profile.avatar}
                  onChange={(v) => update("avatar", v)}
                  fallbackInitial={profile.name || "·"}
                  size={140}
                />
                <p className="max-w-[260px] text-center text-xs text-muted-foreground">
                  Sua foto fica salva só pra você — torna o app mais seu.
                </p>
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step
              eyebrow="Nível"
              title="Onde você está hoje?"
              subtitle="Não se preocupe, dá pra ajustar depois."
            >
              <div className="space-y-2.5">
                {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => update("level", lvl)}
                    className={`w-full rounded-2xl border p-4 text-left transition-bounce ${
                      profile.level === lvl
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="text-lg font-bold text-foreground">{lvl}</div>
                    <div className="text-sm text-muted-foreground">
                      {lvl === "A1" && "Estou começando do zero"}
                      {lvl === "A2" && "Sei o básico mas travo nas conversas"}
                      {lvl === "B1" && "Já consigo me virar em viagens"}
                      {lvl === "B2" && "Falo razoavelmente, quero fluência"}
                    </div>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step
              eyebrow="Suas referências"
              title="O que te dá vontade de assistir?"
              subtitle="Vamos puxar exemplos das séries e artistas que você ama."
            >
              <div className="space-y-5">
                <InterestPicker
                  label="Séries e filmes favoritos"
                  placeholder="Ex: Friends, Stranger Things…"
                  value={profile.favoriteShows}
                  onChange={(v) => update("favoriteShows", v)}
                  suggestions={SHOW_SUGGESTIONS}
                  tone="primary"
                />
                <InterestPicker
                  label="Artistas e bandas favoritos"
                  placeholder="Ex: Taylor Swift, Coldplay…"
                  value={profile.favoriteMusic}
                  onChange={(v) => update("favoriteMusic", v)}
                  suggestions={MUSIC_SUGGESTIONS}
                  tone="accent"
                />
              </div>
            </Step>
          )}

          {step === 6 && (
            <Step
              eyebrow="Seu mundo"
              title="Hobbies e interesses"
              subtitle="Quanto mais a gente sabe, mais natural fica o seu inglês."
            >
              <InterestPicker
                placeholder="Adicionar interesse…"
                value={profile.hobbies}
                onChange={(v) => update("hobbies", v)}
                suggestions={HOBBY_SUGGESTIONS}
                tone="success"
                maxItems={10}
              />
            </Step>
          )}

          {step === 7 && (
            <Step
              eyebrow="Seu porquê"
              title="Por que aprender inglês agora?"
              subtitle="A gente lembra você disso quando bater o desânimo."
            >
              <Textarea
                placeholder="Ex: trabalho remoto, viagem, série sem legenda, mudança..."
                value={profile.motivation}
                onChange={(e) => update("motivation", e.target.value)}
                className="min-h-[100px] rounded-2xl border-2"
                maxLength={500}
              />
              <div className="mt-5">
                <Label className="text-sm font-semibold">
                  Quantas horas por dia consegue dedicar?
                </Label>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => update("hoursPerDay", h)}
                      className={`rounded-xl border-2 py-3 font-bold transition-bounce ${
                        profile.hoursPerDay === h
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </Step>
          )}

          {/* === Personal: name === */}
          {step === 8 && (
            <Step
              eyebrow="Seu Personal"
              title="Como você quer chamar seu Personal?"
              subtitle="Não é um professor. É alguém ao seu lado pra te guiar passo a passo."
            >
              <Input
                autoFocus
                placeholder="Ex: Mia, Alex, Sky…"
                value={personalName}
                onChange={(e) => setPersonalName(e.target.value)}
                className="h-14 rounded-2xl border-2 text-lg"
                maxLength={24}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Você pode trocar o nome quando quiser.
              </p>
            </Step>
          )}

          {/* === Personal: style (fem/masc) === */}
          {step === 9 && (
            <Step
              eyebrow="Seu Personal"
              title="Estilo da voz"
              subtitle="Qual estilo combina mais com você?"
            >
              <div className="grid grid-cols-2 gap-3">
                <StyleCard
                  active={personalStyle === "fem"}
                  onClick={() => {
                    setPersonalStyle("fem");
                    if (personalVoice === "brian") setPersonalVoice("sarah");
                  }}
                  icon={<UserRound className="h-6 w-6" />}
                  label="Feminino"
                />
                <StyleCard
                  active={personalStyle === "masc"}
                  onClick={() => {
                    setPersonalStyle("masc");
                    setPersonalVoice("brian");
                  }}
                  icon={<User className="h-6 w-6" />}
                  label="Masculino"
                />
              </div>
            </Step>
          )}

          {/* === Personal: voice (US only) === */}
          {step === 10 && (
            <Step
              eyebrow="Seu Personal"
              title="Escolha a voz"
              subtitle="Todas em inglês americano. Toque pra ouvir."
            >
              <div className="space-y-2.5">
                {VOICES.filter((v) =>
                  personalStyle === "fem" ? v.gender === "f" : v.gender === "m",
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => previewVoice(v.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-bounce ${
                      personalVoice === v.id
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <div className="text-lg font-bold text-foreground">{v.label}</div>
                      <div className="text-sm text-muted-foreground">{v.tagline}</div>
                    </div>
                    <Volume2
                      className={`h-5 w-5 ${
                        personalVoice === v.id ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Pode trocar depois nas configurações de voz.
              </p>
            </Step>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          {step > 0 && (
            <Button variant="outline" onClick={back} className="rounded-xl border-border bg-card px-4 py-6 hover:bg-surface">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Button
            onClick={next}
            disabled={!canProceed}
            className="flex-1 rounded-xl bg-gradient-cta py-6 text-base font-semibold text-primary-foreground shadow-glow transition-bounce hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
          >
            {step === STEPS - 1 ? "Conhecer meu Personal" : "Continuar"}
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Step({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1.5 text-2xl font-bold leading-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="surface-card flex items-center gap-3 rounded-2xl px-4 py-3">
      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

function StyleCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 transition-bounce ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-glow"
          : "border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function OnboardingGuarded() {
  return (
    <RequireAuth requireProfile={false}>
      <Onboarding />
    </RequireAuth>
  );
}
