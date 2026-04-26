// "Pratique com a sua música"
// AI generates artist-inspired phrase practice (no copyrighted lyrics).
// Lines mimic the style/themes of the chosen artist; user listens, repeats,
// and saves to SRS — same flow as episode practice.
import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhrasePlayer } from "@/components/PhrasePlayer";
import { useProgress } from "@/store/useProgress";
import { useSRS } from "@/store/useSRS";
import { fetchMusicPractice, type MusicPhrase } from "@/lib/ai";
import { ArrowLeft, Music, Loader2, Sparkles, BookmarkPlus, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/musica")({
  head: () => ({
    meta: [
      { title: "CSLE — Pratique com a sua música" },
      {
        name: "description",
        content: "Frases de inglês inspiradas nos artistas que você ama, com áudio e pronúncia.",
      },
    ],
  }),
  component: MusicaGuarded,
});

function Musica() {
  const progress = useProgress();
  const srs = useSRS();
  const [artist, setArtist] = useState(() => {
    const fav = progress.profile?.favoriteMusic ?? "";
    return fav.split(",")[0]?.trim() ?? "";
  });
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [phrases, setPhrases] = useState<MusicPhrase[]>([]);
  const [topicLine, setTopicLine] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const lessonTopic = progress.nextLesson?.lesson.title ?? "Inglês geral";

  async function generate() {
    if (!artist.trim()) {
      toast.error("Diga um artista ou banda para começarmos.");
      return;
    }
    setLoading(true);
    setPhrases([]);
    setTopicLine(null);
    try {
      const res = await fetchMusicPractice({
        artist: artist.trim(),
        mood: mood.trim() || undefined,
        lesson_topic: lessonTopic,
        level: progress.currentLevel,
      });
      setPhrases(res.phrases ?? []);
      setTopicLine(res.style_pt ?? null);
      toast.success(`🎵 ${res.phrases?.length ?? 0} frases prontas para cantar e praticar!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui gerar agora");
    } finally {
      setLoading(false);
    }
  }

  async function save(p: MusicPhrase) {
    try {
      await srs.addOrTouch({
        en: p.en,
        pt: p.pt,
        topic: `Música: ${artist.trim()}`,
        source: "music",
      });
      setSavedKeys((prev) => {
        const n = new Set(prev);
        n.add(p.en);
        return n;
      });
      toast.success("Salvo na sua revisão 🌀");
    } catch {
      toast.error("Não consegui salvar agora.");
    }
  }

  return (
    <AppShell screen="focus">
      <div className="flex items-center gap-2 px-4 pt-5">
        <Link to="/explorar" className="rounded-full p-2 transition-smooth active:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Sessão de música
          </div>
          <h1 className="text-xl font-bold">Cante o inglês que você ama</h1>
          <p className="text-xs text-muted-foreground">
            Escolha um artista — eu preparo sua sessão
          </p>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="surface-elevated rounded-2xl p-4">
          <p className="text-sm leading-relaxed">
            <strong>Diga um artista ou banda.</strong> Eu preparo uma sessão com frases
            inspiradas no estilo dele — você ouve, lê, canta e repete.
          </p>
        </div>
      </div>

      <div className="px-5 pt-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["Taylor Swift", "Coldplay", "Ed Sheeran", "Adele", "Bruno Mars", "The Weeknd"].map(
            (a) => (
              <button
                key={a}
                onClick={() => setArtist(a)}
                className="shrink-0 rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-smooth active:scale-95"
              >
                {a}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-3">
        <div>
          <Label className="text-xs font-semibold">Artista ou banda</Label>
          <Input
            placeholder="Ex: Taylor Swift, Coldplay, Ed Sheeran…"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="mt-1 h-11 rounded-xl border-2"
            maxLength={80}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Vibe (opcional)</Label>
          <Input
            placeholder="Ex: romântica, animada, melancólica…"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="mt-1 h-11 rounded-xl border-2"
            maxLength={60}
          />
        </div>
        <Button
          onClick={generate}
          disabled={loading || !artist.trim()}
          className="w-full rounded-2xl bg-gradient-cta py-6 text-base font-semibold text-white shadow-glow disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Compondo sua sessão…
            </>
          ) : (
            <>
              <Music className="mr-2 h-5 w-5" /> Preparar minha sessão
            </>
          )}
        </Button>
      </div>

      {phrases.length > 0 && (
        <div className="px-5 pt-6 pb-8 animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Inspirado em {artist}
            </h2>
          </div>
          {topicLine && (
            <div className="mb-3 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {topicLine}
            </div>
          )}
          <p className="mb-3 text-[0.7rem] text-muted-foreground italic">
            Frases originais inspiradas no estilo do artista — não letras protegidas por direitos autorais.
          </p>
          <div className="space-y-3">
            {phrases.map((p, i) => {
              const saved = savedKeys.has(p.en);
              return (
                <div key={i} className="surface-card rounded-2xl p-3">
                  <PhrasePlayer en={p.en} pt={p.pt} variant="flat" />
                  {p.tip_pt && (
                    <p className="mt-2 px-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                      🎤 {p.tip_pt}
                    </p>
                  )}
                  <button
                    onClick={() => save(p)}
                    disabled={saved}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold transition-smooth ${
                      saved
                        ? "bg-success/15 text-success"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="h-3 w-3" /> Na sua revisão
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-3 w-3" /> Praticar esta frase
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function MusicaGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Musica />
    </RequireAuth>
  );
}
