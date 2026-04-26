import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PORTUGUESE_TRACK, getTierLabel, getTutorLanguageLabel, type PortugueseMode } from "@/lib/globalPortuguese";
import { useGlobalPortuguese } from "@/store/useGlobalPortuguese";
import { BookOpen, CheckCircle2, Globe2, Languages } from "lucide-react";

export function GlobalPortuguesePanel() {
  const global = useGlobalPortuguese();
  const completed = global.completedUnitIds.length;
  const progress = Math.round((completed / PORTUGUESE_TRACK.length) * 100);

  return (
    <div className="surface-elevated rounded-3xl border border-primary/15 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-primary">
            <Globe2 className="h-3.5 w-3.5" /> Parte 3 · Português Global
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">Brazilian Portuguese, do jeito real</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Linha central A1–C2 para estrangeiros, círculos com exemplos do Brasil real e espirais com sotaques regionais. Tudo local-first para testar antes de plugar assinatura, pagamentos e Realtime.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1">{getTierLabel(global.subscriptionTier)}</Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/40 p-4">
          <Languages className="h-5 w-5 text-primary" />
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Personal bilíngue</div>
          <Select value={global.tutorLanguage} onValueChange={(value) => global.setTutorLanguage(value as PortugueseMode)}>
            <SelectTrigger className="mt-3 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English → Portuguese</SelectItem>
              <SelectItem value="spanish">Español → Portugués</SelectItem>
              <SelectItem value="french">Français → Portugais</SelectItem>
              <SelectItem value="mixed">Multilíngue</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">Atual: {getTutorLanguageLabel(global.tutorLanguage)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-background/40 p-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Trilha PT-BR</div>
          <div className="mt-3 text-2xl font-black text-foreground">{progress}%</div>
          <Progress value={progress} className="mt-2 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{completed}/{PORTUGUESE_TRACK.length} unidades concluídas</p>
        </div>

        <div className="rounded-2xl border border-border bg-background/40 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Oferta global</div>
          <div className="mt-3 text-lg font-black text-foreground">US$10 / €10 / R$10</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Assinatura simulada para preparar paywall, créditos e videochamada paga na integração final.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {PORTUGUESE_TRACK.map((unit) => {
          const done = global.completedUnitIds.includes(unit.id);
          return (
            <div key={unit.id} className="rounded-2xl border border-border bg-background/35 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full">{unit.level}</Badge>
                    <h3 className="font-black text-foreground">{unit.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Linha: {unit.lineGoal}</p>
                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                    <div className="rounded-xl bg-muted/35 p-3"><strong>Círculo:</strong> {unit.circleExamples.slice(0, 2).join(" · ")}</div>
                    <div className="rounded-xl bg-muted/35 p-3"><strong>Espiral:</strong> {unit.spiralPrompts.slice(0, 2).join(" · ")}</div>
                  </div>
                </div>
                <Button variant={done ? "outline" : "default"} className="rounded-xl" onClick={() => global.completeUnit(unit.id)}>
                  {done ? "Concluída" : "Marcar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
