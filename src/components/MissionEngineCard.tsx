import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Route, Sparkles, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { skillLabel, type EnergyState, type Mission } from "@/lib/personalExperienceV4";

export function MissionEngineCard({
  mission,
  energy,
  voiceText,
  onComplete,
  onSpeak,
  onDismiss,
  compact = false,
}: {
  mission: Mission | null;
  energy: EnergyState;
  voiceText?: string;
  onComplete?: () => void;
  onSpeak?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}) {
  if (!mission) return null;

  const energyLabel: Record<EnergyState, string> = {
    flow: "Flow detectado",
    steady: "Ritmo estável",
    confused: "Círculo recomendado",
    tired: "Modo leve",
    returning: "Retorno sem culpa",
  };

  return (
    <div className="mx-5 overflow-hidden rounded-3xl border border-accent/20 bg-card/90 shadow-soft backdrop-blur-md">
      <div className="bg-gradient-to-br from-primary/18 via-accent/10 to-transparent p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-accent">
              <Sparkles className="h-3 w-3" /> Mission Engine v4
            </p>
            <h3 className="mt-3 text-lg font-black leading-tight text-foreground">{mission.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/72">{mission.promise}</p>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="rounded-full bg-background/70 p-2 text-muted-foreground transition-smooth hover:text-foreground" aria-label="Fechar missão">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-primary">
            <Clock className="h-3.5 w-3.5" /> {mission.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-accent">
            <Route className="h-3.5 w-3.5" /> {mission.csleMode}
          </span>
          <span className="rounded-full bg-background/70 px-2.5 py-1 text-foreground/70">{energyLabel[energy]}</span>
        </div>
      </div>

      {!compact && (
        <div className="px-4 pt-3">
          <p className="text-[0.68rem] font-black uppercase tracking-wider text-muted-foreground">Por que essa missão apareceu</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/72">{mission.reason}</p>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="grid gap-2">
          {mission.steps.map((step, index) => (
            <div key={step} className="flex items-start gap-2 rounded-2xl bg-muted/55 px-3 py-2 text-sm text-foreground/78">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.65rem] font-black text-primary">{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {mission.targetSkills.map((skill) => (
            <span key={skill} className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.68rem] font-bold text-foreground/70">
              {skillLabel(skill)}
            </span>
          ))}
        </div>

        {voiceText && !compact && <p className="mt-3 rounded-2xl bg-primary/7 px-3 py-2 text-xs italic leading-relaxed text-foreground/70">“{voiceText}”</p>}

        <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
          <Link to="/conversar" search={{ intent: mission.kind }} className="min-w-0">
            <Button className="h-11 w-full rounded-2xl bg-gradient-primary font-black shadow-soft">Começar</Button>
          </Link>
          {onSpeak && (
            <Button variant="outline" onClick={onSpeak} className="h-11 rounded-2xl px-3">
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
          {onComplete && (
            <Button variant="outline" onClick={onComplete} className="h-11 rounded-2xl px-3">
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
