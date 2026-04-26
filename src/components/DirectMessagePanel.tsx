import { useEffect, useMemo, useRef, useState } from "react";
import { useDirectMessages } from "@/store/useDirectMessages";
import { useSocial } from "@/store/useSocial";
import { ChatInputBar } from "@/components/ChatInputBar";
import { MessageReactions } from "@/components/MessageReactions";
import { sendTypingSignal, startChatTypingBridge, useChatUI } from "@/store/useChatUI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("data:image/");
}

function conversationKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

export function DirectMessagePanel() {
  const dm = useDirectMessages();
  const social = useSocial();
  const { typing } = useChatUI();
  const myId = dm.myUserId;
  const [query, setQuery] = useState("");
  const [stickToBottom, setStickToBottom] = useState(true);
  const [unreadInThread, setUnreadInThread] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const userMap = useMemo(() => {
    const map = new Map(social.users.map((u) => [u.id, u]));
    return map;
  }, [social.users]);

  useEffect(() => {
    startChatTypingBridge(myId);
  }, [myId]);

  // Build conversation list (peerId → last message + unread count)
  const conversations = useMemo(() => {
    if (!myId) return [];
    const byPeer = new Map<
      string,
      { peerId: string; last: number; unread: number; preview: string }
    >();
    dm.messages.forEach((m) => {
      const peerId = m.senderId === myId ? m.recipientId : m.senderId;
      if (social.blockedIds.includes(peerId)) return;
      const isUnread = m.senderId !== myId && !m.readAt;
      const preview = m.kind === "sticker" ? "🖼️ Figurinha" : m.content;
      const cur = byPeer.get(peerId);
      if (!cur || m.createdAt > cur.last) {
        byPeer.set(peerId, {
          peerId,
          last: m.createdAt,
          unread: (cur?.unread ?? 0) + (isUnread ? 1 : 0),
          preview,
        });
      } else {
        cur.unread += isUnread ? 1 : 0;
      }
    });
    return Array.from(byPeer.values()).sort((a, b) => b.last - a.last);
  }, [dm.messages, myId, social.blockedIds]);

  const peerOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return social.users
      .filter((u) => u.id !== myId && !social.blockedIds.includes(u.id))
      .filter((u) =>
        !q ? true : `${u.name} ${u.handle} ${u.bio ?? ""}`.toLowerCase().includes(q),
      )
      .sort((a, b) => Number(!!b.online) - Number(!!a.online));
  }, [social.users, social.blockedIds, myId, query]);

  const activePeer = dm.activePeerId ? userMap.get(dm.activePeerId) : null;
  const myProfile = myId ? userMap.get(myId) : null;

  const threadMessages = useMemo(() => {
    if (!myId || !dm.activePeerId) return [];
    return dm.messages
      .filter(
        (m) =>
          (m.senderId === myId && m.recipientId === dm.activePeerId) ||
          (m.senderId === dm.activePeerId && m.recipientId === myId),
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [dm.messages, myId, dm.activePeerId]);

  const typingNames = useMemo(() => {
    const now = Date.now();
    if (!dm.activePeerId) return [];
    return typing
      .filter((t) =>
        t.scope === "dm" &&
        !!myId &&
        t.key === conversationKey(myId, dm.activePeerId!) &&
        t.expiresAt > now,
      )
      .map((t) => t.name)
      .slice(0, 2);
  }, [typing, dm.activePeerId, myId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom) {
      el.scrollTop = el.scrollHeight;
      setUnreadInThread(0);
    } else {
      setUnreadInThread((n) => n + 1);
    }
  }, [threadMessages.length, dm.activePeerId, stickToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStickToBottom(nearBottom);
    if (nearBottom) setUnreadInThread(0);
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
    setUnreadInThread(0);
  };

  if (!myId) {
    return (
      <div className="msn-window flex min-h-[680px] items-center justify-center p-8 text-center text-sm text-foreground/60">
        Faça login para abrir suas conversas privadas.
      </div>
    );
  }

  return (
    <div className="msn-window grid min-h-[680px] grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
      {/* Sidebar — contacts + conversations */}
      <aside className={`border-r border-primary/10 bg-white/70 ${dm.activePeerId ? "hidden md:block" : "block"}`}>
        <div className="msn-titlebar px-4 py-3">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
            MSN da Galera
          </div>
          <div className="text-lg font-black">Conversas</div>
        </div>
        <div className="border-b border-primary/10 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar contato..."
              className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto p-2">
          {conversations.length > 0 && (
            <div className="mb-1 px-2 text-[0.6rem] font-black uppercase tracking-wider text-foreground/45">
              Recentes
            </div>
          )}
          {conversations.map((conv) => {
            const u = userMap.get(conv.peerId);
            const name = u?.name ?? "Usuário";
            return (
              <button
                key={conv.peerId}
                onClick={() => dm.setActivePeer(conv.peerId)}
                className={`flex w-full items-center gap-2 rounded-xl p-2 text-left transition-smooth hover:bg-primary/8 ${dm.activePeerId === conv.peerId ? "bg-primary/12" : ""}`}
              >
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    {u?.avatarUrl && <AvatarImage src={u.avatarUrl} alt={name} />}
                    <AvatarFallback className="bg-gradient-cta text-xs font-black text-primary-foreground">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {u?.online && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="truncate text-sm font-black text-foreground">{name}</div>
                    {conv.unread > 0 && (
                      <span className="rounded-full bg-primary px-1.5 py-0 text-[0.6rem] font-black text-primary-foreground">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[0.7rem] text-foreground/55">{conv.preview}</div>
                </div>
              </button>
            );
          })}

          <div className="mt-3 mb-1 px-2 text-[0.6rem] font-black uppercase tracking-wider text-foreground/45">
            Toda a galera
          </div>
          {peerOptions.map((u) => (
            <button
              key={u.id}
              onClick={() => dm.setActivePeer(u.id)}
              className={`flex w-full items-center gap-2 rounded-xl p-2 text-left transition-smooth hover:bg-primary/8 ${dm.activePeerId === u.id ? "bg-primary/12" : ""}`}
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                  <AvatarFallback className="bg-gradient-cta text-xs font-black text-primary-foreground">
                    {u.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {u.online && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-foreground">{u.name}</div>
                <div className="truncate text-[0.7rem] text-foreground/55">@{u.handle}</div>
              </div>
            </button>
          ))}
          {peerOptions.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-foreground/55">
              Nenhum contato ainda. Convide alguém pra entrar! ✨
            </div>
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`flex flex-col ${dm.activePeerId ? "block" : "hidden md:flex"}`}>
        {!activePeer ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-foreground/55">
            Escolha alguém da galera para abrir uma conversa privada. 💬
          </div>
        ) : (
          <>
            <div className="msn-titlebar flex items-center gap-2 px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-white md:hidden"
                onClick={() => dm.setActivePeer(null)}
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Avatar className="h-9 w-9">
                  {activePeer.avatarUrl && (
                    <AvatarImage src={activePeer.avatarUrl} alt={activePeer.name} />
                  )}
                  <AvatarFallback className="bg-white/30 text-xs font-black text-white">
                    {activePeer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {activePeer.online && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-white">{activePeer.name}</div>
                <div className="text-[0.65rem] font-bold uppercase tracking-wider text-white/75">
                  {activePeer.online ? "online agora" : "offline"} · @{activePeer.handle}
                </div>
              </div>
            </div>

            <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 space-y-2 overflow-y-auto bg-white/45 p-4">
              {threadMessages.length === 0 && (
                <div className="flex h-full items-center justify-center p-4 text-center">
                  <div className="max-w-sm rounded-3xl border border-primary/10 bg-white/90 p-5 shadow-soft">
                    <Sparkles className="mx-auto h-6 w-6 text-primary" />
                    <div className="mt-2 text-base font-black text-foreground">Primeira mensagem</div>
                    <p className="mt-1 text-sm text-foreground/60">
                      Chama {activePeer.name.split(" ")[0]} pra praticar dois minutinhos.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {[
                        "Oi! Bora praticar inglês rapidinho? 👋",
                        "Me ajuda com uma frase em inglês?",
                        "Qual série você está usando pra estudar? 🎬",
                      ].map((msg) => (
                        <button
                          key={msg}
                          type="button"
                          onClick={() => dm.send(activePeer.id, msg, "text")}
                          className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary transition-bounce active:scale-95"
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {threadMessages.map((m) => {
                const mine = m.senderId === myId;
                const sticker =
                  m.kind === "sticker" ||
                  (m.content.length <= 4 && /\p{Emoji}/u.test(m.content));
                const stickerImage = sticker && isImageUrl(m.content);
                return (
                  <div
                    key={m.id}
                    className={`animate-message-in flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex max-w-[78%] flex-col">
                      <div
                        className={`${
                          sticker
                            ? "bg-transparent px-1 py-0 text-5xl leading-none"
                            : `rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                                mine
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-white/92 text-foreground"
                              }`
                        }`}
                      >
                        {stickerImage ? (
                          <img
                            src={m.content}
                            alt="figurinha"
                            className="max-h-40 max-w-40 rounded-2xl object-contain drop-shadow-md"
                          />
                        ) : (
                          m.content
                        )}
                      </div>
                      <MessageReactions targetType="dm" messageId={m.id} align={mine ? "right" : "left"} />
                      <div
                        className={`mt-0.5 flex items-center gap-1 text-[0.6rem] text-foreground/45 ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <span>{timeLabel(m.createdAt)}</span>
                        {mine && <span aria-label={m.readAt ? "Lida" : "Enviada"}>{m.readAt ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingNames.length > 0 && (
                <div className="flex justify-start">
                  <div className="rounded-full bg-white/92 px-3 py-1.5 text-[0.72rem] font-bold text-foreground/55 shadow-sm">
                    {typingNames.join(", ")} {typingNames.length === 1 ? "está" : "estão"} digitando…
                  </div>
                </div>
              )}
              {!stickToBottom && unreadInThread > 0 && (
                <button
                  onClick={jumpToBottom}
                  className="sticky bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-lg transition-bounce active:scale-95"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  {unreadInThread} nova{unreadInThread > 1 ? "s" : ""}
                </button>
              )}
            </div>

            <ChatInputBar
              onSend={(content, kind) => dm.send(activePeer.id, content, kind)}
              onTyping={() => {
                if (!myId) return;
                sendTypingSignal({
                  scope: "dm",
                  key: conversationKey(myId, activePeer.id),
                  userId: myId,
                  name: myProfile?.name ?? "Alguém",
                });
              }}
              placeholder={`Mensagem para ${activePeer.name}...`}
              autoFocus
            />
          </>
        )}
      </section>
    </div>
  );
}
