import { Flame, Trophy, Clock } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
  totalMinutes: number;
  completedCount: number;
}

export function StreakBadge({ streak, totalMinutes, completedCount }: StreakBadgeProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <Stat icon={<Flame className="h-3.5 w-3.5" />} tone="warning" label="Streak" value={streak} hint={streak === 1 ? "dia" : "dias"} />
      <Stat icon={<Trophy className="h-3.5 w-3.5" />} tone="success" label="Lições" value={completedCount} hint="completas" />
      <Stat icon={<Clock className="h-3.5 w-3.5" />} tone="primary" label="Tempo" value={totalMinutes} hint="minutos" />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  tone: "warning" | "success" | "primary";
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning"
      : tone === "success"
        ? "text-success"
        : "text-primary";
  return (
    <div className="surface-card rounded-2xl p-3">
      <div className={`flex items-center gap-1.5 ${toneClass}`}>
        {icon}
        <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="text-[0.7rem] text-muted-foreground">{hint}</div>
    </div>
  );
}
