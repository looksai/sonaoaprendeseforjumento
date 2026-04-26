import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useMemo, useState, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
import { SocialRoomChat } from "@/components/SocialRoomChat";
import { DirectMessagePanel } from "@/components/DirectMessagePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSocial, type SocialUser } from "@/store/useSocial";
import { useDirectMessages } from "@/store/useDirectMessages";
import {
  Ban,
  Eye,
  EyeOff,
  MessageCircle,
  Search,
  Shield,
  UserPlus,
  UserMinus,
  Users,
  Volume2,
} from "lucide-react";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "CSLE — Comunidade" },
      { name: "description", content: "Bate-papo geral, MSN privado e presença ao vivo." },
    ],
  }),
  component: ComunidadeGuarded,
});

function Comunidade() {
  const social = useSocial();
  const dm = useDirectMessages();
  const [query, setQuery] = useState("");
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return social.users
      .filter((u) => u.id !== social.myUserId && !social.blockedIds.includes(u.id))
      .filter((u) =>
        !q ? true : `${u.name} ${u.handle} ${u.bio ?? ""}`.toLowerCase().includes(q),
      )
      .sort((a, b) => Number(!!b.online) - Number(!!a.online));
  }, [query, social.users, social.blockedIds, social.myUserId]);

  const onlineCount = social.users.filter((u) => u.online).length;

  return (
    <AppShell wide>
      <div className="v6-page-pad pt-7 pb-4">
        <section className="v6-hero p-5 sm:p-6">
          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="v6-section-title">Social · MSN/UOL ao vivo</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                Bate-papo Geral + MSN da Galera
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/72">
                Conversa pública em tempo real e privadinhas com a galera, com emojis e stickers.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 p-1">
                <button
                  onClick={() => social.setPresenceMode("online")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-smooth ${
                    social.presenceMode === "online"
                      ? "bg-success text-white"
                      : "text-foreground/70 hover:bg-primary/8"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" /> Online
                </button>
                <button
                  onClick={() => social.setPresenceMode("invisible")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-smooth ${
                    social.presenceMode === "invisible"
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-primary/8"
                  }`}
                >
                  <EyeOff className="h-3.5 w-3.5" /> Invisível
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 xl:w-[25rem]">
              <Metric icon={Users} label="online" value={onlineCount} />
              <Metric icon={MessageCircle} label="salas" value={social.rooms.length} />
              <Metric icon={Volume2} label="DMs" value={dm.messages.length} />
              <Metric icon={Shield} label="block" value={social.blockedIds.length} />
            </div>
          </div>
        </section>
      </div>

      <div className="v6-page-pad grid gap-4 pb-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="mb-3 grid w-full grid-cols-2 rounded-2xl bg-white/70 p-1">
              <TabsTrigger value="geral" className="rounded-xl text-sm font-black">
                Bate-papo Geral
              </TabsTrigger>
              <TabsTrigger value="msn" className="rounded-xl text-sm font-black">
                MSN da Galera
              </TabsTrigger>
            </TabsList>
            <TabsContent value="geral" className="mt-0">
              <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
                <aside className="msn-window">
                  <div className="msn-titlebar px-4 py-3">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
                      Salas
                    </div>
                    <div className="text-base font-black">Ao vivo</div>
                  </div>
                  <div className="space-y-2 p-3">
                    {social.rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => social.setActiveRoom(room.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-smooth ${
                          social.activeRoomId === room.id
                            ? "border-primary bg-primary/12 shadow-soft"
                            : "border-primary/10 bg-white/55 hover:border-primary/35 hover:bg-white/80"
                        }`}
                      >
                        <div className="truncate text-sm font-black text-foreground">{room.name}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-foreground/62">
                          {room.topic}
                        </p>
                      </button>
                    ))}
                  </div>
                </aside>
                <SocialRoomChat />
              </div>
            </TabsContent>
            <TabsContent value="msn" className="mt-0">
              <DirectMessagePanel />
            </TabsContent>
          </Tabs>
        </main>

        <aside className="space-y-4">
          <div className="msn-window">
            <div className="msn-titlebar px-4 py-3">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
                Contatos online
              </div>
              <div className="text-lg font-black">Galera agora</div>
            </div>
            <div className="border-b border-primary/10 bg-white/70 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white/80 px-3 py-2">
                <Search className="h-4 w-4 text-primary" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar contato..."
                  className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="max-h-[590px] overflow-y-auto p-2">
              {filteredUsers.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-foreground/55">
                  Sem contatos ainda. Convide amigos! ✨
                </div>
              )}
              {filteredUsers.map((user) => (
                <OnlineUserRow key={user.id} user={user} onChat={() => dm.setActivePeer(user.id)} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function OnlineUserRow({ user, onChat }: { user: SocialUser; onChat: () => void }) {
  const { followingIds, blockedIds, follow, unfollow, block, unblock } = useSocial();
  const following = followingIds.includes(user.id);
  const blocked = blockedIds.includes(user.id);

  return (
    <div className={`msn-row ${blocked ? "opacity-55" : ""}`}>
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback className="bg-gradient-cta text-sm font-black text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white ${
            user.online ? "bg-success" : "bg-muted-foreground/35"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-black text-foreground">{user.name}</span>
          {user.online && (
            <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[0.55rem]">
              online
            </Badge>
          )}
        </div>
        <div className="truncate text-[0.68rem] text-foreground/55">@{user.handle}</div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <Button size="icon" className="h-8 w-8 rounded-xl" onClick={onChat} aria-label="Conversar">
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant={following ? "default" : "outline"}
          className="h-8 w-8 rounded-xl"
          onClick={() => (following ? unfollow(user.id) : follow(user.id))}
          aria-label={following ? "Deixar de seguir" : "Seguir"}
        >
          {following ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-xl border-destructive/30 text-destructive hover:text-destructive"
          onClick={() => (blocked ? unblock(user.id) : block(user.id))}
          aria-label={blocked ? "Desbloquear" : "Bloquear"}
        >
          <Ban className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/55 bg-white/72 p-3 shadow-soft backdrop-blur-sm">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 text-[0.58rem] font-black uppercase tracking-wider text-foreground/50">
        {label}
      </div>
      <div className="text-xl font-black text-foreground">{value}</div>
    </div>
  );
}

export default Comunidade;

function ComunidadeGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Comunidade />
    </RequireAuth>
  );
}
