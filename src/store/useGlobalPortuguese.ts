import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  ACCENT_PACKS,
  PORTUGUESE_TRACK,
  estimateCallCost,
  type AccentId,
  type PortugueseMode,
  type SubscriptionTier,
} from "@/lib/globalPortuguese";

type ScheduledCall = {
  id: string;
  nativeName: string;
  accentId: AccentId;
  minutes: number;
  creditsCost: number;
  createdAt: number;
  status: "simulated" | "ready_for_payment";
};

type GlobalPortugueseState = {
  enabled: boolean;
  tutorLanguage: PortugueseMode;
  selectedAccentId: AccentId;
  subscriptionTier: SubscriptionTier;
  credits: number;
  completedUnitIds: string[];
  scheduledCalls: ScheduledCall[];
  enableGlobalPortuguese: () => void;
  setTutorLanguage: (mode: PortugueseMode) => void;
  selectAccent: (id: AccentId) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  addCredits: (amount: number) => void;
  completeUnit: (id: string) => void;
  scheduleNativeCall: (nativeName: string, accentId: AccentId, minutes: number) => void;
  resetGlobalPortuguese: () => void;
};

const initialState = {
  enabled: true,
  tutorLanguage: "english" as PortugueseMode,
  selectedAccentId: "nordeste" as AccentId,
  subscriptionTier: "free" as SubscriptionTier,
  credits: 30,
  completedUnitIds: [] as string[],
  scheduledCalls: [] as ScheduledCall[],
};

export const useGlobalPortuguese = create<GlobalPortugueseState>()(
  persist(
    (set, get) => ({
      ...initialState,
      enableGlobalPortuguese: () => {
        set({ enabled: true });
        toast.success("Modo Português Global ativado.");
      },
      setTutorLanguage: (mode) => set({ tutorLanguage: mode }),
      selectAccent: (id) => {
        set({ selectedAccentId: id });
        const accent = ACCENT_PACKS.find((pack) => pack.id === id);
        toast.success(`Sotaque selecionado: ${accent?.name ?? id}`);
      },
      setSubscriptionTier: (tier) => {
        set({ subscriptionTier: tier });
        toast.success(tier === "free" ? "Preview gratuito selecionado." : "Plano simulado ativado para teste.");
      },
      addCredits: (amount) => {
        set((state) => ({ credits: state.credits + amount }));
        toast.success(`${amount} créditos adicionados no ambiente local.`);
      },
      completeUnit: (id) => {
        const unit = PORTUGUESE_TRACK.find((item) => item.id === id);
        set((state) => ({ completedUnitIds: Array.from(new Set([...state.completedUnitIds, id])) }));
        toast.success(`Unidade marcada: ${unit?.title ?? id}`);
      },
      scheduleNativeCall: (nativeName, accentId, minutes) => {
        const creditsCost = estimateCallCost(minutes);
        const state = get();
        if (state.credits < creditsCost) {
          toast.error(`Faltam créditos. Essa chamada custa ${creditsCost}.`);
          return;
        }
        const call: ScheduledCall = {
          id: `call-${Date.now()}`,
          nativeName,
          accentId,
          minutes,
          creditsCost,
          createdAt: Date.now(),
          status: "ready_for_payment",
        };
        set((current) => ({
          credits: current.credits - creditsCost,
          scheduledCalls: [call, ...current.scheduledCalls].slice(0, 8),
        }));
        toast.success(`Chamada simulada com ${nativeName}: ${minutes} min reservados.`);
      },
      resetGlobalPortuguese: () => set(initialState),
    }),
    { name: "csle-global-portuguese-v3" }
  )
);
