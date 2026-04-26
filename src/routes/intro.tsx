// First-experience: guided introduction with the user's Personal.
// Flow:
//   intro → demo phrase → user tries (text/voice) → Personal reacts →
//   second phrase → user tries again → unlock main app.
//
// Tone: warm, calm, beginner-friendly. Not academic. Not robotic.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useProgress } from "@/store/useProgress";
import { usePersonal } from "@/store/usePersonal";
import { useEnglishVoice } from "@/hooks/useEnglishVoice";
import { useSpeech } from "@/hooks/useSpeech";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { checkAnswer } from "@/lib/ai";
import { toast } from "sonner";

export const WELCOME_DONE_KEY = "csle-welcome-done-v1";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "Last Course — Conheça seu Personal" },
      {
        name: "description",
        content:
          "Uma introdução calma e guiada com o seu Personal — sua primeira frase em inglês, com tradução e pronúncia.",
      },
    ],
  }),
  component: WelcomeGuarded,
});

// ---------- Demo phrases (static so phonetics show instantly) ----------

interface DemoPhrase {
  en: string;
  pt: string;
  // Pronúncia "português adaptado" — o jeito mais simples para iniciantes.
  phonetic_pt: string;
  // Dica curta sobre algo difícil da frase.
  tip_pt: string;
}

const PHRASES: DemoPhrase[] = [
  {
    en: "Hi, my name is Bia. Nice to meet you.",
    pt: "Oi, meu nome é Bia. Prazer em te conhecer.",
    phonetic_pt: "Rái, mai neim iz Bia. Náiss tchu mít iú.",
    tip_pt:
      "“Nice to meet you” se diz junto, quase como uma palavra só: “náiss-tchu-mít-iú”.",
  },
  {
    en: "How are you today?",
    pt: "Como você está hoje?",
    phonetic_pt: "Ráu ar iú tudêi?",
    tip_pt:
      "“How” começa com som de R fraco, quase um sopro: “Ráu”. Não é “rrau”.",
  },
];

// ---------- Step machine ----------

type Phase =
  | "intro" // 1. Personal apresenta-se
  | "explain_phonetics" // 2. Explica o que é phonetics
  | "demo_1" // 3. Mostra primeira frase
  | "try_1" // 4. Usuário tenta
  | "react_1" // 5. Personal reage
  | "demo_2" // 6. Mostra segunda frase
  | "try_2" // 7. Usuário tenta
  | "react_2" // 8. Personal reage
  | "done"; // 9. Desbloqueia

