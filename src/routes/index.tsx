import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useProgress } from "@/store/useProgress";
import { useAuth } from "@/store/useAuth";
import { useSRS } from "@/store/useSRS";
import { COURSE } from "@/data/course";
import { MissionEngineCard } from "@/components/MissionEngineCard";
import { SkillGraphPanel } from "@/components/SkillGraphPanel";
import { GamificationPanel } from "@/components/GamificationPanel";
import { PersonalCard } from "@/components/PersonalCard";
import { useMemory } from "@/store/useMemory";
import { useMemoryCoreV3 } from "@/store/useMemoryCoreV3";
import { usePersonalExperienceV4 } from "@/store/usePersonalExperienceV4";
import { buildVoiceLine } from "@/lib/personalExperienceV4";
import { ArrowRight, BookOpen, MessageCircle, RefreshCw, Settings, Sparkles, Tv } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Last Course — Sua missão de hoje" },
      {
        name: "description",
        content: "Last Course: inglês com CSLE, voz, memória e missões personalizadas.",
      },
    ],
  }),
  component: IndexGuarded,
});

function IndexGuarded() {
  return (
    <RequireAuth>
      <Index />
    </RequireAuth>
  );
}

function Index() {
  const progress = useProgress();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const srs = useSRS();
  const memory = useMemory();
  const memoryCore = useMemoryCoreV3();
  const experience = usePersonalExperienceV4();
  const dueCount = srs.dueToday.length;

  useEffect(() => {
    if (!progress.profile) navigate({ to: "/onboarding" });
  }, [progress.profile, navigate]);

  useEffect(() => {
    if (!progress.profile) return;
    memoryCore.consolidateFromEvents(memory.events);
  }, [progress.profile, memory.events, memoryCore]);

  useEffect(() => {
    if (typeof window === "undefined" || !progress.profile) return;
    try {
      if (!localStorage.getItem("csle-welcome-done-v1")) navigate({ to: "/intro" });
    } catch {
      /* ignore */
    }
  }, [progress.profile, navigate]);

  const profile = progress.profile;

  const level = COURSE.find((l) => l.id === progress.currentLevel) ?? COURSE[0];
  const next = progress.nextLesson;
  const firstName = (profile?.name ?? "amigo").split(" ")[0] || "amigo";
  const weakTopics = memory.weakTopics.map((topic) => topic.topic).slice(0, 4);
  const missionContext = {
    csleMode: "LINE" as const,
    errorCount: 0,
    successStreak: 0,
    engagementScore: 0.62,
    dueCount,
    streak: progress.streak,
    lastStudyDate: progress.lastStudyDate,
    weakTopics,
    ritualKind: memoryCore.ritualStats.lastKind ?? undefined,
    hasUsedVoice: Boolean(experience.lastVoiceAt),
    preferredInterest: profile?.favoriteShows || profile?.favoriteMusic || profile?.hobbies || null,
  };
  const energy = experience.getEnergyState(missionContext);
  const activeMission = experience.activeMission ?? experience.latestMission;

  useEffect(() => {
    if (!activeMission) experience.createMission(missionContext);
  }, [activeMission, experience, missionContext]);

  const voiceLine = buildVoiceLine({
    assistantName: "Mia",
    userName: firstName,
    mission: activeMission,
    energy,
    mode: activeMission?.csleMode ?? "LINE",
    weakTopics,
  });

  if (!profile) return null;

  return (
    <AppShell>
      <div className="v6-page-pad pt-8 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="v6-section-title">Last Course</div>
            <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-foreground">
              Olá, {firstName} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/personalizar" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-foreground shadow-soft">
              <Settings className="h-4 w-4" />
            </Link>
            <span className="rounded-full border border-primary/25 bg-white/70 px-3 py-1 text-xs font-black text-primary shadow-soft">
              {level.id}
            </span>
          </div>
        </div>

        <section className="v6-hero mt-5 p-5 sm:p-6">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Missão de hoje
            </div>
            <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-foreground">
              {activeMission?.title ?? "Uma missão curta para destravar seu inglês."}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/75">
              {voiceLine.text || "Eu aprendo como você aprende: voz, memória, revisão e exemplos do seu mundo."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {next && (
                <Link
                  to="/licao/$levelId/$unitId/$lessonId"
                  params={{ levelId: next.levelId, unitId: next.unitId, lessonId: next.lesson.id }}
                  className="v6-primary-action px-5 py-3 text-sm"
                >
                  Começar agora <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link to="/conversar" search={{ intent: "" }} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/80 px-5 py-3 text-sm font-black text-foreground shadow-soft">
                Conversar <MessageCircle className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {!authLoading && !user && (
          <Link to="/auth" className="mt-4 block">
            <div className="v6-compact-card flex items-center justify-between gap-3 p-4">
              <div>
                <div className="text-sm font-black text-foreground">Salve seu progresso</div>
                <p className="text-xs text-foreground/65">Crie uma conta para continuar em qualquer dispositivo.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </Link>
        )}
      </div>

      <div className="v6-page-pad space-y-4 pb-8">
        <Link to="/series" className="block">
          <section className="v7-feature-card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-glow">
                <Tv className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">Função exclusiva</div>
                <h2 className="mt-1 text-xl font-black leading-tight text-foreground">Estude com filmes e séries</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                  Envie uma legenda, o app entende o episódio e transforma frases reais em estudo guiado com CSLE.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground">
                  Abrir modo séries <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </section>
        </Link>

        <MissionEngineCard
          mission={activeMission}
          energy={energy}
          voiceText={voiceLine.text}
          compact
          onSpeak={() => experience.speak(voiceLine)}
          onComplete={() => {
            experience.completeMission(activeMission?.id);
            import("@/lib/gamification").then(({ awardGamificationXP }) => awardGamificationXP(60, "Missão concluída"));
          }}
          onDismiss={() => experience.clearActiveMission()}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <SkillGraphPanel graph={experience.skillGraph} mastery={experience.mastery} compact />
          <GamificationPanel compact />
        </div>

        <PersonalCard />

        <div>
          <div className="v6-section-title mb-3">Ações rápidas</div>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/curso" icon={<BookOpen className="h-5 w-5" />} title="Curso" subtitle="Linha central" />
            <QuickAction to="/revisar" icon={<RefreshCw className="h-5 w-5" />} title="Revisar" subtitle={dueCount ? `${dueCount} hoje` : "em dia"} />
            <QuickAction to="/series" icon={<Tv className="h-5 w-5" />} title="Séries" subtitle="legendas" />
            <QuickAction to="/social" icon={<MessageCircle className="h-5 w-5" />} title="Social" subtitle="salas ao vivo" />
          </div>
        </div>

        <Link to="/debug" className="block pt-2 text-center text-[0.68rem] font-bold uppercase tracking-wider text-foreground/45">
          debug/test
        </Link>
      </div>
    </AppShell>
  );
}

function QuickAction({ to, icon, title, subtitle }: { to: "/curso" | "/revisar" | "/series" | "/social"; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link to={to} className="v6-compact-card flex items-center gap-3 p-4 transition-bounce active:scale-[0.98]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-foreground">{title}</span>
        <span className="block truncate text-xs text-foreground/60">{subtitle}</span>
      </span>
    </Link>
  );
}
