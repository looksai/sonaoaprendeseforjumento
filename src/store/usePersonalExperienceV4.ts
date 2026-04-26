import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SKILL_GRAPH,
  buildVoiceLine,
  detectEnergyState,
  generateMission,
  masteryScore,
  missionToPrompt,
  normalizeSkillGraph,
  strongestSkills,
  updateSkillGraph,
  weakestSkills,
  type Mission,
  type MissionContext,
  type SkillEventType,
  type SkillGraph,
  type SkillKey,
  type VoiceLine,
} from "@/lib/personalExperienceV4";

export interface PersonalExperienceState {
  skillGraph: SkillGraph;
  missions: Mission[];
  activeMissionId: string | null;
  voiceHistory: VoiceLine[];
  lastVoiceAt: string | null;
}

const STORAGE_KEY = "csle-personal-experience-v4";
const DEFAULT_STATE: PersonalExperienceState = {
  skillGraph: DEFAULT_SKILL_GRAPH,
  missions: [],
  activeMissionId: null,
  voiceHistory: [],
  lastVoiceAt: null,
};

const listeners = new Set<(state: PersonalExperienceState) => void>();
let cache: PersonalExperienceState | null = null;

function loadState(): PersonalExperienceState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersonalExperienceState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      skillGraph: normalizeSkillGraph(parsed.skillGraph),
      missions: Array.isArray(parsed.missions) ? parsed.missions : [],
      voiceHistory: Array.isArray(parsed.voiceHistory) ? parsed.voiceHistory : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: PersonalExperienceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function getState() {
  if (cache) return cache;
  cache = loadState();
  return cache;
}

function compact(state: PersonalExperienceState): PersonalExperienceState {
  return {
    ...state,
    skillGraph: normalizeSkillGraph(state.skillGraph),
    missions: state.missions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50),
    voiceHistory: state.voiceHistory.slice(0, 24),
  };
}

function setState(updater: (state: PersonalExperienceState) => PersonalExperienceState) {
  const next = compact(updater(getState()));
  cache = next;
  saveState(next);
  listeners.forEach((listener) => listener(next));
}

export function usePersonalExperienceV4() {
  const [state, setLocal] = useState<PersonalExperienceState>(() => getState());

  useEffect(() => {
    const listener = (next: PersonalExperienceState) => setLocal(next);
    listeners.add(listener);
    setLocal(getState());
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const recordSkillEvent = useCallback((event: SkillEventType, weight = 1) => {
    setState((current) => ({ ...current, skillGraph: updateSkillGraph(current.skillGraph, event, weight) }));
  }, []);

  const createMission = useCallback((context: MissionContext) => {
    let created: Mission | null = null;
    setState((current) => {
      const recentActive = current.missions.find((mission) => mission.id === current.activeMissionId && !mission.completedAt);
      if (recentActive) {
        created = recentActive;
        return current;
      }
      created = generateMission(context, current.skillGraph);
      return { ...current, missions: [created, ...current.missions], activeMissionId: created.id };
    });
    return created;
  }, []);

  const completeMission = useCallback((missionId?: string | null) => {
    setState((current) => {
      const id = missionId ?? current.activeMissionId;
      if (!id) return current;
      return {
        ...current,
        skillGraph: updateSkillGraph(current.skillGraph, "mission_completed", 1),
        missions: current.missions.map((mission) => (mission.id === id ? { ...mission, completedAt: mission.completedAt ?? new Date().toISOString() } : mission)),
        activeMissionId: current.activeMissionId === id ? null : current.activeMissionId,
      };
    });
  }, []);

  const clearActiveMission = useCallback(() => {
    setState((current) => ({ ...current, activeMissionId: null }));
  }, []);

  const buildAndStoreVoiceLine = useCallback(
    (args: Parameters<typeof buildVoiceLine>[0]) => {
      const line = buildVoiceLine(args);
      setState((current) => ({ ...current, voiceHistory: [line, ...current.voiceHistory], lastVoiceAt: new Date().toISOString() }));
      return line;
    },
    [],
  );

  const speak = useCallback((line: VoiceLine) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.lang = "pt-BR";
      utterance.rate = line.speed;
      utterance.pitch = line.pitch;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetExperience = useCallback(() => setState(() => DEFAULT_STATE), []);

  const activeMission = useMemo(() => state.missions.find((mission) => mission.id === state.activeMissionId) ?? null, [state.missions, state.activeMissionId]);
  const latestMission = state.missions[0] ?? null;
  const weakest = useMemo(() => weakestSkills(state.skillGraph, 2), [state.skillGraph]);
  const strongest = useMemo(() => strongestSkills(state.skillGraph, 2), [state.skillGraph]);
  const mastery = useMemo(() => masteryScore(state.skillGraph), [state.skillGraph]);

  const getEnergyState = useCallback((context: MissionContext) => detectEnergyState(context), []);
  const getMissionPrompt = useCallback((mission?: Mission | null) => missionToPrompt(mission ?? activeMission), [activeMission]);

  return {
    ...state,
    activeMission,
    latestMission,
    weakest,
    strongest,
    mastery,
    recordSkillEvent,
    createMission,
    completeMission,
    clearActiveMission,
    buildAndStoreVoiceLine,
    speak,
    getEnergyState,
    getMissionPrompt,
    resetExperience,
  };
}

export type { Mission, MissionContext, SkillEventType, SkillGraph, SkillKey, VoiceLine };
