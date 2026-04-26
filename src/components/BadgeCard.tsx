import { Lock, Sparkles } from "lucide-react";

export function BadgeCard({
  emoji,
  name,
  description,
  awarded,
  awardedAt,
}: {
  emoji: string;
  name: string;
  description: string;
  awarded: boolean;
  awardedAt?: string | null;
}) {
  return (
    <div className={`rounded-3xl border p-4 shadow-soft transition-smooth ${awarded ? "border-primary/25 bg-card" : "border-border bg-muted/45 opacity-70"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${awarded ? "bg-primary/12" : "bg-background/60 grayscale"}`}>
          {awarded ? emoji : <Lock className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <h3 className="font-black leading-tight text-foreground">{name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          {awarded && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[0.62rem] font-black uppercase tracking-wider text-success">
              <Sparkles className="h-3 w-3" /> desbloqueado{awardedAt ? ` · ${new Date(awardedAt).toLocaleDateString()}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
