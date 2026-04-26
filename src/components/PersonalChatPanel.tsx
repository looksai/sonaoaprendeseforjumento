import { Link } from "@tanstack/react-router";
import { Mic, Tv, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/store/useProgress";
import { usePersonal } from "@/store/usePersonal";
import { WELCOME_DONE_KEY } from "@/routes/intro";
import { useAppearance } from "@/store/useAppearance";

const SEEN_KEY = "csle-personal-panel-seen-v1";
const POS_KEY = "csle-personal-panel-pos-v1";

export function PersonalChatPanel() {
  const progress = useProgress();
  const { identity } = usePersonal();
  const { classicFeel } = useAppearance();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) setPos(JSON.parse(raw));
    } catch {}
    if (!progress.profile) return;
    try {
      if (!localStorage.getItem(WELCOME_DONE_KEY)) return;
      if (!localStorage.getItem(SEEN_KEY)) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      return;
    }
  }, [progress.profile]);

  function handleClose() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  const coachName = identity?.name ?? "Mia";
  const userName = progress.profile?.name?.split(" ")[0] || "amigo";

  function beginDrag(clientX: number, clientY: number) {
    if (typeof window === "undefined") return;
    dragRef.current = {
      dragging: true,
      startX: clientX,
      startY: clientY,
      origX: pos?.x ?? window.innerWidth - 72,
      origY: pos?.y ?? window.innerHeight - 168,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }

  function endDrag() {
    if (!dragRef.current.dragging || typeof window === "undefined") return;
    dragRef.current.dragging = false;
    setPos((prev) => {
      if (!prev) return prev;
      const snapRight = prev.x > window.innerWidth / 2;
      const x = snapRight ? window.innerWidth - 72 : 16;
      const y = Math.max(16, Math.min(window.innerHeight - 160, prev.y));
      const next = { x, y };
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  if (!mounted || !progress.profile) return null;
  if (typeof window !== "undefined") {
    try {
      if (!localStorage.getItem(WELCOME_DONE_KEY)) return null;
    } catch {
      return null;
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          onPointerDown={(e) => beginDrag(e.clientX, e.clientY)}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-label="Abrir chat com seu Personal"
          className={`personal-avatar fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-cta text-primary-foreground shadow-glow transition-bounce active:scale-95 ${classicFeel ? "" : ""}`}
          style={pos ? { left: pos.x, top: pos.y } : undefined}
        >
          <Mic className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm animate-fade-in md:items-center">
          <div className="surface-elevated w-full max-w-md rounded-t-3xl p-5 animate-fade-in-up md:rounded-3xl" role="dialog" aria-label={`Mensagem de ${coachName}`}>
            <div className="flex items-start gap-3">
              <div className="personal-avatar relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-cta text-base font-bold text-primary-foreground shadow-glow">
                {coachName.slice(0, 1).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-foreground">{coachName}</div>
                    <div className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">Seu Personal · Last Course</div>
                  </div>
                  <button onClick={handleClose} aria-label="Fechar" className="rounded-full p-1.5 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 rounded-2xl bg-primary/8 p-3 text-[0.92rem] leading-relaxed text-foreground">
                  Oi {userName}, eu sou {coachName}, seu Personal aqui no Last Course.
                  <br />
                  Vou te guiar com <strong>conversa</strong>, <strong>séries</strong> e prática real — no seu ritmo.
                  <br />
                  <br />
                  O que você quer fazer agora?
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link to="/conversar" search={{ intent: "quero praticar minha conversa" }} onClick={handleClose} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-cta px-3 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-bounce active:scale-95">
                    <Mic className="h-4 w-4" />
                    Conversar
                  </Link>
                  <Link to="/legendas" onClick={handleClose} className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-primary/30 bg-card px-3 py-3 text-sm font-bold text-primary transition-bounce active:scale-95">
                    <Tv className="h-4 w-4" />
                    Com séries
                  </Link>
                </div>

                <button onClick={handleClose} className="mt-3 w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground">Agora não</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
