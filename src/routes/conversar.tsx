/**
 * Conversar — free-form chat with the Personal coach.
 *
 * Architecture:
 *   - useChat() owns messages, send, loading, scrollRef
 *   - AppShell hideNav for full-screen layout
 *   - AtmosphericLayer at root provides the dimmed background
 */

import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect, useState, useCallback, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProgress } from "@/store/useProgress";
import { useSpeech, splitBilingual } from "@/hooks/useSpeech";
import { PhrasePlayer } from "@/components/PhrasePlayer";
import { chatWithMia } from "@/lib/ai";
import { useMemory } from "@/store/useMemory";
import { useSRS } from "@/store/useSRS";
import { usePersonal } from "@/store/usePersonal";
import { useChat } from "@/hooks/useChat";
import { Mic, Send, Loader2, Sparkles, Target } from "lucide-react";
import { useCSLE } from "@/store/useCSLE";
import { CSLEModeBanner } from "@/components/CSLEModeBanner";
import { buildAgentSystemPrompt, buildBrainSnapshot } from "@/lib/grokBrain";
import { useGrokBrain } from "@/store/useGrokBrain";
import { useMemoryCoreV3 } from "@/store/useMemoryCoreV3";
import { toast } from "sonner";
import { MissionEngineCard } from "@/components/MissionEngineCard";
import { SkillGraphPanel } from "@/components/SkillGraphPanel";
import { usePersonalExperienceV4 } from "@/store/usePersonalExperienceV4";
import { useExperienceV5 } from "@/store/useExperienceV5";
import { buildVoiceLine } from "@/lib/personalExperienceV4";
import { RealtimeVoicePanel } from "@/components/RealtimeVoicePanel";

export const Route = createFileRoute("/conversar")({
  validateSearch: (search: Record<string, unknown>) => {
    const intent = typeof search.intent === "string" ? search.intent : undefined;
    return { intent };
  },
  head: () => ({
    meta: [
      { title: "Last Course — Conversar com seu Personal" },
      {
        name: "description",
        content:
          "Pratique inglês conversando com seu Personal por voz ou texto, com correção guiada.",
      },
    ],
  }),
  component: ConversarGuarded,
});

