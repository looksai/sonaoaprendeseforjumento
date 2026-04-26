import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type TypingScope = "room" | "dm";

export type TypingEntry = {
  scope: TypingScope;
  key: string;
  userId: string;
  name: string;
  expiresAt: number;
};

type ChatUIState = {
  unreadRooms: Record<string, number>;
  unreadDMs: Record<string, number>;
  typing: TypingEntry[];
  incrementRoom: (room: string) => void;
  clearRoom: (room: string) => void;
  incrementDM: (userId: string) => void;
  clearDM: (userId: string) => void;
  recordTyping: (entry: Omit<TypingEntry, "expiresAt">) => void;
  clearExpiredTyping: () => void;
};

export const useChatUI = create<ChatUIState>((set, get) => ({
  unreadRooms: {},
  unreadDMs: {},
  typing: [],
  incrementRoom: (room) =>
    set((s) => ({
      unreadRooms: {
        ...s.unreadRooms,
        [room]: (s.unreadRooms[room] || 0) + 1,
      },
    })),
  clearRoom: (room) =>
    set((s) => {
      const copy = { ...s.unreadRooms };
      delete copy[room];
      return { unreadRooms: copy };
    }),
  incrementDM: (userId) =>
    set((s) => ({
      unreadDMs: {
        ...s.unreadDMs,
        [userId]: (s.unreadDMs[userId] || 0) + 1,
      },
    })),
  clearDM: (userId) =>
    set((s) => {
      const copy = { ...s.unreadDMs };
      delete copy[userId];
      return { unreadDMs: copy };
    }),
  recordTyping: (entry) => {
    const expiresAt = Date.now() + 3500;
    const next = get()
      .typing.filter(
        (t) =>
          !(
            t.scope === entry.scope &&
            t.key === entry.key &&
            t.userId === entry.userId
          ) && t.expiresAt > Date.now(),
      )
      .concat({ ...entry, expiresAt });
    set({ typing: next });
  },
  clearExpiredTyping: () =>
    set((s) => ({ typing: s.typing.filter((t) => t.expiresAt > Date.now()) })),
}));

let typingChannel: RealtimeChannel | null = null;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
let currentUserId: string | null = null;

export function startChatTypingBridge(userId: string | null) {
  if (typeof window === "undefined") return;
  currentUserId = userId;
  if (!typingChannel) {
    typingChannel = supabase
      .channel("csle-chat-typing")
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as Partial<Omit<TypingEntry, "expiresAt">>;
        if (!data.userId || !data.key || !data.scope || !data.name) return;
        if (currentUserId && data.userId === currentUserId) return;
        useChatUI.getState().recordTyping({
          scope: data.scope,
          key: data.key,
          userId: data.userId,
          name: data.name,
        });
      })
      .subscribe();
  }
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => useChatUI.getState().clearExpiredTyping(), 1000);
  }
}

export function sendTypingSignal(entry: Omit<TypingEntry, "expiresAt">) {
  if (!typingChannel || typeof window === "undefined") return;
  void typingChannel.send({
    type: "broadcast",
    event: "typing",
    payload: entry,
  });
}

export function typingNames(scope: TypingScope, key: string) {
  return useChatUI
    .getState()
    .typing.filter((t) => t.scope === scope && t.key === key && t.expiresAt > Date.now())
    .map((t) => t.name);
}
