// "Aprenda com o que você está assistindo"
// Three paths to turn real-world content into English practice:
//   1. IA: tell us the show — we generate the iconic phrases (no setup)
//   2. Cole o texto: paste the dialogue if you have it
//   3. Arquivo: load a transcript file
import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhrasePlayer } from "@/components/PhrasePlayer";
import { useProgress } from "@/store/useProgress";
import {
  extractPhrasesFromSubtitle,
  fetchEpisodePhrases,
  type ExtractedPhrase,
  type EpisodePhrase,
  type EpisodeMeta,
} from "@/lib/ai";
import { parseSrtToText } from "@/data/course";
import { useSRS } from "@/store/useSRS";
import { Upload, Loader2, Sparkles, ArrowLeft, FileText, Tv, ClipboardPaste, Wand2, BookmarkPlus, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/legendas")({
  head: () => ({
    meta: [
      { title: "CSLE — Estude com séries e filmes" },
      {
        name: "description",
        content: "Transforme o que você está assistindo em prática real de inglês.",
      },
    ],
  }),
  component: LegendasGuarded,
});

type Tab = "ai" | "episode" | "file";

const STORAGE_KEY = "csle-last-episode-v1";

interface SavedEpisode extends EpisodeMeta {
  subtitle?: string;
}

function loadSaved(): SavedEpisode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(ep: SavedEpisode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ep));
  } catch {
    /* ignore */
  }
}

interface DisplayPhrase {
  en: string;
  pt: string;
  why_pt?: string;
  context_pt?: string;
  related_to_lesson?: boolean;
}

