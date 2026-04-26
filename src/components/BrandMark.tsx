// BrandMark — the "Last Course" identity used across auth, onboarding & footer.
// Keeps the brand expression consistent and easy to update in one place.

import { Sparkles } from "lucide-react";

interface Props {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function BrandMark({ size = "md", showTagline = false }: Props) {
  const dim = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const titleClass =
    size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex ${dim} items-center justify-center rounded-xl bg-gradient-primary shadow-glow`}>
        <Sparkles className={size === "lg" ? "h-6 w-6 text-primary-foreground" : "h-5 w-5 text-primary-foreground"} />
      </div>
      <div>
        <div className={`${titleClass} font-bold tracking-tight leading-none`}>Last Course</div>
        {showTagline && (
          <div className="mt-1 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            o último curso de inglês
          </div>
        )}
      </div>
    </div>
  );
}
