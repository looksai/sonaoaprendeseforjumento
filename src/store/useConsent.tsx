// Consent store (LGPD/GDPR). Sources of truth, in order:
//   1. localStorage (instant, offline-safe)
//   2. Supabase `user_consent` row (when logged in, for cross-device opt-out)
//
// Values are booleans only. `decided=false` → show modal.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/store/useAuth";

// `user_consent` exists in the DB but isn't in the auto-generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const LS_ANALYTICS = "lc_consent_analytics";
const LS_VOICE = "lc_consent_voice";
const LS_DECIDED = "lc_consent_decided";

function scopedKey(key: string, userId?: string) {
  return userId ? `${key}:${userId}` : key;
}

function readLS(key: string): boolean | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(key);
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}
function writeLS(key: string, v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, v ? "true" : "false");
}

interface ConsentContextValue {
  decided: boolean;
  analytics: boolean;
  voice: boolean;
  setAnalytics: (v: boolean) => Promise<void>;
  setVoice: (v: boolean) => Promise<void>;
  decide: (accepted: boolean) => Promise<void>;
  resetDecision: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [decided, setDecided] = useState<boolean>(false);
  const [analytics, setAnalyticsState] = useState<boolean>(false);
  const [voice, setVoiceState] = useState<boolean>(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    const userId = user?.id;
    setDecided(localStorage.getItem(scopedKey(LS_DECIDED, userId)) === "true");
    setAnalyticsState(readLS(scopedKey(LS_ANALYTICS, userId)) ?? false);
    setVoiceState(readLS(scopedKey(LS_VOICE, userId)) ?? false);
  }, [user?.id]);

  // Hydrate from backend when user logs in (cross-device consent).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await db
        .from("user_consent")
        .select("consent_analytics, consent_voice")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setAnalyticsState(!!data.consent_analytics);
      setVoiceState(!!data.consent_voice);
      writeLS(scopedKey(LS_ANALYTICS, user.id), !!data.consent_analytics);
      writeLS(scopedKey(LS_VOICE, user.id), !!data.consent_voice);
      if (typeof window !== "undefined") localStorage.setItem(scopedKey(LS_DECIDED, user.id), "true");
      setDecided(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persistRemote = useCallback(
    async (next: { analytics?: boolean; voice?: boolean }) => {
      if (!user) return;
      const payload: Record<string, unknown> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      if (typeof next.analytics === "boolean") payload.consent_analytics = next.analytics;
      if (typeof next.voice === "boolean") payload.consent_voice = next.voice;
      await db.from("user_consent").upsert(payload, { onConflict: "user_id" });
    },
    [user],
  );

  const setAnalytics = useCallback(
    async (v: boolean) => {
      setAnalyticsState(v);
      writeLS(scopedKey(LS_ANALYTICS, user?.id), v);
      await persistRemote({ analytics: v });
    },
    [persistRemote, user?.id],
  );

  const setVoice = useCallback(
    async (v: boolean) => {
      setVoiceState(v);
      writeLS(scopedKey(LS_VOICE, user?.id), v);
      await persistRemote({ voice: v });
    },
    [persistRemote, user?.id],
  );

  const decide = useCallback(
    async (accepted: boolean) => {
      setAnalyticsState(accepted);
      setVoiceState(accepted);
      writeLS(scopedKey(LS_ANALYTICS, user?.id), accepted);
      writeLS(scopedKey(LS_VOICE, user?.id), accepted);
      if (typeof window !== "undefined") localStorage.setItem(scopedKey(LS_DECIDED, user?.id), "true");
      setDecided(true);
      await persistRemote({ analytics: accepted, voice: accepted });
    },
    [persistRemote, user?.id],
  );

  const resetDecision = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(scopedKey(LS_DECIDED, user?.id));
    setDecided(false);
  }, [user?.id]);

  const value = useMemo<ConsentContextValue>(
    () => ({ decided, analytics, voice, setAnalytics, setVoice, decide, resetDecision }),
    [decided, analytics, voice, setAnalytics, setVoice, decide, resetDecision],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