function Welcome() {
  const navigate = useNavigate();
  const progress = useProgress();
  const { identity } = usePersonal();
  const englishVoice = useEnglishVoice();
  const speech = useSpeech("en-US");

  const [phase, setPhase] = useState<Phase>("intro");
  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    score: number;
    feedback_pt: string;
    corrected_en: string;
    tip_pt: string;
  } | null>(null);

  // Redirect away if profile not set yet.
  useEffect(() => {
    if (!progress.profile) {
      navigate({ to: "/onboarding" });
    }
  }, [progress.profile, navigate]);

  // Capture voice transcript into the answer field.
  useEffect(() => {
    if (speech.transcript) setAnswer(speech.transcript);
  }, [speech.transcript]);

  // Reset answer/transcript only when entering a NEW try phase.
  // CRITICAL: do NOT clear `feedback` here — react_1/react_2 depend on it
  // and clearing it leaves nothing to render (white screen).
  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    if (phase !== phaseRef.current) {
      const prev = phaseRef.current;
      phaseRef.current = phase;
      if (phase === "try_1" || phase === "try_2") {
        setAnswer("");
        setFeedback(null);
        speech.setTranscript("");
      }
      // When leaving a react phase back to a demo, clear stale feedback.
      if ((prev === "react_1" || prev === "react_2") && (phase === "demo_2" || phase === "done")) {
        setFeedback(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const coachName = identity?.name ?? "Mia";
  const userName = useMemo(
    () => progress.profile?.name?.split(" ")[0] || "amigo",
    [progress.profile?.name],
  );

  const phraseIdx = phase === "demo_2" || phase === "try_2" || phase === "react_2" ? 1 : 0;
  const phrase = PHRASES[phraseIdx];

  function speakPhrase() {
    englishVoice.play(phrase.en);
  }

  async function handleCheck() {
    if (!answer.trim()) return;
    setChecking(true);
    setFeedback(null);
    const localFallback = () => {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, "").trim();
      const ok = norm(answer) === norm(phrase.en);
      return {
        correct: ok,
        score: ok ? 100 : 60,
        feedback_pt: ok
          ? "Perfeito! Você mandou bem."
          : "Quase! Compare com a versão certa abaixo e tenta repetir em voz alta.",
        corrected_en: phrase.en,
        tip_pt: phrase.tip_pt,
      };
    };
    try {
      const raw = await checkAnswer({
        prompt_pt: phrase.pt,
        expected_en: phrase.en,
        user_answer: answer.trim(),
      });
      // Normalize — never trust every field is present.
      const safe = {
        correct: typeof raw?.correct === "boolean" ? raw.correct : false,
        score: typeof raw?.score === "number" && Number.isFinite(raw.score) ? raw.score : 70,
        feedback_pt:
          typeof raw?.feedback_pt === "string" && raw.feedback_pt.trim()
            ? raw.feedback_pt
            : "Boa tentativa! Vamos seguindo.",
        corrected_en:
          typeof raw?.corrected_en === "string" && raw.corrected_en.trim()
            ? raw.corrected_en
            : phrase.en,
        tip_pt:
          typeof raw?.tip_pt === "string" && raw.tip_pt.trim()
            ? raw.tip_pt
            : phrase.tip_pt,
      };
      setFeedback(safe);
      setPhase(phraseIdx === 0 ? "react_1" : "react_2");
    } catch (e) {
      console.warn("[welcome] checkAnswer failed, using local fallback", e);
      setFeedback(localFallback());
      setPhase(phraseIdx === 0 ? "react_1" : "react_2");
      toast(
        e instanceof Error
          ? "Sem internet pra verificar agora — segui no modo simples."
          : "Continuando no modo simples.",
        { duration: 2200 },
      );
    } finally {
      setChecking(false);
    }
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
    } else {
      speech.start();
    }
  }

  function finish() {
    try {
      localStorage.setItem(WELCOME_DONE_KEY, "1");
    } catch {
      /* ignore */
    }
    englishVoice.stop();
    navigate({ to: "/" });
  }

  if (!progress.profile) return null;

  return (
    <AppShell hideNav screen="focus" className="flex flex-col">
      {/* ── Header (avatar + presence) ── */}
      <header className="flex flex-col items-center pt-10 pb-2 text-center">
        <div className="personal-avatar relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-cta text-2xl font-bold text-primary-foreground shadow-glow">
          {coachName.slice(0, 1).toUpperCase()}
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-success">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          </span>
        </div>
        <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">
          Seu Personal
        </p>
        <h1 className="mt-1 text-xl font-bold text-foreground">{coachName}</h1>
      </header>

      {/* ---------- Body ---------- */}
      <main className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-6 pt-4 pb-6">
        {phase === "intro" && (
          <Bubble>
            <p className="text-[1.05rem] leading-relaxed">
              Oi {userName}. Eu sou {coachName}.
            </p>
            <p className="mt-2 text-[1.05rem] leading-relaxed">
              <strong>Eu não sou um professor.</strong> Eu sou seu Personal.
            </p>
            <p className="mt-2 text-[0.97rem] leading-relaxed text-foreground/85">
              Vou te guiar passo a passo, no seu ritmo. Sem pressão, sem
              vergonha. A gente começa pelo começo de verdade.
            </p>
            <NextButton onClick={() => setPhase("explain_phonetics")}>
              Pode começar
            </NextButton>
          </Bubble>
        )}

        {phase === "explain_phonetics" && (
          <Bubble>
            <p className="text-[1.02rem] leading-relaxed">
              Antes da primeira frase, uma coisa rápida que vai te salvar:
            </p>
            <div className="mt-3 rounded-2xl bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Pronúncia adaptada
              </div>
              <p className="mt-2 text-[0.97rem] leading-relaxed text-foreground">
                Eu vou te mostrar como cada frase{" "}
                <strong>se lê em português</strong>. Tipo um “colinha” do som.
              </p>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-foreground/80">
                Exemplo: <em>“Hi”</em> se lê <strong>“Rái”</strong>.
                <br />É só ler em voz alta — você já vai estar falando inglês.
              </p>
            </div>
            <NextButton onClick={() => setPhase("demo_1")}>Bora ver</NextButton>
          </Bubble>
        )}

        {(phase === "demo_1" || phase === "demo_2") && (
          <Bubble>
            <p className="text-[1rem] leading-relaxed">
              {phraseIdx === 0
                ? "Sua primeira frase. Bem simples:"
                : "Mais uma. Você já tá indo bem:"}
            </p>
            <PhraseCard
              phrase={phrase}
              speaking={englishVoice.playing}
              loading={englishVoice.loading}
              onPlay={speakPhrase}
            />
            <p className="mt-4 text-[0.92rem] leading-relaxed text-muted-foreground">
              Toque pra ouvir, leia o som em português em voz alta, e quando
              quiser — me responde.
            </p>
            <NextButton onClick={() => setPhase(phraseIdx === 0 ? "try_1" : "try_2")}>
              Eu já posso tentar
            </NextButton>
          </Bubble>
        )}

        {(phase === "try_1" || phase === "try_2") && (
          <>
            <PhraseCard
              phrase={phrase}
              speaking={englishVoice.playing}
              loading={englishVoice.loading}
              onPlay={speakPhrase}
              compact
            />

            <div className="mt-5 rounded-3xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">
                Sua vez — escreva ou fale a frase
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={phrase.en}
                  className="h-12 flex-1 rounded-xl border-2 text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && answer.trim() && !checking) {
                      void handleCheck();
                    }
                  }}
                />
                {speech.supported && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    aria-label={speech.listening ? "Parar gravação" : "Falar"}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 transition-bounce ${
                      speech.listening
                        ? "animate-pulse border-destructive bg-destructive/10 text-destructive"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {speech.listening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>

              <Button
                onClick={() => void handleCheck()}
                disabled={!answer.trim() || checking}
                className="mt-3 h-12 w-full rounded-xl bg-gradient-cta text-base font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {checking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Enviar pra {coachName} <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-[0.78rem] text-muted-foreground">
                Não precisa estar perfeito. Eu corrijo com carinho.
              </p>
            </div>
          </>
        )}

        {(phase === "react_1" || phase === "react_2") && (
          feedback ? (
            <Bubble>
              {feedback.correct || feedback.score >= 85 ? (
                <>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-base font-bold">Boa, {userName}!</p>
                  </div>
                  <p className="mt-2 text-[0.98rem] leading-relaxed">
                    {feedback.feedback_pt ||
                      "Você mandou bem. Sentiu como não foi tão difícil?"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[0.98rem] leading-relaxed">
                    {feedback.feedback_pt ||
                      "Quase! Olha como ficaria mais natural:"}
                  </p>
                  <div className="mt-3 rounded-xl bg-primary/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Versão melhor
                    </p>
                    <p className="mt-1 text-[1rem] font-semibold text-foreground">
                      {feedback.corrected_en || phrase.en}
                    </p>
                  </div>
                  {(feedback.tip_pt || phrase.tip_pt) && (
                    <p className="mt-3 text-[0.9rem] leading-relaxed text-foreground/80">
                      💡 {feedback.tip_pt || phrase.tip_pt}
                    </p>
                  )}
                </>
              )}

              <NextButton
                onClick={() => {
                  if (phase === "react_1") setPhase("demo_2");
                  else setPhase("done");
                }}
              >
                {phase === "react_1" ? "Bora a próxima" : "Tô pronto"}
              </NextButton>
            </Bubble>
          ) : (
            // Safety net: feedback missing for any reason — never leave the
            // user on a blank screen. Offer a friendly continue path.
            <Bubble>
              <p className="text-[1rem] leading-relaxed">
                Tudo bem, {userName} — vamos seguir.
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-foreground/80">
                A versão de referência é: <strong>{phrase.en}</strong>
              </p>
              <NextButton
                onClick={() => {
                  if (phase === "react_1") setPhase("demo_2");
                  else setPhase("done");
                }}
              >
                {phase === "react_1" ? "Bora a próxima" : "Tô pronto"}
              </NextButton>
            </Bubble>
          )
        )}

        {phase === "done" && (
          <Bubble>
            <p className="text-[1.05rem] leading-relaxed">
              Olha {userName}, você acabou de:
            </p>
            <ul className="mt-3 space-y-2 text-[0.97rem] leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Ouvir e entender 2 frases reais em inglês
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Ler com a pronúncia em português
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Tentar de verdade — e receber correção
              </li>
            </ul>
            <p className="mt-4 text-[0.97rem] leading-relaxed text-foreground/85">
              É exatamente assim que a gente vai aprender. Calmo e de verdade.
            </p>
            <NextButton onClick={finish}>Começar pra valer</NextButton>
          </Bubble>
        )}
      </main>
    </AppShell>
  );
}

// ---------- Sub-components ----------

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-primary/10 p-5 text-foreground animate-fade-in-up">
      {children}
    </div>
  );
}

function NextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-cta px-5 py-4 text-base font-bold text-primary-foreground shadow-glow transition-bounce active:scale-[0.98]"
    >
      {children}
      <ArrowRight className="h-5 w-5" />
    </button>
  );
}

function PhraseCard({
  phrase,
  onPlay,
  speaking,
  loading,
  compact,
}: {
  phrase: DemoPhrase;
  onPlay: () => void;
  speaking: boolean;
  loading: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`mt-${compact ? "0" : "4"} rounded-3xl border border-border bg-card p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[1.18rem] font-bold leading-snug text-foreground">
          {phrase.en}
        </p>
        <button
          type="button"
          onClick={onPlay}
          aria-label="Ouvir"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-bounce active:scale-95"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : speaking ? (
            <Volume2 className="h-5 w-5 animate-pulse" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Phonetic — visible by default */}
      <p className="mt-3 text-[0.95rem] italic leading-snug text-primary">
        🗣 {phrase.phonetic_pt}
      </p>

      {/* Translation */}
      <p className="mt-2 text-[0.95rem] leading-snug text-muted-foreground">
        🇧🇷 {phrase.pt}
      </p>

      {phrase.tip_pt && !compact && (
        <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-[0.85rem] leading-snug text-foreground/80">
          💡 {phrase.tip_pt}
        </p>
      )}
    </div>
  );
}

function WelcomeGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Welcome />
    </RequireAuth>
  );
}