function Conversar() {
  const progress = useProgress();
  const memory = useMemory();
  const srs = useSRS();
  const speech = useSpeech("en-US");
  const { identity } = usePersonal();
  const { intent } = Route.useSearch();
  const csle = useCSLE();
  const brain = useGrokBrain();
  const memoryCore = useMemoryCoreV3();
  const experience = usePersonalExperienceV4();
  const v5 = useExperienceV5();

  const coachName = identity?.name ?? "Mia";

  const weakTopics = (() => {
    const fromMemory = memory.weakTopics.map((t) => t.topic);
    const fromSrs = srs.weakest.map((p) => p.topic);
    return Array.from(new Set([...fromMemory, ...fromSrs])).slice(0, 6);
  })();

  const brainInput = {
    csleMode: csle.mode,
    weakTopics,
    hotMemories: memory.hotEvents,
    warmMemories: memory.warmEvents,
    userName: progress.profile?.name,
    assistantName: coachName,
    dueCount: srs.dueToday.length,
    favoriteShows: progress.profile?.favoriteShows,
    favoriteMusic: progress.profile?.favoriteMusic,
    hobbies: progress.profile?.hobbies,
    intent,
  };

  const brainSnapshot = buildBrainSnapshot(brainInput);
  const ritual = memoryCore.getRitual({
    dueCount: srs.dueToday.length,
    streak: progress.streak,
    lastStudyDate: progress.lastStudyDate,
    assistantName: coachName,
    userName: progress.profile?.name,
    weakTopics,
    hotMemories: memory.hotEvents,
  });
  const missionContext = {
    csleMode: csle.mode,
    errorCount: csle.errorCount,
    successStreak: csle.successStreak,
    engagementScore: csle.engagementScore,
    dueCount: srs.dueToday.length,
    streak: progress.streak,
    lastStudyDate: progress.lastStudyDate,
    weakTopics,
    ritualKind: ritual.kind,
    hasUsedVoice: Boolean(experience.lastVoiceAt),
    preferredInterest: progress.profile?.favoriteShows || progress.profile?.favoriteMusic || progress.profile?.hobbies || null,
  };
  const energy = experience.getEnergyState(missionContext);
  const activeMission = experience.activeMission ?? experience.latestMission;

  useEffect(() => {
    if (!activeMission) experience.createMission(missionContext);
  }, [activeMission, experience, missionContext]);
  const voiceLine = buildVoiceLine({
    assistantName: coachName,
    userName: progress.profile?.name,
    mission: activeMission,
    energy,
    mode: activeMission?.csleMode ?? csle.mode,
    weakTopics,
  });
  const opener = brainSnapshot.opener + "\n\n" + ritual.line + "\n\n" + voiceLine.text;

  const handleSend = useCallback(
    async (messages: { role: "user" | "assistant"; content: string }[]) => {
      const agentHint = buildAgentSystemPrompt({
        csleMode: csle.mode,
        weakTopics,
        hotMemories: memory.hotEvents,
        warmMemories: memory.warmEvents,
        userName: progress.profile?.name,
        assistantName: coachName,
        dueCount: srs.dueToday.length,
        favoriteShows: progress.profile?.favoriteShows,
        favoriteMusic: progress.profile?.favoriteMusic,
        hobbies: progress.profile?.hobbies,
        intent,
      });
      const res = await chatWithMia({
        messages: [
          ...messages.slice(0, -1),
          {
            role: "user",
            content: `${messages.at(-1)?.content ?? ""}

[CSLE_CONTEXT]
${agentHint}

[MEMORY_CORE_V3]
Resumo diário: ${memoryCore.latestDaily?.summary ?? "nenhum"}
Último replay: ${memoryCore.latestReplay?.nextStep ?? "nenhum"}
Memórias permanentes: ${memoryCore.topPermanentMemories.map((m) => m.content).join(" | ") || "nenhuma"}
Ritual ativo: ${ritual.title} — ${ritual.intent}


[PERSONAL_EXPERIENCE_V4]
Missão ativa: ${experience.getMissionPrompt(activeMission)}
Skill graph: ${Object.entries(experience.skillGraph).map(([k, v]) => `${k}:${Math.round(Number(v) * 100)}%`).join(" | ")}
Energia detectada: ${energy}`,
          },
        ],
        level: progress.currentLevel,
        profile: progress.profile,
        voiceMode: "normal",
        weakTopics,
        guided: true,
        assistantName: coachName,
      });
      return res.reply;
    },
    [progress.currentLevel, progress.profile, weakTopics, coachName, csle.mode, memory.hotEvents, memory.warmEvents, srs.dueToday.length, intent, memoryCore, ritual],
  );

  useEffect(() => {
    csle.signal("chat_opened");
    brain.markSessionStart();
    if (intent === "first_magic_session") v5.startFirstMagic();
    memoryCore.markSessionStart();
    memoryCore.markRitualShown(ritual.kind);
    brain.addEntry({
      type: "opener",
      title: brainSnapshot.headline,
      summary: brainSnapshot.opener,
      mood: brainSnapshot.mood,
      tags: ["proactive", brainSnapshot.agent, brainSnapshot.mode.toLowerCase()],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { messages, send, loading, scrollRef } = useChat({
    initialMessages: [{ role: "assistant", content: opener }],
    onSend: handleSend,
    onError: (err) => toast.error(err.message || "Erro ao responder"),
  });

  const lastReplayMessageCount = useRef(0);

  useEffect(() => {
    const last = messages.at(-1);
    const userCount = messages.filter((message) => message.role === "user").length;
    if (!last || last.role !== "assistant" || userCount === 0) return;
    if (messages.length === lastReplayMessageCount.current) return;
    lastReplayMessageCount.current = messages.length;
    const replay = memoryCore.createReplay({
      messages,
      csleMode: csle.mode,
      weakTopics,
      agent: brainSnapshot.agent,
      startedAt: brain.lastSessionStartedAt,
    });
    if (replay) {
      if (intent === "first_magic_session") v5.completeFirstMagic();
      memory.recordEvent({
        content: "Replay da sessão: " + replay.nextStep,
        emotion: replay.mistakes.length ? "neutral" : "positive",
        importance: 0.66,
        tags: ["session-replay", "memory-core-v3"],
        source: "system",
      });
    }
  }, [messages, memoryCore, csle.mode, weakTopics, brainSnapshot.agent, brain.lastSessionStartedAt, memory]);

  const [input, setInput] = useState("");

  useEffect(() => {
    if (speech.transcript) {
      setInput(speech.transcript);
      speech.setTranscript("");
    }
  }, [speech.transcript, speech]);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    speech.cancel();
    memory.recordEvent({
      content: `Conversa com ${coachName}: ${text}`,
      emotion: text.includes("!") ? "positive" : "neutral",
      tags: ["chat", "personal", brainSnapshot.agent.toLowerCase()],
      source: "chat",
    });
    brain.addEntry({
      type: speech.listening ? "voice" : "conversation",
      title: `Sessão com ${coachName}`,
      summary: text,
      mood: brainSnapshot.mood,
      tags: ["chat", brainSnapshot.agent, csle.mode.toLowerCase()],
    });
    csle.signal("chat_message");
    experience.recordSkillEvent(speech.listening ? "voice_used" : "chat_sent");
    void send(text);
  }, [input, loading, send, speech, memory, coachName, csle, brain, brainSnapshot]);

  const handleSuggestionClick = useCallback(
    (text: string) => {
      speech.cancel();
      memory.recordEvent({
        content: `Sugestão escolhida na conversa: ${text}`,
        emotion: "neutral",
        tags: ["chat", "suggestion", brainSnapshot.agent.toLowerCase()],
        source: "chat",
      });
      brain.addEntry({
        type: "conversation",
        title: "Sugestão escolhida",
        summary: text,
        mood: brainSnapshot.mood,
        tags: ["suggestion", brainSnapshot.agent],
      });
      csle.signal("chat_message");
      experience.recordSkillEvent("chat_sent", 0.8);
      void send(text);
    },
    [send, speech, memory, csle, brain, brainSnapshot],
  );

  const suggestions =
    messages.length === 1
      ? [
          "Conte sobre o seu dia",
          "Vamos praticar uma apresentação",
          "Falar sobre séries",
          "Pedir comida em inglês",
        ]
      : ["Continue please", "Can you ask me a question?", "Explain that in PT"];

  return (
    <AppShell screen="focus" className="flex flex-col">
      {/* ── Header (sticky top) ── */}
      <div className="readable-panel sticky top-0 z-20 shrink-0 rounded-b-3xl border-x-0 border-t-0 px-5 pt-6 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-xl shadow-glow">
              ✨
            </div>
            <div>
              <h1 className="text-base font-bold">{coachName}</h1>
              <p className="text-xs text-muted-foreground">
                Seu Personal · {progress.currentLevel}
                {weakTopics.length > 0 && (
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-accent">
                    <Target className="h-2.5 w-2.5" /> guiado
                  </span>
                )}
                <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">
                  {brainSnapshot.agent}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable area: banner + mission + skills + messages ── */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          <CSLEModeBanner compact />

          <RealtimeVoicePanel userName={progress.profile?.name} />

          <MissionEngineCard
            mission={activeMission}
            energy={energy}
            voiceText={voiceLine.text}
            compact
            onSpeak={() => experience.speak(voiceLine)}
            onComplete={() => { experience.completeMission(activeMission?.id); import("@/lib/gamification").then(({ awardGamificationXP }) => awardGamificationXP(60, "Missão concluída")); }}
          />

          <SkillGraphPanel graph={experience.skillGraph} mastery={experience.mastery} compact />

          {memoryCore.latestReplay && (
            <div className="rounded-2xl border border-accent/15 bg-accent/6 px-3 py-2">
              <p className="text-[0.62rem] font-black uppercase tracking-wider text-accent">Replay ativo</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">{memoryCore.latestReplay.nextStep}</p>
            </div>
          )}

        <div className="space-y-3 pb-4">
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="flex justify-end animate-fade-in-up">
                  <div className="max-w-[85%] rounded-2xl bg-gradient-primary px-4 py-3 text-white shadow-soft">
                    <p className="whitespace-pre-line text-sm leading-relaxed">{m.content}</p>
                  </div>
                </div>
              );
            }
            const { en, pt } = splitBilingual(m.content);
            return (
              <div key={i} className="flex justify-start animate-fade-in-up">
                <div className="w-full max-w-[92%]">
                  <PhrasePlayer en={en || m.content} pt={pt || undefined} controls size="md" />
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-card px-4 py-3 shadow-soft">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── Input bar (sticky bottom, sits above mobile nav) ── */}
      <div className="readable-panel sticky bottom-0 z-20 shrink-0 rounded-t-3xl border-x-0 border-b-0 px-3 py-3">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestionClick(s)}
              className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft transition-smooth active:scale-95"
            >
              <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-[max(0px,env(safe-area-inset-bottom))]">
          {speech.supported && (
            <button
              onClick={() => (speech.listening ? speech.stop() : speech.start())}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-soft transition-bounce active:scale-95 ${
                speech.listening ? "animate-pulse-glow" : ""
              }`}
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          <Input
            placeholder={
              speech.listening ? "Ouvindo sua resposta..." : `Fale ou escreva para ${coachName}...`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="h-12 min-w-0 flex-1 rounded-2xl border-2 bg-card text-base"
            disabled={loading}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-primary p-0 shadow-soft"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function ConversarGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Conversar />
    </RequireAuth>
  );
}