function Legendas() {
  const fileRef = useRef<HTMLInputElement>(null);
  const progress = useProgress();
  const srs = useSRS();
  const [tab, setTab] = useState<Tab>("ai");
  const [series, setSeries] = useState("");
  const [season, setSeason] = useState("");
  const [episode, setEpisode] = useState("");
  const [epTitle, setEpTitle] = useState("");
  const [subtitleText, setSubtitleText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phrases, setPhrases] = useState<DisplayPhrase[]>([]);
  const [usedEpisode, setUsedEpisode] = useState<EpisodeMeta | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setSeries(saved.series ?? "");
      setSeason(String(saved.season ?? ""));
      setEpisode(String(saved.episode ?? ""));
      setEpTitle(saved.title ?? "");
      if (saved.subtitle) setSubtitleText(saved.subtitle);
    }
  }, []);

  const next = progress.nextLesson;
  const lessonTopic = next?.lesson.title ?? "Inglês geral";

  async function handleFile(file: File) {
    if (file.size > 1_500_000) {
      toast.error("Arquivo muito grande. Limite de ~1.5MB.");
      return;
    }
    setFileName(file.name);
    try {
      const raw = await file.text();
      const text = parseSrtToText(raw);
      setSubtitleText(text);
      toast.success("Texto carregado — pronto para gerar suas frases.");
    } catch {
      toast.error("Não consegui ler esse arquivo.");
    }
  }

  async function handlePasteFromClipboard() {
    try {
      const txt = await navigator.clipboard.readText();
      if (!txt || txt.length < 30) {
        toast.error("Sua área de transferência está vazia ou muito curta.");
        return;
      }
      const cleaned = parseSrtToText(txt);
      setSubtitleText(cleaned || txt);
      toast.success("Texto colado!");
    } catch {
      toast.error("Não consegui acessar a área de transferência.");
    }
  }

  function buildEpisodeMeta(): EpisodeMeta | null {
    if (!series.trim()) return null;
    return {
      series: series.trim(),
      season: season.trim() || undefined,
      episode: episode.trim() || undefined,
      title: epTitle.trim() || undefined,
    };
  }

  async function generateFromAI() {
    const meta = buildEpisodeMeta();
    if (!meta) {
      toast.error("Diga a série ou o filme que você está assistindo.");
      return;
    }
    setLoading(true);
    setPhrases([]);
    setAiSummary(null);
    try {
      const res = await fetchEpisodePhrases({
        series: meta.series,
        season: meta.season ? String(meta.season) : undefined,
        episode: meta.episode ? String(meta.episode) : undefined,
        title: meta.title,
        lesson_topic: lessonTopic,
        level: progress.currentLevel,
      });
      const display: DisplayPhrase[] = (res.phrases ?? []).map((p: EpisodePhrase) => ({
        en: p.en,
        pt: p.pt,
        why_pt: p.why_pt,
        context_pt: p.context_pt,
        related_to_lesson: p.related_to_lesson,
      }));
      setPhrases(display);
      setAiSummary(res.episode_summary_pt ?? null);
      setUsedEpisode(meta);
      persist({ ...meta });
      toast.success(`✨ ${display.length} frases prontas para você praticar!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui gerar as frases agora");
    } finally {
      setLoading(false);
    }
  }

  async function extractFromSubtitle() {
    const text = subtitleText.trim();
    if (text.length < 50) {
      toast.error("Cole o texto do diálogo primeiro.");
      return;
    }
    const meta = buildEpisodeMeta();
    setLoading(true);
    setPhrases([]);
    setAiSummary(null);
    try {
      const res = await extractPhrasesFromSubtitle({
        subtitle_text: text,
        lesson_topic: lessonTopic,
        level: progress.currentLevel,
        episode: meta ?? undefined,
      });
      const display: DisplayPhrase[] = (res.phrases ?? []).map((p: ExtractedPhrase) => ({
        en: p.en,
        pt: p.pt,
        why_pt: p.why_pt,
        related_to_lesson: p.related_to_lesson,
      }));
      setPhrases(display);
      setUsedEpisode(meta ?? null);
      if (meta) persist({ ...meta, subtitle: text.slice(0, 200_000) });
      toast.success(`✨ ${display.length} frases destacadas!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui processar agora");
    } finally {
      setLoading(false);
    }
  }

  async function practiceThis(p: DisplayPhrase) {
    const topic = usedEpisode?.series ? `Episódio: ${usedEpisode.series}` : "Episódio";
    try {
      await srs.addOrTouch({
        en: p.en,
        pt: p.pt,
        topic,
        source: "episode",
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
            Conteúdo real
          </div>
          <h1 className="text-xl font-bold">Estude o episódio que você viu hoje</h1>
          <p className="text-xs text-muted-foreground">
            Transforme suas séries favoritas em prática real de inglês
          </p>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="surface-elevated rounded-2xl p-4">
          <p className="text-sm font-semibold leading-relaxed text-foreground">
            O que você está assistindo?
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
            Me diga a série, a temporada e o episódio — eu vou destacar as frases mais importantes para você aprender enquanto assiste.
          </p>
          {next && (
            <p className="mt-2 text-xs text-muted-foreground">
              Sua lição atual:{" "}
              <span className="font-semibold text-foreground">{next.lesson.title}</span>
            </p>
          )}
        </div>
      </div>

      {/* Suggestion chips — Netflix-style quick picks */}
      <div className="px-5 pt-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            "Stranger Things",
            "Friends",
            "The Office",
            "Breaking Bad",
            "How I Met Your Mother",
            "Brooklyn 99",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setSeries(s)}
              className="shrink-0 rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-smooth active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex gap-1 rounded-2xl bg-white/40 p-1 backdrop-blur">
          <TabBtn
            active={tab === "ai"}
            onClick={() => setTab("ai")}
            icon={<Wand2 className="h-4 w-4" />}
          >
            Pelo nome
          </TabBtn>
          <TabBtn
            active={tab === "episode"}
            onClick={() => setTab("episode")}
            icon={<Tv className="h-4 w-4" />}
          >
            Colar diálogo
          </TabBtn>
          <TabBtn
            active={tab === "file"}
            onClick={() => setTab("file")}
            icon={<FileText className="h-4 w-4" />}
          >
            Arquivo
          </TabBtn>
        </div>
      </div>

      {(tab === "ai" || tab === "episode") && (
        <div className="px-5 pt-4 space-y-3 animate-fade-in">
          <div>
            <Label className="text-xs font-semibold">Série ou filme</Label>
            <Input
              placeholder="Ex: Friends, Stranger Things, Oppenheimer…"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              className="mt-1 h-11 rounded-xl border-2"
              maxLength={80}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs font-semibold">Temporada</Label>
              <Input
                placeholder="1"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                inputMode="numeric"
                className="mt-1 h-11 rounded-xl border-2"
                maxLength={3}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Episódio</Label>
              <Input
                placeholder="3"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                inputMode="numeric"
                className="mt-1 h-11 rounded-xl border-2"
                maxLength={3}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Título (opc.)</Label>
              <Input
                placeholder="The One With…"
                value={epTitle}
                onChange={(e) => setEpTitle(e.target.value)}
                className="mt-1 h-11 rounded-xl border-2"
                maxLength={80}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div className="px-5 pt-4 animate-fade-in">
          <p className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-[0.75rem] leading-relaxed text-foreground/85">
            <Wand2 className="mr-1 inline h-3 w-3 text-primary" />
            <strong>Sem precisar copiar nada.</strong> Você diz o que está assistindo — a gente
            destaca as frases mais marcantes desse episódio, com tradução e contexto da cena.
          </p>
          <Button
            onClick={generateFromAI}
            disabled={loading || !series.trim()}
            className="mt-4 w-full rounded-2xl bg-gradient-cta py-6 text-base font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparando suas frases…
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" /> Destacar frases do episódio
              </>
            )}
          </Button>
        </div>
      )}

      {tab === "episode" && (
        <div className="px-5 pt-4 space-y-3 animate-fade-in">
          <div>
            <div className="flex items-end justify-between">
              <Label className="text-xs font-semibold">Diálogo do episódio</Label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-semibold text-muted-foreground transition-smooth hover:bg-primary/15 hover:text-primary"
              >
                <ClipboardPaste className="h-3 w-3" /> Colar
              </button>
            </div>
            <Textarea
              placeholder={`Cole aqui o diálogo do episódio em inglês.\n\nPode ser qualquer trecho que tenha as falas — o sistema cuida do resto.`}
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
              className="mt-1 min-h-[140px] rounded-xl border-2 font-mono text-xs"
              maxLength={200_000}
            />
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              {subtitleText.length.toLocaleString("pt-BR")} caracteres ·{" "}
              {subtitleText.trim().length >= 50
                ? "pronto"
                : "cole pelo menos algumas linhas"}
            </p>
          </div>
          <Button
            onClick={extractFromSubtitle}
            disabled={loading || subtitleText.trim().length < 50}
            className="w-full rounded-2xl bg-gradient-cta py-6 text-base font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Destacando frases…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> Destacar as frases mais úteis
              </>
            )}
          </Button>
        </div>
      )}

      {tab === "file" && (
        <div className="px-5 pt-4 animate-fade-in">
          <input
            ref={fileRef}
            type="file"
            accept=".srt,.txt,.vtt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-6 transition-smooth active:scale-[0.98]"
          >
            <Upload className="h-6 w-6 text-primary" />
            <span className="font-semibold">
              {fileName ? "Trocar arquivo" : "Carregar transcrição (.srt / .vtt / .txt)"}
            </span>
          </button>
          {fileName && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> {fileName} ·{" "}
              {subtitleText.length.toLocaleString("pt-BR")} chars
            </p>
          )}
          {subtitleText.length >= 50 && (
            <Button
              onClick={extractFromSubtitle}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-gradient-cta py-6 text-base font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Destacando frases…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" /> Destacar frases do arquivo
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {phrases.length > 0 && (
        <div className="px-5 pt-6 pb-8 animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Frases para você praticar
            </h2>
          </div>
          {usedEpisode && (
            <p className="mb-2 text-xs text-muted-foreground">
              📺 <strong className="text-foreground">{usedEpisode.series}</strong>
              {usedEpisode.season && ` · T${usedEpisode.season}`}
              {usedEpisode.episode && `E${usedEpisode.episode}`}
              {usedEpisode.title && ` — ${usedEpisode.title}`}
            </p>
          )}
          {aiSummary && (
            <div className="mb-3 rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {aiSummary}
            </div>
          )}
          <div className="space-y-3">
            {phrases.map((p, i) => {
              const saved = savedKeys.has(p.en);
              return (
                <div
                  key={i}
                  className={`surface-card rounded-2xl p-3 ${p.related_to_lesson ? "ring-2 ring-primary/40" : ""}`}
                >
                  {p.related_to_lesson && (
                    <div className="mb-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-primary">
                      🎯 conecta com sua lição
                    </div>
                  )}
                  <PhrasePlayer en={p.en} pt={p.pt} variant="flat" />
                  {p.why_pt && (
                    <p className="mt-2 px-1 text-[0.7rem] leading-relaxed text-muted-foreground">
                      💡 {p.why_pt}
                    </p>
                  )}
                  {p.context_pt && (
                    <p className="mt-1 px-1 text-[0.7rem] leading-relaxed text-muted-foreground italic">
                      🎬 {p.context_pt}
                    </p>
                  )}
                  <button
                    onClick={() => practiceThis(p)}
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

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-smooth ${
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export default Legendas;

function LegendasGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Legendas />
    </RequireAuth>
  );
}
