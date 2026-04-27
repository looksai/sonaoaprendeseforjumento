import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type PresenceMode = "online" | "invisible";

export type SocialUser = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  bio?: string | null;
  online?: boolean;
  level?: string;
  region?: string;
  interests?: string[];
};

export type SocialRoom = {
  id: string;
  name: string;
  topic: string;
  vibe: "msn" | "uol" | "voice" | "regional";
  language: string;
  onlineCount: number;
};

export type SocialMessage = {
  id: string;
  roomId: string;
  senderId: string; // "me" if mine, or auth user id
  senderName: string;
  senderAvatar?: string | null;
  kind: "text" | "voice" | "system" | "sticker";
  content: string;
  createdAt: number;
};

type SocialTheme = {
  wallpaper: "stars" | "gradient" | "grid" | "waves";
  accent: "blue" | "pink" | "green" | "purple";
  chatFont: "clean" | "rounded" | "classic";
};

type SocialState = {
  users: SocialUser[];
  rooms: SocialRoom[];
  messages: SocialMessage[];
  followingIds: string[];
  blockedIds: string[];
  activeRoomId: string;
  theme: SocialTheme;
  // presence
  presenceMode: PresenceMode; // user's chosen visibility (online vs invisible)
  myUserId: string | null;
  follow: (id: string) => void;
  unfollow: (id: string) => void;
  block: (id: string) => void;
  unblock: (id: string) => void;
  setActiveRoom: (id: string) => void;
  sendMessage: (
    roomId: string,
    content: string,
    kind?: "text" | "voice" | "sticker",
  ) => void;
  setTheme: (patch: Partial<SocialTheme>) => void;
  setPresenceMode: (mode: PresenceMode) => Promise<void>;
  resetSocial: () => void;
};

const seedRooms: SocialRoom[] = [
  {
    id: "r-geral",
    name: "Bate-papo Geral",
    topic: "Chegue, puxe assunto e treine sem pressão.",
    vibe: "uol",
    language: "PT/EN",
    onlineCount: 0,
  },
  {
    id: "r-pronuncia",
    name: "Pronúncia sem vergonha",
    topic: "Repita frases curtas, receba ajuda e destrave a fala.",
    vibe: "voice",
    language: "EN/PT",
    onlineCount: 0,
  },
];

const initialTheme: SocialTheme = {
  wallpaper: "stars",
  accent: "blue",
  chatFont: "rounded",
};

export const useSocial = create<SocialState>()(
  persist(
    (set, get) => ({
      users: [],
      rooms: seedRooms,
      messages: [],
      followingIds: [],
      blockedIds: [],
      activeRoomId: "r-geral",
      theme: initialTheme,
      presenceMode: "online",
      myUserId: null,
      follow: (id) =>
        set((s) => ({ followingIds: Array.from(new Set([...s.followingIds, id])) })),
      unfollow: (id) =>
        set((s) => ({ followingIds: s.followingIds.filter((x) => x !== id) })),
      block: (id) =>
        set((s) => ({
          blockedIds: Array.from(new Set([...s.blockedIds, id])),
          followingIds: s.followingIds.filter((x) => x !== id),
        })),
      unblock: (id) =>
        set((s) => ({ blockedIds: s.blockedIds.filter((x) => x !== id) })),
      setActiveRoom: (id) => set({ activeRoomId: id }),
      sendMessage: (roomId, content, kind = "text") => {
        const trimmed = content.trim();
        if (!trimmed) return;

        const optimistic: SocialMessage = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          roomId,
          senderId: "me",
          senderName: "Você",
          kind,
          content: trimmed,
          createdAt: Date.now(),
        };
        set((s) => ({ messages: [...s.messages, optimistic] }));

        void (async () => {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData.session?.user;
            if (!user) return;
            // Pull display_name + avatar from profiles cache, fallback to auth metadata.
            const cachedProfile = get().users.find((u) => u.id === user.id);
            const senderName =
              cachedProfile?.name ||
              (user.user_metadata?.display_name as string) ||
              (user.email ? user.email.split("@")[0] : "Você");
            await supabase.from("room_messages").insert({
              room_id: roomId,
              sender_id: user.id,
              sender_name: senderName,
              kind: kind === "voice" ? "voice" : kind === "sticker" ? "sticker" : "text",
              content: trimmed,
            });
          } catch (err) {
            console.warn("[useSocial] cloud send failed", err);
          }
        })();
      },
      setTheme: (patch) => set((s) => ({ theme: { ...s.theme, ...patch } })),
      setPresenceMode: async (mode) => {
        set({ presenceMode: mode });
        const userId = get().myUserId;
        if (!userId) return;
        try {
          await supabase.from("user_status").upsert({
            user_id: userId,
            status: mode === "invisible" ? "invisible" : "online",
            last_seen: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("[useSocial] presence update failed", err);
        }
      },
      resetSocial: () =>
        set({
          users: [],
          rooms: seedRooms,
          messages: [],
          followingIds: [],
          blockedIds: [],
          activeRoomId: "r-geral",
          theme: initialTheme,
        }),
    }),
    {
      name: "csle-social-v6-local",
      // Only persist UI prefs, not data — data must come from realtime/cloud.
      partialize: (s) => ({
        followingIds: s.followingIds,
        blockedIds: s.blockedIds,
        theme: s.theme,
        presenceMode: s.presenceMode,
        activeRoomId: s.activeRoomId,
      }),
    },
  ),
);

