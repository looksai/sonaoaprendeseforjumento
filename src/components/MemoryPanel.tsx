// Painel visual da memória adaptativa — usado no /perfil e como widget no home.
// Linguagem encorajadora em PT, evita "boletim escolar".

import { Link } from "@tanstack/react-router";
import { useMemory } from "@/store/useMemory";
import { Sparkles, TrendingUp, RefreshCw, Heart } from "lucide-react";

interface Props {
  compact?: boolean;
}

export function MemoryPanel({ compact = false }: Props) {
  const memory = useMemory();

  if (!memory.hasData) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-accent" />
          Sua memória adaptativa
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Conforme você pratica, vou lembrar do que é fácil e do que precisa de reforço — e adaptar suas próximas lições.
        </p>
      </div>
    );
  }

  const reviewCount = memory.reviewQueue.length;

  if (compact) {
    return (
      <Link to="/revisar" className="block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-accent p-4 shadow-soft transition-bounce active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <RefreshCw className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-accent-foreground">
                {reviewCount > 0
                  ? `Revisar hoje · ${reviewCount} ${reviewCount === 1 ? "ponto" : "pontos"}`
                  : "Tudo em dia ✨"}
              </div>
              <div className="text-xs text-accent-foreground/80">
                {reviewCount > 0 ? "Vamos reforçar isso juntos" : "Continue evoluindo no curso"}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/revisar" className="block">
        <div className="rounded-2xl bg-gradient-accent p-5 shadow-glow transition-bounce active:scale-[0.98]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-foreground/90">
            <RefreshCw className="h-3.5 w-3.5" /> Revisão de hoje
          </div>
          <div className="mt-2 text-2xl font-bold text-accent-foreground">
            {reviewCount > 0
              ? `${reviewCount} ${reviewCount === 1 ? "ponto" : "pontos"} para reforçar`
              : "Tudo em dia ✨"}
          </div>
          <p className="mt-1 text-sm text-accent-foreground/85">
            {reviewCount > 0
              ? "Toque para começar a revisão personalizada"
              : "Você está evoluindo bem — continue no curso"}
          </p>
        </div>
      </Link>

      {memory.strongTopics.length > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-success">
            <TrendingUp className="h-3.5 w-3.5" /> Tópicos fortes
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {memory.strongTopics.slice(0, 6).map((t) => (
              <span
                key={t.topic}
                className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success"
              >
                {t.topic}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Você está evoluindo bem nesses pontos 💪</p>
        </div>
      )}

      {memory.weakTopics.length > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warning">
            <Heart className="h-3.5 w-3.5" /> Vale revisar
          </div>
          <div className="mt-3 space-y-2">
            {memory.weakTopics.slice(0, 5).map((t) => {
              const target = memory.getLessonForTopic(t.topic);
              const inner = (
                <div className="flex items-center justify-between rounded-xl bg-warning/10 px-3 py-2.5">
                  <div>
                    <div className="text-sm font-semibold">{t.topic}</div>
                    <div className="text-[0.7rem] text-muted-foreground">
                      {t.correct} acertos · {t.incorrect} erros
                    </div>
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-warning">
                    reforçar
                  </span>
                </div>
              );
              return target ? (
                <Link
                  key={t.topic}
                  to="/licao/$levelId/$unitId/$lessonId"
                  params={{
                    levelId: target.levelId,
                    unitId: target.unitId,
                    lessonId: target.lesson.id,
                  }}
                  className="block transition-smooth active:scale-[0.98]"
                >
                  {inner}
                </Link>
              ) : (
                <div key={t.topic}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}

      {memory.hardPhrases.length > 0 && (
        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Frases para reforçar
          </div>
          <div className="mt-3 space-y-2">
            {memory.hardPhrases.slice(0, 5).map((p) => (
              <div key={p.key} className="rounded-xl bg-muted/50 px-3 py-2.5">
                <div className="text-sm font-medium">{p.en}</div>
                {p.pt && <div className="mt-0.5 text-xs text-muted-foreground">{p.pt}</div>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Vamos reforçar essas estruturas na próxima revisão.
          </p>
        </div>
      )}
    </div>
  );
}
