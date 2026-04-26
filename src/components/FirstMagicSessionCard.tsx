import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CheckCircle2, MessageCircle, Sparkles, Target, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExperienceV5 } from "@/store/useExperienceV5";
import { useMemory } from "@/store/useMemory";
import { useMemoryCoreV3 } from "@/store/useMemoryCoreV3";
import { usePersonalExperienceV4 } from "@/store/usePersonalExperienceV4";
import { useCSLE } from "@/store/useCSLE";
import { useProgress } from "@/store/useProgress";

export function FirstMagicSessionCard({ compact = false }: { compact?: boolean }) {
  const v5 = useExperienceV5();
  const memory = useMemory();
  const memoryCore = useMemoryCoreV3();
  const experience = usePersonalExperienceV4();
  const csle = useCSLE();
  const progress = useProgress();

  if (!v5.needsFirstMagic) return null;

  const weakTopics = memory.weakTopics.map((topic) => topic.topic).slice(0, 3);
  const userName = progress.profile?.name?.split(" ")[0] || "amigo";

  function primeMagicSession() {
    v5.startFirstMagic();
    memory.recordEvent({
      content: `Primeira sessão mágica iniciada por ${userName}: o Personal explicou que aprende como o usuário aprende.`,
      emotion: "positive",
      importance: 0.82,
      tags: ["first-magic-session", "onboarding-2", "personal"],
      source: "system",
    });
    memoryCore.markSessionStart();
    csle.signal("chat_opened");
    experience.recordSkillEvent("chat_sent", 0.6);
  }

  function complete() {
    v5.completeFirstMagic();
    experience.completeMission(experience.activeMission?.id);
    memory.recordEvent({
      content: "Primeira sessão mágica concluída: o usuário viu missão, memória, Personal e próximo passo em um único fluxo.",
      emotion: "positive",
      importance: 0.8,
      tags: ["first-magic-session", "completed", "milestone"],
      source: "system",
    });
  }

  return (
    <div className="mx-5 overflow-hidden rounded-[1.75rem] border border-primary/20 bg-card/92 shadow-glow backdrop-blur-md">
      <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-transparent p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> First Magic Session v5
            </p>
            <h3 className="mt-3 text-xl font-black leading-tight text-foreground">
              Eu aprendo como você aprende.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">
              Esse é o primeiro fluxo mágico: Personal, missão, memória e replay funcionando juntos em poucos minutos.
            </p>
          </div>
          <button onClick={complete} className="rounded-full bg-background/70 p-2 text-muted-foreground transition-smooth hover:text-foreground" aria-label="Ocultar sessão mágica">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!compact && (
        <div className="grid gap-2 px-4 pt-3">
          <MagicStep icon={<MessageCircle className="h-4 w-4" />} title="1. Conversa pessoal" text={`Começa com uma pergunta simples para ${userName}.`} />
          <MagicStep icon={<Target className="h-4 w-4" />} title="2. Missão curta" text="O Mission Engine escolhe uma ação vencível." />
          <MagicStep icon={<Volume2 className="h-4 w-4" />} title="3. Voz + memória" text="O Personal fala, registra o contexto e prepara replay." />
        </div>
      )}

      <div className="px-4 py-4">
        {weakTopics.length > 0 && (
          <p className="mb-3 rounded-2xl bg-muted/60 px-3 py-2 text-xs leading-relaxed text-foreground/70">
            O app já percebeu pontos para cuidar: <strong>{weakTopics.join(", ")}</strong>.
          </p>
        )}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Link to="/conversar" search={{ intent: "first_magic_session" }} onClick={primeMagicSession}>
            <Button className="h-12 w-full rounded-2xl bg-gradient-primary font-black shadow-soft">
              Começar sessão mágica
            </Button>
          </Link>
          <Button variant="outline" onClick={complete} className="h-12 rounded-2xl px-3">
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MagicStep({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-black text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
