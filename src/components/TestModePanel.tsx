import { Activity, Bug, CheckCircle2, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCSLE } from "@/store/useCSLE";
import { useMemory } from "@/store/useMemory";
import { useMemoryCoreV3 } from "@/store/useMemoryCoreV3";
import { usePersonalExperienceV4 } from "@/store/usePersonalExperienceV4";
import { useExperienceV5 } from "@/store/useExperienceV5";

export function TestModePanel({ compact = false }: { compact?: boolean }) {
  const v5 = useExperienceV5();
  const csle = useCSLE();
  const memory = useMemory();
  const memoryCore = useMemoryCoreV3();
  const experience = usePersonalExperienceV4();

  function simulateCorrect() {
    csle.signal("practice_correct", { topic: "Present Simple" });
    experience.recordSkillEvent("grammar_success");
    memory.recordEvent({
      content: "Teste: acerto simulado para validar Linha/Espiral e Skill Graph.",
      emotion: "positive",
      importance: 0.52,
      tags: ["test-mode", "correct"],
      source: "system",
    });
  }

  function simulateError() {
    csle.signal("practice_incorrect", { topic: "Present Simple" });
    experience.recordSkillEvent("grammar_error");
    memory.recordEvent({
      content: "Teste: erro simulado para validar entrada em Círculo de reforço.",
      emotion: "neutral",
      importance: 0.5,
      tags: ["test-mode", "error", "difficulty"],
      source: "system",
    });
  }

  function forceReplay() {
    memoryCore.createReplay({
      messages: [
        { role: "assistant", content: "Vamos treinar uma frase curta." },
        { role: "user", content: "I eats an apple" },
        { role: "assistant", content: "Quase. O correto é: I eat an apple." },
      ],
      csleMode: csle.mode,
      weakTopics: memory.weakTopics.map((topic) => topic.topic).slice(0, 3),
      agent: "Tutor",
      startedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    });
  }

  function softReset() {
    csle.reset();
    experience.clearActiveMission();
    v5.markReset();
  }

  return (
    <div className="rounded-3xl border border-amber-400/25 bg-amber-50/70 p-4 text-amber-950 shadow-soft dark:bg-amber-950/20 dark:text-amber-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider">
            <Bug className="h-3 w-3" /> Test Mode v5
          </p>
          <h3 className="mt-2 text-lg font-black">Laboratório do cérebro</h3>
          {!compact && <p className="mt-1 text-sm leading-relaxed opacity-80">Use para validar CSLE, missão, replay e Skill Graph sem precisar fazer uma lição real.</p>}
        </div>
        <button onClick={v5.toggleTestMode} className="rounded-full bg-background/70 px-3 py-1 text-xs font-black text-foreground">
          {v5.testMode ? "ON" : "OFF"}
        </button>
      </div>

      {v5.testMode && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={simulateCorrect} className="rounded-2xl bg-background/70">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Acerto
          </Button>
          <Button variant="outline" onClick={simulateError} className="rounded-2xl bg-background/70">
            <XCircle className="mr-2 h-4 w-4" /> Erro
          </Button>
          <Button variant="outline" onClick={forceReplay} className="rounded-2xl bg-background/70">
            <Activity className="mr-2 h-4 w-4" /> Replay
          </Button>
          <Button variant="outline" onClick={softReset} className="rounded-2xl bg-background/70">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset leve
          </Button>
        </div>
      )}

      {v5.lastResetAt && (
        <p className="mt-3 flex items-center gap-1 text-[0.7rem] font-semibold opacity-70">
          <RefreshCw className="h-3 w-3" /> Último reset: {new Date(v5.lastResetAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
