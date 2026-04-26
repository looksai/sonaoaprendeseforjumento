// Personalize your experience — wallpaper, accessibility, daily goal.
// The visual identity (colors, cards, buttons) is unified across all screens.
// Only the background wallpaper is customizable.

import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import type React from "react";
import { AppShell } from "@/components/AppShell";
import { Check, ImagePlus, RotateCcw, Sparkles, Target } from "lucide-react";
import {
  useAppearance,
  WALLPAPERS,
  type WallpaperId,
} from "@/store/useAppearance";
import { useGoals, type DailyGoal } from "@/store/useGoals";

export const Route = createFileRoute("/personalizar")({
  head: () => ({
    meta: [
      { title: "Last Course — Personalize sua experiência" },
      {
        name: "description",
        content:
          "Escolha seu papel de parede e ajustes de acessibilidade. A identidade do app permanece consistente em todas as telas.",
      },
    ],
  }),
  component: PersonalizeGuarded,
});

function Personalize() {
  const a = useAppearance();
  const g = useGoals();

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2_500_000) {
      alert("Escolha uma imagem menor que 2.5MB para salvar no aparelho.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") a.setCustomBackground(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppShell>
      <div className="layout-page-x pt-8 pb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="layout-h1 font-bold tracking-tight">
            Personalize sua experiência
          </h1>
        </div>
        <p className="mt-2 layout-body text-foreground/75">
          A identidade visual do app é única e consistente. Aqui você escolhe apenas o papel de parede e ajustes de leitura.
        </p>
      </div>

      {/* === Background Wallpaper (image picker) === */}
      <Section title="Papel de parede" icon={<ImagePlus className="h-4 w-4" />}>
        <div className="surface-card rounded-3xl p-4">
          <div className="text-sm font-bold text-foreground">Imagem de fundo do app</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Toque numa imagem para usar como papel de parede. A interface (cards, botões e cores) permanece igual.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {WALLPAPERS.map((w) => {
              const isActive = !a.customBackground && a.wallpaper === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    a.clearCustomBackground();
                    a.setWallpaper(w.id);
                  }}
                  className={`relative overflow-hidden rounded-2xl border-2 transition-bounce active:scale-95 ${
                    isActive
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-transparent hover:border-primary/40"
                  }`}
                  style={{ aspectRatio: "16 / 10" }}
                >
                  <img
                    src={w.image}
                    alt={w.label}
                    className="wallpaper-preview-img absolute inset-0 h-full w-full object-contain"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 via-black/30 to-transparent p-2">
                    <div className="text-[0.72rem] font-black text-white">{w.label}</div>
                  </div>
                  {isActive && (
                    <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {a.customBackground && (
            <div className="mt-3 overflow-hidden rounded-2xl border-2 border-primary ring-2 ring-primary/40">
              <div className="relative" style={{ aspectRatio: "16 / 10" }}>
                <img
                  src={a.customBackground}
                  alt="Sua foto de fundo"
                  className="wallpaper-preview-img absolute inset-0 h-full w-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent p-2">
                  <div className="text-[0.72rem] font-black text-white">Sua foto</div>
                  <button
                    type="button"
                    onClick={a.clearCustomBackground}
                    className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[0.66rem] font-bold text-foreground"
                  >
                    <RotateCcw className="h-3 w-3" /> Voltar ao padrão
                  </button>
                </div>
              </div>
            </div>
          )}

          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/8 px-4 py-4 text-sm font-black text-primary transition-smooth active:scale-[0.99]">
            <ImagePlus className="h-5 w-5" />
            {a.customBackground ? "Trocar minha foto" : "Carregar minha foto"}
            <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
          </label>
          <p className="mt-2 text-[0.68rem] text-muted-foreground">
            Use imagens até 2.5MB para manter o app leve no celular.
          </p>
        </div>
      </Section>

      {/* === Daily Goal === */}
      <Section title="Seu objetivo diário" icon={<Target className="h-4 w-4" />}>
        <div className="grid grid-cols-3 gap-2">
          {([5, 10, 15] as DailyGoal[]).map((m) => (
            <button
              key={m}
              onClick={() => g.setGoal(m)}
              className={`surface-card rounded-2xl border-2 p-4 text-center transition-bounce active:scale-95 ${
                g.goal === m
                  ? "border-primary ring-2 ring-primary/30 text-primary"
                  : "border-transparent text-card-foreground hover:border-primary/40"
              }`}
            >
              <div className="text-xl font-bold">{m} min</div>
              <div className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                {m === 5 ? "Casual" : m === 10 ? "Constante" : "Intenso"}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* === Quick toggles === */}
      <Section title="Ajustes rápidos">
        <div className="space-y-2">
          <ToggleRow
            label="Mais contraste"
            description="Texto e bordas mais firmes."
            active={a.highContrast}
            onToggle={a.toggleHighContrast}
          />
          <ToggleRow
            label="Reduzir animações"
            description="Bom em telas com pouca bateria."
            active={a.reduceAnimations}
            onToggle={a.toggleReduceAnimations}
          />
          <ToggleRow
            label="Sensação clássica"
            description="Pulso suave quando seu Personal fala."
            active={a.classicFeel}
            onToggle={a.toggleClassicFeel}
          />
          <ToggleRow
            label="Lembretes diários"
            description="1 ou 2 toques curtos por dia."
            active={g.remindersOn}
            onToggle={g.toggleReminders}
          />
        </div>
      </Section>

      <div className="h-12" />
    </AppShell>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="layout-page-x layout-section">
      <h3 className="mb-3 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  active,
  onToggle,
}: {
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="surface-card flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-smooth active:scale-[0.99]"
    >
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-smooth ${
          active ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-bounce ${
            active ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// Suppress unused import warning for WallpaperId (kept for type consistency).
export type { WallpaperId };

function PersonalizeGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Personalize />
    </RequireAuth>
  );
}
