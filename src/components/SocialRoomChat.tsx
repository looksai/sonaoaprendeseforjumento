import { useEffect, useMemo, useRef, useState } from "react";
import { useSocial, type SocialMessage } from "@/store/useSocial";
import { ChatInputBar } from "@/components/ChatInputBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageReactions } from "@/components/MessageReactions";
import { sendTypingSignal, startChatTypingBridge, useChatUI } from "@/store/useChatUI";
import { ChevronDown } from "lucide-react";

const DAILY_PROMPTS = [
  "Qual série você está usando pra aprender hoje? 🎬",
  "Manda uma frase em inglês que você aprendeu hoje. 🔥",
  "Qual palavra te travou hoje? A galera ajuda.",
  "Descreve seu dia em uma frase simples em inglês.",
  "Qual música te fez lembrar de inglês hoje? 🎵",
];

function timeLabel(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("data:image/");
}

function isStickerOnly(msg: SocialMessage) {
  return msg.kind === "sticker" || (msg.content.length <= 4 && /\p{Emoji}/u.test(msg.content));
}

function promptForToday() {
  const dayKey = Math.floor(Date.now() / 86_400_000);
  return DAILY_PROMPTS[dayKey % DAILY_PROMPTS.length];
}

export function SocialRoomChat() {
  const social = useSocial();
  const { typing } = useChatUI();
  const activeRoom =
    social.rooms.find((r) => r.id === social.activeRoomId) ?? social.rooms[0];

  const visibleMessages = useMemo(() => {
    return social.messages
      .filter((m) => m.roomId === activeRoom.id && !social.blockedIds.includes(m.senderId))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [social.messages, activeRoom.id, social.blockedIds]);

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl?: string | null }>();
    social.users.forEach((u) => map.set(u.id, { name: u.name, avatarUrl: u.avatarUrl }));
    return map;
  }, [social.users]);

  const typingNames = useMemo(() => {
    const now = Date.now();
    return typing
      .filter((t) => t.scope === "room" && t.key === activeRoom.id && t.expiresAt > now)
      .map((t) => t.name)
      .slice(0, 2);
  }, [typing, activeRoom.id]);

  const myProfile = useMemo(() => {
    const id = social.myUserId;
    return id ? social.users.find((u) => u.id === id) : null;
  }, [social.myUserId, social.users]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    startChatTypingBridge(social.myUserId);
  }, [social.myUserId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom) {
      el.scrollTop = el.scrollHeight;
      setUnread(0);
    } else {
      setUnread((u) => u + 1);
    }
  }, [visibleMessages.length, stickToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStickToBottom(nearBottom);
    if (nearBottom) setUnread(0);
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
    setUnread(0);
  };

  const shareDailyPrompt = () => {
    social.sendMessage(activeRoom.id, promptForToday(), "text");
  };

  return (
    <div className="msn-window flex min-h-[680px] flex-col">
      <div className="msn-titlebar px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/75">
              Sala aberta
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
              {activeRoom.name}
            </h2>
            <p className="mt-1 text-sm text-white/78">{activeRoom.topic}</p>
          </div>
          <div className="rounded-full bg-white/18 px-3 py-1 text-[0.72rem] font-black text-white">
            {social.users.filter((u) => u.online).length} online
          </div>
        </div>
      </div>

      <div className="border-b border-primary/10 bg-white/86 p-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white/92 p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[0.64rem] font-black uppercase tracking-[0.18em] text-primary/75">
              Pergunta do dia
            </div>
            <div className="mt-1 text-sm font-bold text-foreground">{promptForToday()}</div>
          </div>
          <button
            type="button"
            onClick={shareDailyPrompt}
            className="rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground shadow-soft transition-bounce active:scale-95"
          >
            Responder no chat
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 space-y-2 overflow-y-auto bg-white/45 p-4"
        >
          {visibleMessages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-sm text-foreground/55">
              Ainda sem mensagens nessa sala. Manda um oi! 👋
            </div>
          )}
          {visibleMessages.map((message, i) => {
            const mine = message.senderId === "me";
            const system = message.kind === "system";
            const prev = visibleMessages[i - 1];
            const groupedWithPrev =
              prev &&
              prev.senderId === message.senderId &&
              message.createdAt - prev.createdAt < 60_000;
            const profile = userMap.get(message.senderId);
            const displayName = mine ? "Você" : profile?.name ?? message.senderName;
            const avatar = mine ? null : message.senderAvatar ?? profile?.avatarUrl;
            const sticker = isStickerOnly(message);
            const stickerImage = sticker && isImageUrl(message.content);

            if (system) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="rounded-full bg-primary/8 px-3 py-1 text-[0.7rem] font-semibold text-foreground/62">
                    {message.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className={`animate-message-in flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine && (
                  <div className={`w-8 shrink-0 ${groupedWithPrev ? "invisible" : ""}`}>
                    <Avatar className="h-8 w-8">
                      {avatar && <AvatarImage src={avatar} alt={displayName} />}
                      <AvatarFallback className="bg-gradient-cta text-[0.7rem] font-black text-primary-foreground">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && !groupedWithPrev && (
                    <div className="mb-0.5 text-[0.68rem] font-black uppercase tracking-wide text-primary/80">
                      {displayName}
                    </div>
                  )}
                  <div
                    className={`${
                      sticker
                        ? "bg-transparent px-1 py-0 text-5xl leading-none"
                        : `rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                            mine ? "bg-primary text-primary-foreground" : "bg-white/92 text-foreground"
                          }`
                    }`}
                  >
                    {message.kind === "voice" && <span className="mr-1">🎙️</span>}
                    {stickerImage ? (
                      <img
                        src={message.content}
                        alt="figurinha"
                        className="max-h-40 max-w-40 rounded-2xl object-contain drop-shadow-md"
                      />
                    ) : (
                      message.content
                    )}
                  </div>
                  <MessageReactions
                    targetType="room"
                    messageId={message.id}
                    align={mine ? "right" : "left"}
                  />
                  <div className={`mt-0.5 flex items-center gap-1 text-[0.6rem] text-foreground/45 ${mine ? "justify-end" : "justify-start"}`}>
                    <span>{timeLabel(message.createdAt)}</span>
                    {mine && <span aria-label="Enviado">✓</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {typingNames.length > 0 && (
            <div className="flex justify-start pl-10">
              <div className="rounded-full bg-white/92 px-3 py-1.5 text-[0.72rem] font-bold text-foreground/55 shadow-sm">
                {typingNames.join(", ")} {typingNames.length === 1 ? "está" : "estão"} digitando…
              </div>
            </div>
          )}
        </div>

        {!stickToBottom && unread > 0 && (
          <button
            onClick={jumpToBottom}
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-lg transition-bounce active:scale-95"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            {unread} nova{unread > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <ChatInputBar
        onSend={(content, kind) => social.sendMessage(activeRoom.id, content, kind)}
        onTyping={() => {
          if (!social.myUserId) return;
          sendTypingSignal({
            scope: "room",
            key: activeRoom.id,
            userId: social.myUserId,
            name: myProfile?.name ?? "Alguém",
          });
        }}
        placeholder="Diga algo na sala..."
      />
    </div>
  );
}
