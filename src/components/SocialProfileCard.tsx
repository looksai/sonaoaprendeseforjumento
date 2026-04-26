import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SocialUser } from "@/store/useSocial";
import { useSocial } from "@/store/useSocial";
import { Ban, MessageCircle, UserPlus, UserMinus, Video } from "lucide-react";
import { toast } from "sonner";

export function SocialProfileCard({ user }: { user: SocialUser }) {
  const { followingIds, blockedIds, follow, unfollow, block, unblock } = useSocial();
  const following = followingIds.includes(user.id);
  const blocked = blockedIds.includes(user.id);
  const interests = user.interests ?? [];

  return (
    <div className={`surface-card rounded-2xl border p-4 ${blocked ? "border-destructive/40 opacity-60" : "border-border/70"}`}>
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-cta text-lg font-black text-primary-foreground shadow-glow">
          {user.name.charAt(0)}
          {user.online && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-success" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold text-foreground">{user.name}</h3>
            {user.level && <Badge variant="secondary" className="rounded-full text-[0.62rem]">{user.level}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">@{user.handle}{user.region ? ` · ${user.region}` : ""}</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{user.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {interests.slice(0, 4).map((interest) => (
              <span key={interest} className="rounded-full border border-border bg-background/40 px-2 py-1 text-[0.68rem] text-muted-foreground">{interest}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant={following ? "outline" : "default"} className="rounded-xl" onClick={() => following ? unfollow(user.id) : follow(user.id)}>
          {following ? <UserMinus className="mr-1.5 h-3.5 w-3.5" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
          {following ? "Seguindo" : "Seguir"}
        </Button>
        <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => toast.info("Videochamada paga fica para a camada social real/Supabase.")}>
          <Video className="mr-1.5 h-3.5 w-3.5" /> Chamada
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => toast.success(`Convite de conversa enviado para ${user.name}.`) }>
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Chat
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:text-destructive" onClick={() => blocked ? unblock(user.id) : block(user.id)}>
          <Ban className="mr-1.5 h-3.5 w-3.5" /> {blocked ? "Desbloq." : "Bloquear"}
        </Button>
      </div>
    </div>
  );
}
