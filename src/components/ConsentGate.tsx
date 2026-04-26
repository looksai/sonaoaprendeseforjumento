// Renders the first-run consent modal and keeps the event-logger's snapshot
// in sync with the user + consent state. Also fires session_start/end.
import { useEffect, useRef } from "react";
import { useAuth } from "@/store/useAuth";
import { useConsent } from "@/store/useConsent";
import { logEvent, setConsentSnapshot } from "@/lib/events";
import { ConsentModal } from "@/components/ConsentModal";

export function ConsentGate() {
  const { user } = useAuth();
  const { analytics, voice } = useConsent();
  const sessionFired = useRef(false);

  // Keep the logger's snapshot current so fire-and-forget callers work.
  useEffect(() => {
    setConsentSnapshot({ analytics, voice, userId: user?.id ?? null });
  }, [analytics, voice, user]);

  // session_start once per page load (after first consent-true snapshot).
  useEffect(() => {
    if (!analytics || sessionFired.current) return;
    sessionFired.current = true;
    void logEvent("session_start", { ts: Date.now() });

    const onUnload = () => {
      void logEvent("session_end", { ts: Date.now() });
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [analytics]);

  return <ConsentModal />;
}
