import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import {
  BookOpen,
  Camera,
  Clapperboard,
  Crown,
  Flame,
  Gamepad2,
  Gem,
  Heart,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/store/useProgress";
import { useGamification } from "@/store/useGamification";
import { useSocial } from "@/store/useSocial";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Last Course — Perfil social" },
      {
        name: "description",
        content:
          "Seu perfil social no Last Course: amigos, progresso, conquistas e identidade de aprendizado.",
      },
    ],
  }),
  component: PerfilGuarded,
});

function Perfil() {
  const progress = useProgress();
  const gamification = useGamification();
  const social = useSocial();
  const profile = progress.profile;
  const [publicBio, setPublicBio] = useState(profile?.motivation ?? "");

  if (!profile) {
    return (
      <AppShell>
        <div className="px-5 pt-12 text-center">
          <p className="text-muted-foreground">Faça o onboarding primeiro.</p>
          <Link to="/onboarding">
            <Button className="mt-4 rounded-2xl">Começar onboarding</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const following = social.users.filter((user) => social.followingIds.includes(user.id));
  const onlineFriends = following.filter((user) => user.online);
  const friendsPreview = following.length ? following : social.users.slice(0, 4);
  const levelNumber = Math.max(1, Math.round(gamification.xp / 140) + 1);
  const nextXp = gamification.nextLeague?.target ?? Math.max(gamification.xp, 1);
  const progressToNext = gamification.progressToNext;
  const interests = splitTags(profile.hobbies || "séries, música, tecnologia");
  const shows = splitTags(profile.favoriteShows || "Friends, Stranger Things, filmes");
  const music = splitTags(profile.favoriteMusic || "música, pop, rock");
  const photo = profile.avatar;
  const completedToday = gamification.history.slice(0, 3);

  return (
    <AppShell wide>
      <div className="profile-product-shell">
        <header className="profile-product-header">
          <div>
            <div className="profile-eyebrow">perfil social · last course</div>
            <h1>Seu perfil</h1>
            <p>
              Sua identidade de aprendizado: progresso, amigos, conquistas e tudo que te inspira.
            </p>
          </div>
          <Link to="/personalizar" className="profile-settings-pill">
            <Settings className="h-4 w-4" /> Configurações
          </Link>
        </header>

        <nav className="profile-social-nav" aria-label="Funções sociais do perfil">
          <a href="#perfil"><Home className="h-4 w-4" /> Perfil</a>
          <a href="#amigos"><Users className="h-4 w-4" /> Amigos</a>
          <a href="#recados"><MessageCircle className="h-4 w-4" /> Recados</a>
          <Link to="/conversar" search={{ intent: "" }}><Mail className="h-4 w-4" /> Mensagens</Link>
          <Link to="/comunidade"><Users className="h-4 w-4" /> Comunidades</Link>
          <a href="#ranking"><Trophy className="h-4 w-4" /> Ranking</a>
          <Link to="/personalizar"><Settings className="h-4 w-4" /> Config</Link>
        </nav>

        <div className="profile-orkut-grid" id="perfil">
          <aside className="profile-left-rail">
            <section className="profile-solid-card profile-identity-card">
              <div className="profile-brand">perfil</div>
              <div className="profile-photo-frame">
                <AvatarUpload
                  value={photo}
                  onChange={(avatar) => progress.setProfile({ ...profile, avatar })}
                  fallbackInitial={profile.name.charAt(0)}
                  size={210}
                />
              </div>
              <h2>{profile.name}</h2>
              <p className="profile-handle">@{slugify(profile.name)} · {profile.level}</p>
              <p className="profile-quote">
                “{profile.motivation || "Quero aprender inglês do meu jeito, sem travar."}”
              </p>
              <div className="profile-status-pill">
                <span className="profile-online-dot" /> Online agora
              </div>
              <div className="profile-level-badge">
                <span>Nível {levelNumber}</span>
                <strong>{gamification.league}</strong>
                <Star className="h-9 w-9" />
              </div>
              <div className="profile-side-menu">
                <Link to="/curso"><BookOpen className="h-4 w-4" /> Curso</Link>
                <Link to="/legendas"><Clapperboard className="h-4 w-4" /> Séries</Link>
                <Link to="/comunidade"><Users className="h-4 w-4" /> Comunidade</Link>
                <Link to="/conquistas"><Trophy className="h-4 w-4" /> Conquistas</Link>
                <Link to="/personalizar"><Settings className="h-4 w-4" /> Configurações</Link>
              </div>
            </section>

            <section className="profile-solid-card profile-day-status">
              <Smile className="h-8 w-8" />
              <div>
                <strong>Status do dia</strong>
                <span>{gamification.streak > 0 ? "Foco total!" : "Pronto pra recomeçar."}</span>
              </div>
              <b>{Math.max(12, progress.overallProgress)}%</b>
              <div className="profile-mini-progress"><i style={{ width: `${Math.max(12, progress.overallProgress)}%` }} /></div>
            </section>
          </aside>

          <main className="profile-center-feed">
            <section className="profile-hero-card">
              <div className="profile-hero-copy">
                <h2>{profile.name}</h2>
                <p className="profile-hero-handle">@{slugify(profile.name)}</p>
                <span className="profile-online-dot-text"><span /> Online</span>
                <p className="profile-hero-bio">
                  {publicBio || "Aprendendo inglês com missões, séries, conversa e memória adaptativa."}
                </p>
                <div className="profile-hero-meta">
                  <span><MapPin className="h-4 w-4" /> Brasil</span>
                  <span><BookOpen className="h-4 w-4" /> Inglês {profile.level}</span>
                  <span><Flame className="h-4 w-4" /> {Math.max(progress.streak, gamification.streak)} dias</span>
                </div>
              </div>
              <div className="profile-pixel-avatar">{profile.name.charAt(0).toUpperCase()}</div>
              <Sparkles className="profile-spark s1" />
              <Heart className="profile-spark s2" />
              <Star className="profile-spark s3" />
            </section>

            <section className="profile-stats-row" id="ranking">
              <div><Zap className="h-6 w-6" /><small>XP total</small><strong>{gamification.xp.toLocaleString("pt-BR")}</strong></div>
              <div><Trophy className="h-6 w-6" /><small>Conquistas</small><strong>{gamification.badges.filter((b) => b.awarded).length}</strong></div>
              <div><Flame className="h-6 w-6" /><small>Sequência</small><strong>{Math.max(progress.streak, gamification.streak)} dias</strong></div>
              <div><Gem className="h-6 w-6" /><small>Ranking</small><strong>Top {gamification.xp > 1500 ? "8" : "42"}%</strong></div>
            </section>

            <section className="profile-solid-card profile-level-card">
              <h3>Progresso do nível</h3>
              <div className="profile-level-grid">
                <div className="profile-big-emblem"><Crown className="h-16 w-16" /></div>
                <div>
                  <h4>Liga {gamification.league}</h4>
                  <b>Rumo à {gamification.nextLeague?.league ?? "elite"}</b>
                  <div className="profile-progress"><i style={{ width: `${progressToNext}%` }} /></div>
                  <p>{gamification.xp.toLocaleString("pt-BR")} / {nextXp.toLocaleString("pt-BR")} XP</p>
                  <div className="profile-soft-note">
                    Cada missão concluída deixa seu Personal mais inteligente e seu perfil mais forte. Continua assim. 💙
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-solid-card profile-skill-card">
              <div className="profile-section-head">
                <h3>Passe do aluno</h3>
                <span>{progress.overallProgress}% geral</span>
              </div>
              <Skill label="Speaking" value={18 + Math.min(28, Math.floor(gamification.xp / 120))} />
              <Skill label="Listening" value={18 + Math.min(30, Math.floor(gamification.xp / 110))} />
              <Skill label="Grammar" value={20 + Math.min(25, Math.floor(progress.completedCount * 3))} />
              <Skill label="Vocabulary" value={22 + Math.min(28, Math.floor(gamification.xp / 100))} />
            </section>

            <section className="profile-solid-card profile-about-card">
              <h3>Sobre mim</h3>
              <label className="profile-bio-editor">
                <span>Frase pública / bio</span>
                <textarea
                  value={publicBio}
                  onChange={(event) => setPublicBio(event.target.value)}
                  onBlur={() => progress.setProfile({ ...profile, motivation: publicBio.trim() })}
                  maxLength={180}
                  rows={3}
                />
              </label>
              <ul>
                <li><Clapperboard className="h-4 w-4" /> Séries: {shows.slice(0, 3).join(", ")}</li>
                <li><Music className="h-4 w-4" /> Música: {music.slice(0, 3).join(", ")}</li>
                <li><Gamepad2 className="h-4 w-4" /> Interesses: {interests.slice(0, 4).join(", ")}</li>
                <li><ShieldCheck className="h-4 w-4" /> Método: Linha, Círculo e Espiral</li>
              </ul>
              <div className="profile-scrap-box" id="recados">
                Seja bem-vindo ao meu perfil! Pode me chamar para treinar inglês, falar de séries ou entrar numa sala. 😊
              </div>
            </section>

            <section className="profile-solid-card profile-achievements-card">
              <div className="profile-section-head">
                <h3>Minhas conquistas</h3>
                <Link to="/conquistas">Ver todas</Link>
              </div>
              <div className="profile-achievements-grid">
                {gamification.badges.slice(0, 5).map((badge) => (
                  <div className={`profile-achievement ${badge.awarded ? "is-awarded" : ""}`} key={badge.id}>
                    <span>{badge.emoji}</span>
                    <strong>{badge.name}</strong>
                    <small>{badge.awarded ? "+XP desbloqueado" : badge.description}</small>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="profile-right-rail">
            <section className="profile-solid-card profile-friends-card" id="amigos">
              <div className="profile-section-head">
                <h3>Seus amigos</h3>
                <Link to="/comunidade">Ver todos</Link>
              </div>
              <div className="profile-friend-list">
                {friendsPreview.map((friend) => (
                  <Link to="/comunidade" key={friend.id} className="profile-friend-row">
                    <span className="profile-friend-avatar">
                      {friend.avatarUrl ? <img src={friend.avatarUrl} alt={friend.name} /> : friend.name.charAt(0)}
                    </span>
                    <span>
                      <strong>{friend.name}</strong>
                      <small className={friend.online ? "online" : "offline"}>{friend.online ? "Online" : "Offline"}</small>
                    </span>
                  </Link>
                ))}
              </div>
              <Button asChild className="profile-wide-button">
                <Link to="/comunidade"><UserPlus className="mr-2 h-4 w-4" /> Encontrar amigos</Link>
              </Button>
            </section>

            <section className="profile-solid-card profile-motivation-card">
              <Heart className="profile-heart-icon" />
              <h3>Você está foda!</h3>
              <p>Você já está construindo um passe de aluno único.</p>
              <div className="profile-progress"><i style={{ width: `${Math.max(12, progressToNext)}%` }} /></div>
              <span>{onlineFriends.length} amigos online agora</span>
              <Link to="/comunidade" className="profile-secondary-button">Entrar no bate-papo</Link>
            </section>

            <section className="profile-solid-card profile-activity-card">
              <h3>Atividade recente</h3>
              {completedToday.length ? (
                completedToday.map((event) => (
                  <div className="profile-activity" key={event.id}>
                    <span className="profile-activity-icon"><Target className="h-4 w-4" /></span>
                    <div>
                      <span>{event.reason}</span>
                      <strong>+{event.amount} XP</strong>
                    </div>
                    <small>{relativeTime(event.at)}</small>
                  </div>
                ))
              ) : (
                <div className="profile-activity">
                  <span className="profile-activity-icon"><Target className="h-4 w-4" /></span>
                  <div>
                    <span>Comece sua primeira missão</span>
                    <strong>ganhe XP</strong>
                  </div>
                  <small>agora</small>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Skill({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="profile-skill-row">
      <div><span>{label}</span><b>{safe}%</b></div>
      <div className="profile-progress"><i style={{ width: `${safe}%` }} /></div>
    </div>
  );
}

function splitTags(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "") || "aluno";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function PerfilGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Perfil />
    </RequireAuth>
  );
}
