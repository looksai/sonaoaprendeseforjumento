// Inline phonetic hint for a single English word.
// Modes: off | pt (PT-adapted) | ipa
import { useEffect } from "react";
import { usePhonetics } from "@/hooks/usePhonetics";
import { useVoicePrefs } from "@/store/useVoicePrefs";

interface Props {
  word: string;
  /** When true, also lazy-fetches if missing. */
  fetchIfMissing?: boolean;
}

export function PhoneticHint({ word, fetchIfMissing = false }: Props) {
  const { prefs } = useVoicePrefs();
  const { ensurePhrase, get } = usePhonetics();
  const entry = get(word);

  useEffect(() => {
    if (fetchIfMissing && !entry && prefs.phoneticMode !== "off") {
      ensurePhrase(word);
    }
  }, [fetchIfMissing, entry, ensurePhrase, prefs.phoneticMode, word]);

  if (prefs.phoneticMode === "off" || !entry) return null;

  const text = prefs.phoneticMode === "ipa" ? entry.ipa : entry.pt_adapted;
  if (!text) return null;

  return (
    <span className="ml-0.5 align-baseline text-[0.65em] font-normal text-muted-foreground">
      [{text}]
    </span>
  );
}
