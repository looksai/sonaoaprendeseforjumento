// Appearance store — UNIFIED design system.
// The visual identity (colors, cards, buttons, typography) is now ONE single
// theme defined in styles.css. The only remaining choice is the wallpaper
// (background image) and accessibility toggles. Layout and color themes
// have been removed for a strong, consistent premium identity.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import blueWatercolor from "@/assets/wallpapers/blue-watercolor.png";
import purpleGradient from "@/assets/wallpapers/purple-gradient.png";

export type WallpaperId = "blue" | "purple";

export interface WallpaperPreset {
  id: WallpaperId;
  label: string;
  description: string;
  image: string;
}

export const WALLPAPERS: WallpaperPreset[] = [
  {
    id: "blue",
    label: "Azul CSLE",
    description: "Textura azul clara, limpa e legível.",
    image: blueWatercolor,
  },
  {
    id: "purple",
    label: "Roxo CSLE",
    description: "Gradiente roxo suave e premium.",
    image: purpleGradient,
  },
];

// ---- Compatibility shims for legacy components still importing old names ----
// Theme and Layout choices are gone, but a few components still type-check
// against the old names. We expose minimal stubs so nothing breaks.
export type ThemeId = WallpaperId;
export type LayoutId = "cards";
export const THEMES = WALLPAPERS.map((w) => ({
  id: w.id,
  label: w.label,
  description: w.description,
  swatch:
    w.id === "purple"
      ? ["#2B1D78", "#7857FF", "#F0B8FF", "#FFFFFF"]
      : ["#BFEAFF", "#63BFEF", "#EAF8FF", "#FFFFFF"],
}));
export const LAYOUTS = [
  { id: "cards" as const, label: "Padrão", description: "Layout único e consistente." },
];

interface State {
  wallpaper: WallpaperId;
  highContrast: boolean;
  reduceAnimations: boolean;
  classicFeel: boolean;
  customBackground: string | null;
}

const DEFAULT: State = {
  wallpaper: "blue",
  highContrast: false,
  reduceAnimations: false,
  classicFeel: false,
  customBackground: null,
};

const STORAGE_KEY = "csle-appearance-v2";

function migrateWallpaper(t: unknown): WallpaperId {
  if (t === "blue" || t === "purple") return t;
  // Legacy migration from older visual experiments. Everything defaults
  // back to the unified blue identity.
  return "blue";
}

function load(): State {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from v1 store if present
      const legacy = localStorage.getItem("csle-appearance-v1");
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return {
          ...DEFAULT,
          wallpaper: migrateWallpaper(parsed?.theme),
          highContrast: !!parsed?.highContrast,
          reduceAnimations: !!parsed?.reduceAnimations,
          classicFeel: !!parsed?.classicFeel,
          customBackground: parsed?.customBackground ?? null,
        };
      }
      return DEFAULT;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...parsed,
      wallpaper: migrateWallpaper(parsed?.wallpaper),
    };
  } catch {
    return DEFAULT;
  }
}

function persist(s: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function applyToDom(s: State) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.toggleAttribute("data-high-contrast", s.highContrast);
  root.toggleAttribute("data-reduce-motion", s.reduceAnimations);
  root.toggleAttribute("data-classic-feel", s.classicFeel);

  const preset = WALLPAPERS.find((w) => w.id === s.wallpaper) ?? WALLPAPERS[0];
  const url = s.customBackground ?? preset.image;
  root.style.setProperty("--theme-image-main", `url("${url}")`);
  root.style.setProperty("--theme-image-alt", `url("${url}")`);
  root.style.setProperty(
    "--theme-wallpaper-base",
    s.customBackground ? "#0f172a" : s.wallpaper === "purple" ? "#1e174e" : "#dff5ff",
  );
}

interface Ctx extends State {
  // New API
  setWallpaper: (id: WallpaperId) => void;
  // Legacy aliases (kept for components that haven't been updated yet)
  theme: WallpaperId;
  layout: LayoutId;
  setTheme: (id: WallpaperId) => void;
  setLayout: (id: LayoutId) => void;
  toggleHighContrast: () => void;
  toggleReduceAnimations: () => void;
  toggleClassicFeel: () => void;
  setCustomBackground: (dataUrl: string) => void;
  clearCustomBackground: () => void;
}

const AppearanceContext = createContext<Ctx | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => load());

  useEffect(() => {
    applyToDom(state);
    persist(state);
  }, [state]);

  const setWallpaper = useCallback((id: WallpaperId) => {
    setState((s) => ({ ...s, wallpaper: id, customBackground: null }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      theme: state.wallpaper,
      layout: "cards" as LayoutId,
      setWallpaper,
      setTheme: setWallpaper,
      setLayout: () => {},
      toggleHighContrast: () =>
        setState((s) => ({ ...s, highContrast: !s.highContrast })),
      toggleReduceAnimations: () =>
        setState((s) => ({ ...s, reduceAnimations: !s.reduceAnimations })),
      toggleClassicFeel: () =>
        setState((s) => ({ ...s, classicFeel: !s.classicFeel })),
      setCustomBackground: (dataUrl) =>
        setState((s) => ({ ...s, customBackground: dataUrl })),
      clearCustomBackground: () =>
        setState((s) => ({ ...s, customBackground: null })),
    }),
    [state, setWallpaper],
  );

  return (
    <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
  );
}

export function useAppearance(): Ctx {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    return {
      ...DEFAULT,
      theme: DEFAULT.wallpaper,
      layout: "cards" as LayoutId,
      setWallpaper: () => {},
      setTheme: () => {},
      setLayout: () => {},
      toggleHighContrast: () => {},
      toggleReduceAnimations: () => {},
      toggleClassicFeel: () => {},
      setCustomBackground: () => {},
      clearCustomBackground: () => {},
    };
  }
  return ctx;
}

/** Legacy helper kept for compatibility; returns wallpaper image. */
export function getThemeImages(id: WallpaperId) {
  const w = WALLPAPERS.find((x) => x.id === id) ?? WALLPAPERS[0];
  return { main: w.image, alt: w.image };
}
