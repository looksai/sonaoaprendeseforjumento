import { useSocial } from "@/store/useSocial";

export function SocialThemeCustomizer() {
  const { theme, setTheme } = useSocial();
  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Personalização social</div>
      <p className="mt-1 text-sm text-muted-foreground">Base nostálgica MSN/UOL: simples, afetiva e customizável.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(["blue", "pink", "green", "purple"] as const).map((accent) => (
          <button key={accent} onClick={() => setTheme({ accent })} className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize ${theme.accent === accent ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/40 text-muted-foreground"}`}>{accent}</button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["stars", "gradient", "grid", "waves"] as const).map((wallpaper) => (
          <button key={wallpaper} onClick={() => setTheme({ wallpaper })} className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize ${theme.wallpaper === wallpaper ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/40 text-muted-foreground"}`}>{wallpaper}</button>
        ))}
      </div>
    </div>
  );
}
