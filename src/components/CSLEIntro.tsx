import type { ReactNode } from "react";
import { BookOpen, Tv, Repeat, Mic, Brain, Sparkles } from "lucide-react";

function IntroItem({
  icon,
  title,
  text,
  tone,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  tone: "primary" | "accent" | "success";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/15 text-primary"
      : tone === "accent"
        ? "bg-accent/20 text-accent"
        : "bg-success/20 text-success";
  return (
    <div className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
        {icon}
      </div>
      <div>
        <div className="font-semibold leading-tight">{title}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

export function CSLEIntro() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-primary p-5 text-white shadow-glow">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
          <Sparkles className="h-4 w-4" /> CSLE
        </div>
        <h3 className="mt-1 text-lg font-bold">Cognitive Spiral Learning Engine</h3>
        <p className="mt-1.5 text-sm text-white/90">
          Não é só um curso. É um sistema que <strong>ensina, escuta, lembra e se adapta</strong> a você.
        </p>
      </div>

      <IntroItem
        icon={<BookOpen className="h-5 w-5" />}
        title="A linha central"
        text="O curso estruturado (A1 → B2) é a sua trilha principal. Lições claras, com gramática e comunicação progredindo passo a passo."
        tone="primary"
      />
      <IntroItem
        icon={<Tv className="h-5 w-5" />}
        title="Os ramos"
        text="Séries, YouTube, música e legendas reforçam o que você aprende — sempre conectados ao curso, nunca soltos."
        tone="accent"
      />
      <IntroItem
        icon={<Repeat className="h-5 w-5" />}
        title="A espiral"
        text="Os mesmos conceitos voltam de formas diferentes, mais profundas. É assim que o cérebro fixa de verdade."
        tone="success"
      />
      <IntroItem
        icon={<Mic className="h-5 w-5" />}
        title="Prática de voz"
        text="Você ouve, repete e fala. O sistema escuta sua pronúncia e mostra exatamente onde melhorar."
        tone="primary"
      />
      <IntroItem
        icon={<Brain className="h-5 w-5" />}
        title="Memória adaptativa"
        text="Tudo que você erra entra na sua revisão personalizada. O app aprende seus pontos fracos e reforça eles."
        tone="accent"
      />
    </div>
  );
}

export function ComoUsar() {
  const steps = [
    { n: 1, t: "Continue a lição", d: "Abra o curso e siga sua trilha A1 → B2." },
    { n: 2, t: "Ouça e repita", d: "Use o player com voz nativa e dicas de pronúncia." },
    { n: 3, t: "Fale", d: "Grave sua voz no karaokê — veja palavra por palavra." },
    { n: 4, t: "Revise pontos fracos", d: "A aba Revisar traz o que você mais errou." },
    { n: 5, t: "Explore (opcional)", d: "Séries, música e legendas para reforçar." },
  ];
  return (
    <div className="space-y-2.5">
      {steps.map((s) => (
        <div key={s.n} className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {s.n}
          </div>
          <div>
            <div className="font-semibold leading-tight">{s.t}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">{s.d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

