// Momentum chip — shows an unfinished thread on Home.
// Surfaces a weak topic the user struggled with, creating a return trigger
// without nagging. One subtle line, no CTA — the SRS card handles action.
import { Sparkles } from "lucide-react";

interface Props {
  weakTopic: string | null;
}

export function MomentumChip({ weakTopic }: Props) {
  if (!weakTopic) return null;
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/55 px-3.5 py-1.5 text-[0.72rem] font-medium text-foreground/85 backdrop-blur animate-fade-in">
      <Sparkles className="h-3.5 w-3.5 text-accent" />
      <span>
        Você está melhorando em <strong className="font-semibold">{weakTopic}</strong> — vamos
        firmar hoje.
      </span>
    </div>
  );
}
