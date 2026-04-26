// Phrase-level phonetic line with a "Ver pronúncia" toggle.
// Shows the whole sentence transliterated below the original — much less visual
// noise than per-word brackets, and easier to scan on mobile.
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { usePhonetics } from "@/hooks/usePhonetics";
import { useVoicePrefs } from "@/store/useVoicePrefs";

interface Props {
  en: string;
  /** Always reveal (e.g. inside karaoke help). When false, user clicks to reveal. */
  alwaysOpen?: boolean;
  /** Compact single-line styling (used inside dense cards). */
  compact?: boolean;
}

function tokensWithSeparators(text: string): { word: string; trailing: string }[] {
  // Split keeping punctuation attached to the previous token.
  const out: { word: string; trailing: string }[] = [];
  const re = /([A-Za-z'’]+)([^A-Za-z'’]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ word: m[1], trailing: m[2] ?? "" });
  }
  return out;
}

export function PhraseInlinePhonetics({ en, alwaysOpen = false, compact = false }: Props) {
  const { prefs } = useVoicePrefs();
  const { ensurePhrase, get } = usePhonetics();
  const [open, setOpen] = useState(alwaysOpen);
  const [requested, setRequested] = useState(false);

  const tokens = useMemo(() => tokensWithSeparators(en), [en]);

  useEffect(() => {
    if (open && !requested) {
      ensurePhrase(en);
      setRequested(true);
    }
  }, [open, requested, en, ensurePhrase]);

  // Build the transliterated sentence using the user's preferred notation.
  const mode = prefs.phoneticMode === "ipa" ? "ipa" : "pt";
  const built = tokens.map((t) => {
    const entry = get(t.word);
    const sound = entry ? (mode === "ipa" ? entry.ipa : entry.pt_adapted) : null;
    return { ...t, sound };
  });
  const ready = built.every((t) => t.sound !== null);
  const line = built.map((t) => (t.sound ?? t.word) + t.trailing).join("").trim();

  return (
    <div className={compact ? "mt-1" : "mt-2"}>
      {!alwaysOpen && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-semibold text-muted-foreground transition-smooth hover:bg-primary/15 hover:text-primary"
          aria-expanded={open}
        >
          {open ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {open ? "Ocultar pronúncia" : "Ver pronúncia"}
        </button>
      )}

      {open && (
        <div
          className={`mt-1.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {ready ? (
            <p className="font-mono leading-snug text-primary/90">
              {mode === "ipa" ? `/${line}/` : line}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Gerando pronúncia…
            </p>
          )}
          {ready && mode === "pt" && (
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              Leia como se fosse português 🇧🇷
            </p>
          )}
        </div>
      )}
    </div>
  );
}
