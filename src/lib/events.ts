// Fire-and-forget event logger. Respects consent_analytics (and consent_voice
// for voice_* events). Never throws into the UI, never blocks — if consent is
// off or the insert fails, we silently no-op.

import { supabase } from "@/integrations/supabase/client";
import { getUserHash } from "@/lib/userHash";

// The `events` table exists in the DB but isn't yet in the auto-generated
// types. Cast the client locally to keep this file compiling.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type EventType =
  | "session_start"
  | "session_end"
  | "lesson_completed"
  | "phrase_attempt"
  | "voice_attempt";

interface ConsentSnapshot {
  analytics: boolean;
  voice: boolean;
  userId: string | null;
}

// Module-level snapshot so non-React callers (e.g. beforeunload) can log.
let snapshot: ConsentSnapshot = { analytics: false, voice: false, userId: null };

export function setConsentSnapshot(next: ConsentSnapshot) {
  snapshot = next;
}

export async function logEvent(
  type: EventType,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    if (typeof window === "undefined") return;
    if (!snapshot.analytics) return;
    if (type === "voice_attempt" && !snapshot.voice) return;

    const user_hash = await getUserHash(snapshot.userId);
    await db.from("events").insert({
      user_hash,
      event_type: type,
      payload,
    });
  } catch {
    // Silent — analytics must never degrade UX.
  }
}