// ============================================================================
// Realtime sync
// ============================================================================

let roomChannel: RealtimeChannel | null = null;
let profilesChannel: RealtimeChannel | null = null;
let statusChannel: RealtimeChannel | null = null;

interface CloudMessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  kind: string;
  content: string;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface StatusRow {
  user_id: string;
  status: "online" | "invisible" | "offline";
  last_seen: string;
}

function avatarFor(userId: string) {
  return useSocial.getState().users.find((u) => u.id === userId)?.avatarUrl ?? null;
}

function rowToMessage(row: CloudMessageRow, selfId: string | null): SocialMessage {
  const isMine = selfId !== null && row.sender_id === selfId;
  const validKind: SocialMessage["kind"] =
    row.kind === "voice" || row.kind === "system" || row.kind === "sticker"
      ? row.kind
      : "text";
  return {
    id: `cloud-${row.id}`,
    roomId: row.room_id,
    senderId: isMine ? "me" : row.sender_id,
    senderName: isMine ? "Você" : row.sender_name,
    senderAvatar: isMine ? null : avatarFor(row.sender_id),
    kind: validKind,
    content: row.content,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function mergeMessage(msg: SocialMessage) {
  const existing = useSocial.getState().messages;
  if (existing.some((m) => m.id === msg.id)) return;
  // De-dup against optimistic local sends (same content + roomId, recent, mine).
  const filtered =
    msg.senderId === "me"
      ? existing.filter(
          (m) =>
            !(
              m.id.startsWith("local-") &&
              m.roomId === msg.roomId &&
              m.content === msg.content &&
              Math.abs(m.createdAt - msg.createdAt) < 15000
            ),
        )
      : existing;
  useSocial.setState({ messages: [...filtered, msg] });
}

async function hydrateMessages(selfId: string | null) {
  try {
    const { data, error } = await supabase
      .from("room_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      console.warn("[useSocial] hydrate messages failed", error);
      return;
    }
    if (!Array.isArray(data)) return;
    const cloudMsgs = (data as CloudMessageRow[]).map((row) =>
      rowToMessage(row, selfId),
    );
    const map = new Map<string, SocialMessage>();
    cloudMsgs.forEach((m) => map.set(m.id, m));
    useSocial.setState({ messages: Array.from(map.values()) });
  } catch (err) {
    console.warn("[useSocial] hydrate messages exception", err);
  }
}

async function hydrateProfiles() {
  try {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, handle, display_name, avatar_url, bio")
      .limit(500);
    if (pErr || !Array.isArray(profiles)) {
      if (pErr) console.warn("[useSocial] hydrate profiles failed", pErr);
      return;
    }
    const { data: statuses } = await supabase
      .from("user_status")
      .select("user_id, status, last_seen");
    const onlineSet = new Set(
      (statuses ?? [])
        .filter((s) => s.status === "online")
        .map((s) => s.user_id),
    );
    const users: SocialUser[] = (profiles as ProfileRow[]).map((p) => ({
      id: p.user_id,
      name: p.display_name,
      handle: p.handle,
      avatarUrl: p.avatar_url,
      bio: p.bio,
      online: onlineSet.has(p.user_id),
    }));
    useSocial.setState({ users });
  } catch (err) {
    console.warn("[useSocial] hydrate profiles exception", err);
  }
}

function applyProfileChange(row: ProfileRow) {
  const existing = useSocial.getState().users;
  const idx = existing.findIndex((u) => u.id === row.user_id);
  const next: SocialUser = {
    id: row.user_id,
    name: row.display_name,
    handle: row.handle,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    online: idx >= 0 ? existing[idx].online : false,
  };
  if (idx >= 0) {
    const copy = [...existing];
    copy[idx] = { ...copy[idx], ...next };
    useSocial.setState({ users: copy });
  } else {
    useSocial.setState({ users: [...existing, next] });
  }
}

function applyStatusChange(row: StatusRow) {
  const existing = useSocial.getState().users;
  const idx = existing.findIndex((u) => u.id === row.user_id);
  if (idx < 0) return;
  const copy = [...existing];
  copy[idx] = { ...copy[idx], online: row.status === "online" };
  useSocial.setState({ users: copy });
}

function subscribeRealtime(selfId: string | null) {
  if (!roomChannel) {
    roomChannel = supabase
      .channel("public:room_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages" },
        (payload) => {
          const row = payload.new as CloudMessageRow;
          mergeMessage(rowToMessage(row, selfId));
        },
      )
      .subscribe();
  }

  if (!profilesChannel) {
    profilesChannel = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload.new as ProfileRow | undefined;
          if (row?.user_id) applyProfileChange(row);
        },
      )
      .subscribe();
  }

  if (!statusChannel) {
    statusChannel = supabase
      .channel("public:user_status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_status" },
        (payload) => {
          const row = (payload.new ?? payload.old) as StatusRow | undefined;
          if (row?.user_id) applyStatusChange(row);
        },
      )
      .subscribe();
  }
}

