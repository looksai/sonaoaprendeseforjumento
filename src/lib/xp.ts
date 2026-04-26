// Lightweight XP feedback connected to the real Gamification Core.
import { toast } from "sonner";
import { awardGamificationXP, loadGamification } from "@/lib/gamification";

export function getXP(): number {
  return loadGamification().xp;
}

export function awardXP(amount: number, reason?: string) {
  if (amount <= 0) return;
  const next = awardGamificationXP(amount, reason ?? "Progresso");
  toast.success(`+${amount} XP${reason ? " · " + reason : ""}`, {
    duration: 1600,
    className: "font-semibold",
  });
  return next;
}
