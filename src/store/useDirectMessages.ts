import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type DirectMessage = {
  id: string; // "cloud-<uuid>" or "local-<rand>"
  senderId: string;
  recipientId: string;
  kind: "text" | "voice" | "sticker";
  content: string;
  readAt: string | null;
  createdAt: number;
};

interface DMRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  kind: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

type DMState = {
  myUserId: string | null;
  messages: DirectMessage[]; // all DMs the user is part of
  activePeerId: string | null;
  setActivePeer: (id: string | null) => void;
  send: (peerId: string, content: string, kind?: "text" | "voice" | "sticker") => void;
  markConversationRead: (peerId: string) => Promise<void>;
};

function rowToDM(row: DMRow): DirectMessage {
  const validKind: DirectMessage["kind"] =
    row.kind === "voice" || row.kind === "sticker" ? row.kind : "text";
  return {
    id: `cloud-${row.id}`,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    kind: validKind,
    content: row.content,
    readAt: row.read_at,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const useDirectMessages = create<DMState>()((set, get) => ({
  myUserId: null,
  messages: [],
  activePeerId: null,
  setActivePeer: (id) => {
    set({ activePeerId: id });
    if (id) void get().markConversationRead(id);
  },
  send: (peerId, content, kind = "text") => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const myId = get().myUserId;
    if (!myId) return;
    const optimistic: DirectMessage = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId: myId,
      recipientId: peerId,
      kind,
      content: trimmed,
      readAt: null,
      createdAt: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, optimistic] }));
    void (async () => {
      try {
        await supabase.from("direct_messages").insert({
          sender_id: myId,
          recipient_id: peerId,
          kind,
          content: trimmed,
        });
      } catch (err) {
        console.warn("[useDirectMessages] send failed", err);
      }
    })();
  },
  markConversationRead: async (peerId) => {
    const myId = get().myUserId;
    if (!myId) return;
    try {
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", peerId)
        .eq("recipient_id", myId)
        .is("read_at", null);
    } catch (err) {
      console.warn("[useDirectMessages] mark read failed", err);
    }
  },
}));

function mergeDM(msg: DirectMessage) {
  const existing = useDirectMessages.getState().messages;
  if (existing.some((m) => m.id === msg.id)) return;
  // Dedup vs optimistic
  const myId = useDirectMessages.getState().myUserId;
  const filtered =
    myId && msg.senderId === myId
      ? existing.filter(
          (m) =>
            !(
              m.id.startsWith("local-") &&
              m.senderId === msg.senderId &&
              m.recipientId === msg.recipientId &&
              m.content === msg.content &&
              Math.abs(m.createdAt - msg.createdAt) < 15000
            ),
        )
      : existing;
  useDirectMessages.setState({ messages: [...filtered, msg] });
}

function patchDM(msg: DirectMessage) {
  const existing = useDirectMessages.getState().messages;
  const idx = existing.findIndex((m) => m.id === msg.id);
  if (idx < 0) {
    mergeDM(msg);
    return;
  }
  const copy = [...existing];
  copy[idx] = { ...copy[idx], ...msg };
  useDirectMessages.setState({ messages: copy });
}

let dmChannel: RealtimeChannel | null = null;

async function hydrateDMs(userId: string) {
  try {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) {
      console.warn("[useDirectMessages] hydrate failed", error);
      return;
    }
    const msgs = ((data ?? []) as DMRow[]).map(rowToDM);
    useDirectMessages.setState({ messages: msgs });
  } catch (err) {
    console.warn("[useDirectMessages] hydrate exception", err);
  }
}

function subscribeDMs(userId: string) {
  if (dmChannel) return;
  dmChannel = supabase
    .channel(`dm:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `sender_id=eq.${userId}`,
      },
      (payload) => mergeDM(rowToDM(payload.new as DMRow)),
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => mergeDM(rowToDM(payload.new as DMRow)),
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => patchDM(rowToDM(payload.new as DMRow)),
    )
    .subscribe();
}

function teardown() {
  if (dmChannel) {
    void supabase.removeChannel(dmChannel);
    dmChannel = null;
  }
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    const userId = data.session?.user?.id ?? null;
    if (userId) {
      useDirectMessages.setState({ myUserId: userId });
      void hydrateDMs(userId);
      subscribeDMs(userId);
    }
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      teardown();
      useDirectMessages.setState({ myUserId: null, messages: [], activePeerId: null });
      return;
    }
    if (session?.user) {
      const userId = session.user.id;
      const prev = useDirectMessages.getState().myUserId;
      if (prev !== userId) {
        teardown();
        useDirectMessages.setState({ myUserId: userId, messages: [] });
        void hydrateDMs(userId);
        subscribeDMs(userId);
      }
    }
  });
}
