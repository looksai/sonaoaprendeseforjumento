// English phrase player. PT shown only as silent text (no PT TTS).
// Plays English via the hybrid voice hook (ElevenLabs primary, browser fallback).
// Phonetics: phrase-level "Ver pronúncia" toggle (clean default), or per-word
// brackets if the user enabled global mode in Perfil.
import { useEffect, useState } from "react";
import { Volume2, Loader2, RotateCcw } from "lucide-react";
import { useEnglishVoice } from "@/hooks/useEnglishVoice";
import { useVoicePrefs } from "@/store/useVoicePrefs";
import { usePhonetics } from "@/hooks/usePhonetics";
import { PhoneticHint } from "@/components/PhoneticHint";
import { PhraseInlinePhonetics } from "@/components/PhraseInlinePhonetics";
import { AudioPlayerControls } from "@/components/AudioPlayerControls";

interface Props {
  en: string;
  pt?: string;
  size?: "sm" | "md" | "lg";
  variant?: "card" | "flat" | "hero";
  /** Show full audio transport controls (seek/loop/replay). */
  controls?: boolean;
  /** @deprecated kept for backward compatibility — speed now lives in user prefs. */
  rate?: unknown;
  /** @deprecated kept for backward compatibility. */
  showRepeat?: unknown;
  /** @deprecated kept for backward compatibility. */
  pauseBetweenMs?: unknown;
}

export function PhrasePlayer({
  en,
  pt,
  size = "md",
  variant = "card",
  controls = false,
}: Props) {
  const voice = useEnglishVoice();
  const { prefs } = useVoicePrefs();
  const { ensurePhrase } = usePhonetics();
  const [looping, setLooping] = useState(false);
  const [activeWord, setActiveWord] = useState<number>(-1);

  const words = en.split(/\s+/).filter(Boolean);

  // Lazy-load phonetics for this phrase only when per-word global mode is ON
  // (phrase-level toggle fetches on demand inside its component).
  useEffect(() => {
    if (prefs.phoneticMode !== "off" && en) ensurePhrase(en);
  }, [en, ensurePhrase, prefs.phoneticMode]);

  // Karaoke highlighting based on currentTime (estimated word timing)
  useEffect(() => {
    if (!voice.playing || !words.length) {
      setActiveWord(-1);
      return;
    }
    const total = voice.duration > 0.1 ? voice.duration : Math.max(0.5, words.length * 0.32);
    const perWord = total / words.length;
    const idx = Math.min(words.length - 1, Math.floor(voice.currentTime / perWord));
    setActiveWord(idx);
  }, [voice.currentTime, voice.duration, voice.playing, words.length]);

  function handlePlayPause() {
    if (voice.playing) voice.pause();
    else if (voice.currentTime > 0 && voice.duration > 0) voice.resume();
    else voice.play(en);
  }

  function handleReplay() {
    // Use cached audio when available — no re-fetch, instant restart.
    voice.replay(en);
  }

  function handleStop() {
    voice.stop();
    setActiveWord(-1);
  }

  function handleToggleLoop() {
    const next = !looping;
    setLooping(next);
    voice.setLoop(next);
  }

  const enSize =
    size === "lg"
      ? "text-xl font-bold leading-relaxed"
      : size === "sm"
        ? "text-sm font-semibold"
        : "text-base font-semibold leading-relaxed";

  const wrapper =
    variant === "hero"
      ? "rounded-2xl bg-gradient-card p-5 shadow-card"
      : variant === "flat"
        ? "p-2"
        : "rounded-2xl bg-card p-4 shadow-soft";

  const showPerWordPhonetics = prefs.phoneticMode !== "off";
  const isPlaying = voice.playing;

  return (
    <div className={wrapper}>
      {/* Karaoke status banner — only when audio is actively playing */}
      {isPlaying && (
        <div className="mb-2 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-primary animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          🎤 Karaokê — siga a palavra destacada
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className={enSize}>
            {words.map((w, i) => {
              const isActive = isPlaying && i === activeWord;
              const isPast = isPlaying && i < activeWord;
              return (
                <span
                  key={i}
                  className={`inline-block transition-all duration-150 ${
                    isActive
                      ? "scale-105 rounded-md bg-primary px-1.5 text-primary-foreground shadow-glow"
                      : isPast
                        ? "text-foreground/40"
                        : ""
                  } ${i < words.length - 1 ? "mr-1" : ""}`}
                >
                  <span>{w}</span>
                  {showPerWordPhonetics && <PhoneticHint word={w} fetchIfMissing />}
                </span>
              );
            })}
          </p>
          {pt && (
            <p className="mt-1.5 text-sm text-muted-foreground">🇧🇷 {pt}</p>
          )}
          {!showPerWordPhonetics && <PhraseInlinePhonetics en={en} compact />}
        </div>
        {!controls && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handlePlayPause}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-smooth active:scale-95 ${
                voice.playing
                  ? "bg-primary text-primary-foreground shadow-glow animate-pulse-glow"
                  : "bg-primary/15 text-primary active:bg-primary/30"
              }`}
              aria-label={voice.playing ? "Pausar" : "Ouvir"}
            >
              {voice.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={handleReplay}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-smooth active:bg-muted active:scale-95"
              aria-label="Repetir"
              title="Repetir"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {controls && (
        <div className="mt-3">
          <AudioPlayerControls
            playing={voice.playing}
            loading={voice.loading}
            currentTime={voice.currentTime}
            duration={voice.duration}
            looping={looping}
            onPlayPause={handlePlayPause}
            onReplay={handleReplay}
            onStop={handleStop}
            onToggleLoop={handleToggleLoop}
            onSeek={voice.seek}
          />
          {voice.usedFallback && (
            <p className="mt-1 px-1 text-[0.6rem] text-muted-foreground">
              Usando voz do navegador (ElevenLabs indisponível)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
