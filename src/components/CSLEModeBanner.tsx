import { Brain, CircleDot, Route, Sparkles } from "lucide-react";
import { useCSLE, type CSLEMode } from "@/store/useCSLE";

function iconFor(mode: CSLEMode) {
  if (mode === "LINE") return <Route className="h-3.5 w-3.5" />;
  if (mode === "CIRCLE") return <CircleDot className="h-3.5 w-3.5" />;
  if (mode === "SPIRAL") return <Sparkles className="h-3.5 w-3.5" />;
  return <Brain className="h-3.5 w-3.5" />;
}

export function CSLEModeBanner({ compact = false }: { compact?: boolean }) {
  const csle = useCSLE();

  return (
    <div className={`rounded-2xl border border-primary/15 bg-primary/7 ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          {iconFor(csle.mode)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">CSLE ativo</span>
            <span className="rounded-full bg-background/70 px-2 py-0.5 text-[0.62rem] font-semibold text-foreground/70">
              {csle.modeLabel}
            </span>
          </div>
          {!compact && <p className="mt-1 text-xs leading-relaxed text-foreground/70">{csle.modeDescription}</p>}
        </div>
      </div>
    </div>
  );
}