function teardownRealtime() {
  if (roomChannel) {
    void supabase.removeChannel(roomChannel);
    roomChannel = null;
  }
  if (profilesChannel) {
    void supabase.removeChannel(profilesChannel);
    profilesChannel = null;
  }
  if (statusChannel) {
    void supabase.removeChannel(statusChannel);
    statusChannel = null;
  }
}

// Presence: write online on app load, offline on unload, inactivity → offline.
async function pushPresence(userId: string, status: "online" | "invisible" | "offline") {
  try {
    await supabase.from("user_status").upsert({
      user_id: userId,
      status,
      last_seen: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[useSocial] pushPresence failed", err);
  }
}

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
const INACTIVITY_MS = 5 * 60 * 1000; // 5 min

function resetInactivityTimer(userId: string) {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    void pushPresence(userId, "offline");
  }, INACTIVITY_MS);
}

function setupInactivityHandlers(userId: string) {
  if (typeof window === "undefined") return;
  resetInactivityTimer(userId);
  const onActivity = () => {
    const mode = useSocial.getState().presenceMode;
    void pushPresence(userId, mode === "invisible" ? "invisible" : "online");
    resetInactivityTimer(userId);
  };
  ["mousemove", "keydown", "click", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, onActivity, { passive: true }),
  );
  window.addEventListener("beforeunload", () => {
    void pushPresence(userId, "offline");
  });
  document.addEventListener("visibilitychange", () => {
    const mode = useSocial.getState().presenceMode;
    if (document.hidden) {
      void pushPresence(userId, "offline");
    } else {
      void pushPresence(userId, mode === "invisible" ? "invisible" : "online");
      resetInactivityTimer(userId);
    }
  });
}

let presenceBootstrapped = false;
async function bootstrapForUser(userId: string) {
  useSocial.setState({ myUserId: userId });
  const mode = useSocial.getState().presenceMode;
  await pushPresence(userId, mode === "invisible" ? "invisible" : "online");
  if (!presenceBootstrapped) {
    setupInactivityHandlers(userId);
    presenceBootstrapped = true;
  }
}

if (typeof window !== "undefined") {
  void hydrateProfiles();
  supabase.auth.getSession().then(({ data }) => {
    const userId = data.session?.user?.id ?? null;
    void hydrateMessages(userId);
    subscribeRealtime(userId);
    if (userId) void bootstrapForUser(userId);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      teardownRealtime();
      useSocial.setState({ myUserId: null });
      return;
    }
    if (session?.user) {
      const userId = session.user.id;
      const prev = useSocial.getState().myUserId;
      if (prev !== userId) {
        teardownRealtime();
        void hydrateMessages(userId);
        subscribeRealtime(userId);
        void hydrateProfiles();
      } else {
        subscribeRealtime(userId);
      }
      void bootstrapForUser(userId);
    }
  });
}

export function getSocialAccentClass(accent: SocialTheme["accent"]) {
  if (accent === "pink") return "from-pink-500/30 to-fuchsia-500/10 border-pink-400/30";
  if (accent === "green")
    return "from-emerald-500/30 to-lime-500/10 border-emerald-400/30";
  if (accent === "purple")
    return "from-violet-500/30 to-indigo-500/10 border-violet-400/30";
  return "from-sky-500/30 to-cyan-500/10 border-sky-400/30";
}
