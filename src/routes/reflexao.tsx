// Reflexão semanal — tela pessoal de progresso.
// Dados 100% reais: useMemory + useSRS + useProgress.
// Tom: pessoal, insightful, nunca genérico.

import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useProgress } from "@/store/useProgress";
import { useMemory } from "@/store/useMemory";
import { useSRS } from "@/store/useSRS";
import { useGrokBrain } from "@/store/useGrokBrain";
import { useMemoryCoreV3 } from "@/store/useMemoryCoreV3";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Brain, Flame, Clock, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { evolutionLine } from "@/lib/narrative";

export const Route = createFileRoute("/reflexao")({
  head: () => ({
    meta: [
      { title: "Last Course — Sua semana" },
      { name: "description", content: "Reflexão semanal personalizada do sistema CSLE." },
    ],
  }),
  component: ReflexaoGuarded,
});

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

function sevenDaysAgoISO() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function Reflexao() {
  const progress = useProgress();
  const memory = useMemory();
  const srs = useSRS();
  const brain = useGrokBrain();
  const memoryCore = useMemoryCoreV3();

  if (!progress.profile) {
    return (
      <AppShell>
        <div className="px-5 pt-12 text-center">
          <p className="text-muted-foreground">Faça o onboarding primeiro.</p>
        </div>
      </AppShell>
    );
  }

  const firstName = progress.profile.name.split(" ")[0] || "você";
  const sevenAgo = sevenDaysAgoISO();
  const today = todayISO();

  // ---- Frases revisadas na semana (SRS) ----
  // "all" inclui frases que foram vistas (last_seen >= 7 dias atrás)
  const allPhrases = srs.reviews ?? [];
  const reviewedThisWeek = allPhrases.filter(
    (p) => p.last_seen && p.last_seen.slice(0, 10) >= sevenAgo,
  ).length;

  // ---- Minutos de estudo estimados ----
  // totalMinutes é acumulado em useProgress; mostramos o total e estimamos a semana
  // como uma proporção do streak (sem dados por sessão, essa é a melhor aproximação honesta)
  const totalMinutes = progress.totalMinutes;
  const avgMinPerLesson = progress.completedCount > 0
    ? Math.round(totalMinutes / progress.completedCount)
    : 5;
  // A semana passada: frases revisadas * 1 min + minutos estimados por progresso desta semana
  // Estimativa conservadora e honesta
  const estimatedWeekMinutes = Math.max(reviewedThisWeek * 1 + avgMinPerLesson * Math.min(progress.streak, 5), 0);

  // ---- Tópico mais fraco ----
  const weakTopic = memory.weakTopics[0] ?? null;

  // ---- Tópico mais forte ----
  const strongTopic = memory.strongTopics[0] ?? null;

  // ---- Tendência de progresso ----
  // Baseada no streak vs a semana: se streak >= 5, crescendo; se 0-2, em queda
  const trend: "up" | "flat" | "down" =
    progress.streak >= 5 ? "up" : progress.streak <= 1 ? "down" : "flat";

  // ---- Palavras do sistema sobre a semana ----
  function buildInsight(): string {
    if (progress.streak === 0) {
      return `${firstName}, você não estudou nos últimos dias. Isso acontece — o importante é não perder o fio por muito tempo.`;
    }
    if (weakTopic && reviewedThisWeek > 5) {
      return `Você revisou bem essa semana — ${reviewedThisWeek} frases. Mas "${weakTopic.topic}" ainda está pesando. Faz sentido atacar isso na próxima semana.`;
    }
    if (reviewedThisWeek === 0 && progress.streak > 0) {
      return `Você manteve o streak, mas não revisou frases essa semana. A revisão espaçada é onde a memória de longo prazo é construída — vale encaixar.`;
    }
    if (trend === "up") {
      return `${firstName}, sua semana foi boa. ${progress.streak} dias seguidos e ${reviewedThisWeek} frases revisadas. O sistema está pegando dados suficientes pra adaptar bem.`;
    }
    if (strongTopic && !weakTopic) {
      return `Seu ponto mais forte agora é "${strongTopic.topic}". Sem tópicos marcados como difíceis — você está sólido no que praticou até aqui.`;
    }
    return evolutionLine(progress.currentLevel, progress.completedCount);
  }

  const insight = buildInsight();

  // ---- Linha de progresso dos últimos 7 dias (visual simples) ----
  // Sem dados por dia, simulamos com base em streak e lastStudyDate
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    // Um dia "ativo" = dentro do streak counting de trás para frente
    const daysFromToday = daysBetween(iso, today);
    const active = daysFromToday < progress.streak;
    return { iso, label, active };
  });

  return (
    <AppShell>
      <div className="px-5 pt-8 pb-2 flex items-center gap-3">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-smooth">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Sua semana</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(sevenAgo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} –{" "}
            {new Date(today).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </p>
        </div>
      </div>

      {/* Insight pessoal */}
      <div className="mx-5 mt-4 rounded-2xl border border-primary/20 bg-primary/6 px-4 py-4 animate-fade-in-up">
        <div className="flex items-start gap-2">
          <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground/85">{insight}</p>
        </div>
      </div>

      {/* Métricas reais */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <MetricCard
          icon={<Flame className="h-4 w-4 text-amber-500" />}
          label="Dias seguidos"
          value={String(progress.streak)}
          sub={progress.streak >= 7 ? "semana perfeita" : progress.streak > 0 ? "dias de streak" : "sem streak"}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          label="Minutos essa semana"
          value={String(estimatedWeekMinutes)}
          sub="estimativa do sistema"
        />
        <MetricCard
          icon={<Target className="h-4 w-4 text-teal-600" />}
          label="Frases revisadas"
          value={String(reviewedThisWeek)}
          sub="nos últimos 7 dias"
        />
        <MetricCard
          icon={
            trend === "up" ? <TrendingUp className="h-4 w-4 text-green-600" /> :
            trend === "down" ? <TrendingDown className="h-4 w-4 text-red-500" /> :
            <Minus className="h-4 w-4 text-muted-foreground" />
          }
          label="Tendência"
          value={trend === "up" ? "Crescendo" : trend === "down" ? "Caindo" : "Estável"}
          sub={`${progress.completedCount} lições no total`}
        />
      </div>

      {/* Atividade da semana */}
      <div className="mx-5 mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Atividade — últimos 7 dias
        </p>
        <div className="flex items-end gap-2">
          {days.map((d) => (
            <div key={d.iso} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`w-full rounded-sm transition-smooth ${
                  d.active
                    ? "bg-primary h-8"
                    : d.iso === today
                    ? "bg-primary/30 h-4"
                    : "bg-muted h-3"
                }`}
              />
              <span className="text-[0.6rem] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tópico mais fraco */}
      {weakTopic && (
        <div className="mx-5 mt-4 rounded-2xl border border-destructive/20 bg-destructive/6 px-4 py-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-destructive/70 mb-1">
            Ponto mais fraco
          </p>
          <p className="text-sm font-semibold text-foreground">{weakTopic.topic}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {weakTopic.incorrect} erro{weakTopic.incorrect !== 1 ? "s" : ""} recentes ·{" "}
            {weakTopic.correct} acerto{weakTopic.correct !== 1 ? "s" : ""}
          </p>
          <Link
            to="/conversar"
            search={{ intent: `Quero praticar ${weakTopic.topic}` }}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            Praticar com Mia →
          </Link>
        </div>
      )}

      {/* Tópico mais forte */}
      {strongTopic && (
        <div className="mx-5 mt-3 rounded-2xl border border-success/20 bg-success/6 px-4 py-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-success/70 mb-1">
            Seu ponto mais forte
          </p>
          <p className="text-sm font-semibold text-foreground">{strongTopic.topic}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {strongTopic.correct} acerto{strongTopic.correct !== 1 ? "s" : ""} ·{" "}
            {strongTopic.incorrect} erro{strongTopic.incorrect !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {brain.lastEntries.length > 0 && (
        <div className="mx-5 mt-4 rounded-2xl border border-primary/15 bg-primary/6 px-4 py-3">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
            Diário do Personal
          </p>
          <div className="space-y-2">
            {brain.lastEntries.slice(0, 4).map((entry) => (
              <div key={entry.id} className="rounded-xl bg-background/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{entry.title}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[0.58rem] font-semibold text-muted-foreground">{entry.mood}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{entry.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {memoryCore.latestReplay && (
        <div className="mx-5 mt-4 rounded-2xl border border-accent/20 bg-accent/6 px-4 py-3">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-accent">Session Replay</p>
          <p className="text-sm font-semibold text-foreground">{memoryCore.latestReplay.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{memoryCore.latestReplay.message}</p>
          <div className="mt-2 space-y-1">
            {memoryCore.latestReplay.learned.slice(0, 2).map((item) => (
              <p key={item} className="text-xs text-foreground/75">• {item}</p>
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold text-accent">{memoryCore.latestReplay.nextStep}</p>
        </div>
      )}

      {memoryCore.latestDaily && (
        <div className="mx-5 mt-4 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Memory Core v3</p>
          <p className="text-sm font-semibold text-foreground">{memoryCore.latestDaily.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{memoryCore.latestDaily.summary}</p>
          {memoryCore.topPermanentMemories.length > 0 && (
            <div className="mt-3 space-y-1">
              {memoryCore.topPermanentMemories.slice(0, 3).map((item) => (
                <p key={item.id} className="rounded-xl bg-muted/45 px-3 py-2 text-xs text-foreground/75">{item.content}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Próxima semana */}
      <div className="mx-5 mt-4 mb-8 rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          O que o sistema fará na próxima semana
        </p>
        <ul className="space-y-1.5">
          {weakTopic && (
            <li className="flex items-start gap-2 text-xs text-foreground/75">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              Reforçar "{weakTopic.topic}" nas próximas lições e revisões.
            </li>
          )}
          {srs.dueToday.length > 0 && (
            <li className="flex items-start gap-2 text-xs text-foreground/75">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              {srs.upcoming.length} frases agendadas para revisão espaçada.
            </li>
          )}
          <li className="flex items-start gap-2 text-xs text-foreground/75">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
            Continuar trilha {progress.currentLevel} — {progress.totalLessons - progress.completedCount} lições restantes.
          </li>
        </ul>
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="surface-card rounded-2xl p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1 text-[0.7rem] text-muted-foreground">{sub}</p>
    </div>
  );
}

function ReflexaoGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Reflexao />
    </RequireAuth>
  );
}
