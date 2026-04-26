import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ReactionTarget = "room" | "dm";

export type MessageReaction = {
  id: string;
  targetType: ReactionTarget;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: number;
};

type ReactionState = {
  myUserId: string | null;
  reactions: MessageReaction[];
  hydrate: () => Promise<void>;
  toggle: (targetType: ReactionTarget, messageId: string, emoji: string) => Promise<void>;
};

type ReactionRow = {
  id: string;
  target_type: ReactionTarget;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

function cleanMessageId(id: string) {
  return id.startsWith("cloud-") ? id.slice("cloud-".length) : id;
}

function rowToReaction(row: ReactionRow): MessageReaction {
  return {
    id: row.id,
    targetType: row.target_type,
    messageId: row.message_id,
    userId: row.user_id,
    emoji: row.emoji,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function upsertReaction(row: ReactionRow) {
  const reaction = rowToReaction(row);
  const existing = useMessageReactions.getState().reactions;
  const idx = existing.findIndex((r) => r.id === reaction.id);
  if (idx >= 0) {
    const copy = [...existing];
    copy[idx] = reaction;
    useMessageReactions.setState({ reactions: copy });
  } else {
    useMessageReactions.setState({ reactions: [...existing, reaction] });
  }
}

function removeReaction(row: Partial<ReactionRow>) {
  if (!row.id) return;
  useMessageReactions.setState((s) => ({
    reactions: s.reactions.filter((r) => r.id !== row.id),
  }));
}

export const useMessageReactions = create<ReactionState>()((set, get) => ({
  myUserId: null,
  reactions: [],
  hydrate: async () => {
    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(2000);
      if (error) {
        console.warn("[useMessageReactions] hydrate failed", error);
        return;
      }
      set({ reactions: ((data ?? []) as ReactionRow[]).map(rowToReaction) });
    } catch (err) {
      console.warn("[useMessageReactions] hydrate exception", err);
    }
  },
  toggle: async (targetType, rawMessageId, emoji) => {
    const messageId = cleanMessageId(rawMessageId);
    if (!messageId || rawMessageId.startsWith("local-")) return;
    const myId = get().myUserId;
    if (!myId) return;
    const existing = get().reactions.find(
      (r) =>
        r.targetType === targetType &&
        r.messageId === messageId &&
        r.userId === myId &&
        r.emoji === emoji,
    );
    try {
      if (existing) {
        await supabase.from("message_reactions").delete().eq("id", existing.id);
        removeReaction({ id: existing.id });
      } else {
        const { data, error } = await supabase
          .from("message_reactions")
          .insert({
            target_type: targetType,
            message_id: messageId,
            user_id: myId,
            emoji,
          })
          .select("*")
          .single();
        if (error) throw error;
        if (data) upsertReaction(data as ReactionRow);
      }
    } catch (err) {
      console.warn("[useMessageReactions] toggle failed", err);
    }
  },
}));

let channel: RealtimeChannel | null = null;

function subscribe() {
  if (channel) return;
  channel = supabase
    .channel("public:message_reactions")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "message_reactions" },
      (payload) => upsertReaction(payload.new as ReactionRow),
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "message_reactions" },
      (payload) => removeReaction(payload.old as Partial<ReactionRow>),
    )
    .subscribe();
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    useMessageReactions.setState({ myUserId: data.session?.user?.id ?? null });
    void useMessageReactions.getState().hydrate();
    subscribe();
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      useMessageReactions.setState({ myUserId: null, reactions: [] });
      return;
    }
    if (session?.user) {
      useMessageReactions.setState({ myUserId: session.user.id });
      void useMessageReactions.getState().hydrate();
      subscribe();
    }
  });
}

export function reactionsFor(targetType: ReactionTarget, rawMessageId: string) {
  const messageId = cleanMessageId(rawMessageId);
  return useMessageReactions
    .getState()
    .reactions.filter((r) => r.targetType === targetType && r.messageId === messageId);
}
