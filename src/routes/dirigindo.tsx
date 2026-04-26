import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { SpeechRateToggle } from "@/components/SpeechRateToggle";
import { useProgress } from "@/store/useProgress";
import { useSpeech, splitBilingual, getSavedRate, type SpeechRate } from "@/hooks/useSpeech";
import { chatWithMia } from "@/lib/ai";
import { Mic, MicOff, ArrowLeft, Loader2, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dirigindo")({
  head: () => ({
    meta: [
      { title: "CSLE — Modo Dirigindo" },
      {
        name: "description",
        content: "Pratique inglês de mãos livres — frases curtas, modo seguro para o trânsito.",
      },
    ],
  }),
  component: DirigindoGuarded,
});

interface Turn {
  role: "user" | "assistant";
  content: string;
}

function Dirigindo() {
  const navigate = useNavigate();
  const progress = useProgress();
  const speech = useSpeech("en-US");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [rate, setRate] = useState<SpeechRate>("normal");
  const lastTranscript = useRef("");

  useEffect(() => {
    setRate(getSavedRate());
  }, []);

  function speakReply(content: string) {
    const { en, pt } = splitBilingual(content);
    speech.speakBilingual(en, pt, { rate, pauseBetweenMs: 900 });
  }

  useEffect(() => {
    const greeting = `Hi ${progress.profile?.name ?? "there"}! Tap the big mic and speak in English.\n🇧🇷 Oi! Toque no microfone e fale em inglês.`;
    setTurns([{ role: "assistant", content: greeting }]);
    setTimeout(() => speakReply(greeting), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUserSpoke(text: string) {
    if (!text || loading) return;
    if (text === lastTranscript.current) return;
    lastTranscript.current = text;
    speech.cancel();
    const newTurns: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(newTurns);
    setLoading(true);
    try {
      const res = await chatWithMia({
        messages: newTurns.map((t) => ({ role: t.role, content: t.content })),
        level: progress.currentLevel,
        profile: progress.profile,
        voiceMode: "driving",
      });
      const reply = res.reply;
      setTurns((prev) => [...prev, { role: "assistant", content: reply }]);
      speakReply(reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (speech.transcript && active) {
      handleUserSpoke(speech.transcript);
      speech.setTranscript("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript, active]);

  function toggle() {
    if (speech.listening) {
      speech.stop();
      setActive(false);
    } else {
      speech.cancel();
      setActive(true);
      speech.start();
    }
  }

  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant");
  const lastBilingual = lastAssistant ? splitBilingual(lastAssistant.content) : { en: "", pt: "" };

  return (
    <AppShell hideNav screen="focus">
      <div className="flex min-h-screen flex-col bg-gradient-hero px-6 py-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              speech.cancel();
              navigate({ to: "/" });
            }}
            className="rounded-full bg-card/60 p-3 backdrop-blur transition-smooth active:bg-card"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <SpeechRateToggle onChange={setRate} />
        </div>

        <div className="mt-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            🚗 Modo Dirigindo
          </div>
          <h1 className="mt-1 text-3xl font-bold">Mãos livres</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Frases curtas. Inglês primeiro, depois português.
          </p>
        </div>

        <div className="mt-6 min-h-[180px] rounded-3xl bg-card/80 p-5 shadow-card backdrop-blur">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Pensando...
            </div>
          ) : lastAssistant ? (
            <div className="space-y-3">
              {lastBilingual.en && (
                <p className="text-xl font-bold leading-snug">{lastBilingual.en}</p>
              )}
              {lastBilingual.pt && (
                <p className="text-base leading-snug text-muted-foreground border-t border-border pt-3">
                  🇧🇷 {lastBilingual.pt}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => speakReply(lastAssistant.content)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary/15 px-4 py-3 text-sm font-bold text-primary transition-smooth active:bg-primary/25"
                >
                  <RotateCcw className="h-4 w-4" /> Ouvir novamente
                </button>
                {speech.speaking && (
                  <button
                    onClick={() => speech.cancel()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-destructive/15 px-4 py-3 text-sm font-bold text-destructive transition-smooth active:bg-destructive/25"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Comece falando algo em inglês...</p>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex flex-col items-center pb-4">
          {speech.transcript && (
            <div className="mb-4 rounded-2xl bg-card/70 px-4 py-2 text-sm backdrop-blur">
              "{speech.transcript}"
            </div>
          )}

          <button
            onClick={toggle}
            disabled={loading}
            className={`flex h-44 w-44 items-center justify-center rounded-full bg-gradient-primary text-white shadow-glow transition-bounce active:scale-95 disabled:opacity-60 ${
              speech.listening ? "animate-pulse-glow" : ""
            }`}
          >
            {speech.listening ? (
              <MicOff className="h-20 w-20" />
            ) : (
              <Mic className="h-20 w-20" />
            )}
          </button>

          <p className="mt-4 text-base font-semibold">
            {speech.listening ? "Ouvindo... toque para parar" : loading ? "Aguarde..." : "Toque e fale"}
          </p>

          {!speech.supported && (
            <p className="mt-3 text-center text-xs text-warning">
              Seu navegador não suporta reconhecimento de voz. Use Chrome no Android ou Safari no iPhone.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function DirigindoGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Dirigindo />
    </RequireAuth>
  );
}
