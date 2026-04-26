import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Brain, Database, Home, RefreshCw, Route, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCSLE } from "@/store/useCSLE";
import { useMemory } from "@/store/useMemory";
import { useMemoryCoreV3 } from "@/store/useMemoryCoreV3";
import { usePersonalExperienceV4 } from "@/store/usePersonalExperienceV4";
import { useExperienceV5 } from "@/store/useExperienceV5";
import { TestModePanel } from "@/components/TestModePanel";

export function DebugBrainPanel() {
  const csle = useCSLE();
  const memory = useMemory();
  const memoryCore = useMemoryCoreV3();
  const experience = usePersonalExperienceV4();
  const v5 = useExperienceV5();

  function resetAllBrain() {
    csle.reset();
    memory.resetMemory();
    memoryCore.resetMemoryCore();
    experience.resetExperience();
    v5.resetFirstMagic();
    v5.markReset();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wider text-primary">
            <Brain className="h-3 w-3" /> Debug Panel v5
          </p>
          <h1 className="mt-2 text-2xl font-black text-foreground">Raio-X do cérebro</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Painel escondido para validar se o app está vivo por dentro.</p>
        </div>
        <Link to="/">
          <Button variant="outline" className="rounded-2xl">
            <Home className="mr-2 h-4 w-4" /> Home
          </Button>
        </Link>
      </div>

      <TestModePanel />

      <DebugCard icon={<Route className="h-4 w-4" />} title="CSLE Engine">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Metric label="Modo" value={csle.modeLabel} />
          <Metric label="Tópico" value={csle.currentTopic ?? "nenhum"} />
          <Metric label="Erros" value={String(csle.errorCount)} />
          <Metric label="Sequência" value={String(csle.successStreak)} />
        </div>
        <p className="mt-3 rounded-2xl bg-muted/60 px-3 py-2 text-xs leading-relaxed text-foreground/70">{csle.modeDescription}</p>
        <Progress className="mt-3" value={Math.round(csle.engagementScore * 100)} />
      </DebugCard>

      <DebugCard icon={<Target className="h-4 w-4" />} title="Mission + Skill Graph">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Metric label="Missão ativa" value={experience.activeMission?.title ?? "nenhuma"} />
          <Metric label="Mastery" value={`${Math.round(experience.mastery * 100)}%`} />
          <Metric label="Mais forte" value={experience.strongest.join(", ")} />
          <Metric label="Mais fraco" value={experience.weakest.join(", ")} />
        </div>
        <div className="mt-3 grid gap-2">
          {Object.entries(experience.skillGraph).map(([skill, value]) => (
            <div key={skill}>
              <div className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>{skill}</span><span>{Math.round(Number(value) * 100)}%</span>
              </div>
              <Progress value={Math.round(Number(value) * 100)} />
            </div>
          ))}
        </div>
      </DebugCard>

      <DebugCard icon={<Database className="h-4 w-4" />} title="Memory Core">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Metric label="Eventos" value={String(memory.events.length)} />
          <Metric label="Hot/Warm/Cold" value={`${memory.hotEvents.length}/${memory.warmEvents.length}/${memory.coldEvents.length}`} />
          <Metric label="Resumos diários" value={String(memoryCore.dailySummaries.length)} />
          <Metric label="Replays" value={String(memoryCore.sessionReplays.length)} />
        </div>
        <div className="mt-3 space-y-2">
          {(memoryCore.latestReplay ? [memoryCore.latestReplay.nextStep] : memory.hotEvents.slice(0, 3).map((event) => event.content)).map((line, index) => (
            <p key={`${line}-${index}`} className="rounded-2xl bg-muted/60 px-3 py-2 text-xs leading-relaxed text-foreground/72">{line}</p>
          ))}
        </div>
      </DebugCard>

      <DebugCard icon={<Sparkles className="h-4 w-4" />} title="Experience v5">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <Metric label="Test Mode" value={v5.testMode ? "ativo" : "desligado"} />
          <Metric label="First Magic" value={v5.firstMagicDone ? "concluída" : "pendente"} />
          <Metric label="Debug aberto" value={`${v5.debugOpenCount}x`} />
          <Metric label="Visual" value={v5.visualDensity} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => v5.setVisualDensity(v5.visualDensity === "calm" ? "rich" : "calm")}>Alternar visual</Button>
          <Button variant="outline" className="rounded-2xl" onClick={resetAllBrain}><RefreshCw className="mr-2 h-4 w-4" /> Reset cérebro</Button>
        </div>
      </DebugCard>
    </div>
  );
}

function DebugCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card/90 p-4 shadow-soft backdrop-blur-md">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/12 text-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/55 px-3 py-2">
      <p className="text-[0.62rem] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
