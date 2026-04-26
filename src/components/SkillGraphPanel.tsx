import { Award, TrendingUp } from "lucide-react";
import { skillLabel, type SkillGraph, type SkillKey } from "@/lib/personalExperienceV4";

const SKILLS: SkillKey[] = ["speaking", "listening", "grammar", "vocabulary", "pronunciation", "confidence"];

export function SkillGraphPanel({ graph, mastery, compact = false }: { graph: SkillGraph; mastery: number; compact?: boolean }) {
  const visible = compact ? SKILLS.slice(0, 4) : SKILLS;
  return (
    <div className="mx-5 rounded-3xl border border-primary/15 bg-card/88 p-4 shadow-soft backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">Passe do Aluno</p>
          <h3 className="mt-1 text-base font-black text-foreground">Skill Graph vivo</h3>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
          <Award className="h-3.5 w-3.5" /> {Math.round(mastery * 100)}%
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {visible.map((skill) => {
          const value = Math.round(graph[skill] * 100);
          return (
            <div key={skill}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground/80">{skillLabel(skill)}</span>
                <span className="font-black text-primary">{value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${Math.max(4, value)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-primary/7 px-3 py-2 text-xs leading-relaxed text-foreground/70">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          O progresso sobe por eventos reais: voz, revisão, círculo, espiral e missão concluída. Não é streak vazio.
        </div>
      )}
    </div>
  );
}
