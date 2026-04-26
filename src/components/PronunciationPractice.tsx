// Karaoke pronunciation practice: user reads a sentence, system records, transcribes,
// and highlights correct/incorrect words. Failed words feed adaptive memory.
import { useState } from "react";
import { Mic, Square, Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useSpeechRecorder, matchWords, type WordMatch } from "@/hooks/useSpeechRecorder";
import { PhoneticHint } from "@/components/PhoneticHint";
import { PhraseInlinePhonetics } from "@/components/PhraseInlinePhonetics";
import { useVoicePrefs } from "@/store/useVoicePrefs";
import { useConsent } from "@/store/useConsent";
import { VoiceConsentPrompt } from "@/components/VoiceConsentPrompt";
import { logEvent } from "@/lib/events";

interface Props {
  en: string;
  /** Called with score (0-100) and the words that were missed. */
  onResult?: (score: number, missedWords: string[]) => void;
}

export function PronunciationPractice({ en, onResult }: Props) {
  const recorder = useSpeechRecorder();
  const { prefs } = useVoicePrefs();
  const consent = useConsent();
  const [matches, setMatches] = useState<WordMatch[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [voicePromptOpen, setVoicePromptOpen] = useState(false);

  const showPhon = prefs.phoneticMode !== "off";

  async function startRecording() {
    setMatches(null);
    setScore(null);
    setTranscript("");
    await recorder.start();
  }

  async function handleRecord() {
    if (recorder.recording) {
      const result = await recorder.stopAndTranscribe();
      if (!result) return;
      setTranscript(result.text);
      const m = matchWords(en, result.text);
      setMatches(m.matches);
      setScore(m.score);
      void logEvent("voice_attempt", { score: m.score, target_words: en.split(/\s+/).length });
      onResult?.(m.score, m.matches.filter((x) => !x.matched).map((x) => x.expected));
    } else {
      // If user opted into analytics but hasn't decided about voice, ask once.
      if (consent.analytics && !consent.voice) {
        setVoicePromptOpen(true);
        return;
      }
      await startRecording();
    }
  }

  function reset() {
    setMatches(null);
    setScore(null);
    setTranscript("");
  }

  const words = en.split(/\s+/).filter(Boolean);
  const isRecording = recorder.recording;
  const isProcessing = recorder.processing;

  return (
    <div
      className={`rounded-2xl border-2 p-4 shadow-soft transition-smooth ${
        isRecording
          ? "border-destructive/60 bg-destructive/5 shadow-glow"
          : "border-primary/30 bg-card"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
          🎤 Karaokê de pronúncia
          {isRecording && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[0.6rem] text-destructive-foreground animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground" /> REC
            </span>
          )}
        </div>
        {score !== null && (
          <div className={`text-xs font-bold ${score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>
            {score}/100
          </div>
        )}
      </div>

      <p className="text-lg font-bold leading-relaxed">
        {words.map((w, i) => {
          const m = matches?.[i];
          const cls = m
            ? m.matched
              ? "rounded-md bg-success/25 px-1.5 text-success-foreground/90 ring-1 ring-success/40"
              : "rounded-md bg-destructive/20 px-1.5 text-destructive ring-1 ring-destructive/40"
            : "";
          return (
            <span key={i} className={`inline-block ${cls} ${i < words.length - 1 ? "mr-1.5" : ""}`}>
              <span>{w}</span>
              {showPhon && <PhoneticHint word={w} fetchIfMissing />}
            </span>
          );
        })}
      </p>

      {/* Always offer phrase-level pronunciation help inside karaoke,
          even when global per-word phonetics is OFF — this is the moment users need it most. */}
      {!showPhon && <PhraseInlinePhonetics en={en} />}

      {transcript && (
        <p className="mt-2 text-xs text-muted-foreground">
          Você disse: <span className="italic">"{transcript}"</span>
        </p>
      )}

      {recorder.usedFallback && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-2 text-[0.7rem] text-foreground">
          <span className="mt-0.5">⚠️</span>
          <div>
            <div className="font-semibold">Reconhecimento do navegador em uso</div>
            <div className="text-muted-foreground">
              A transcrição em alta qualidade não respondeu — usamos o motor do navegador
              (sem timestamps por palavra). A nota ainda é válida.
            </div>
          </div>
        </div>
      )}
      {recorder.error && !recorder.usedFallback && (
        <p className="mt-2 text-xs text-destructive">{recorder.error}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleRecord}
          disabled={isProcessing}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-bounce active:scale-[0.98] disabled:opacity-60 ${
            isRecording
              ? "bg-destructive text-destructive-foreground shadow-glow animate-pulse-glow"
              : "bg-gradient-primary text-white shadow-glow"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Avaliando...
            </>
          ) : isRecording ? (
            <>
              <Square className="h-4 w-4" /> Parar e avaliar
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" /> Gravar e ler em voz alta
            </>
          )}
        </button>
        {matches && (
          <button
            onClick={reset}
            className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-3 text-xs font-semibold text-muted-foreground active:opacity-70"
            aria-label="Tentar de novo"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Repetir
          </button>
        )}
      </div>

      {score !== null && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 p-2 text-xs">
          {score >= 80 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-medium">Pronúncia muito boa! 🎉</span>
            </>
          ) : score >= 50 ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-warning" />
              <span className="font-medium">No caminho — tente as palavras destacadas em vermelho.</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium">Vamos repetir devagar — escute, leia o som [adaptado] e tente de novo.</span>
            </>
          )}
        </div>
      )}
      <VoiceConsentPrompt
        open={voicePromptOpen}
        onDecide={(allow) => {
          setVoicePromptOpen(false);
          void consent.setVoice(allow);
          // Recording itself doesn't depend on voice consent — only analytics do.
          void startRecording();
        }}
      />
    </div>
  );
}
