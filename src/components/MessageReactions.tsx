import { useMemo } from "react";
import { useMessageReactions, type ReactionTarget } from "@/store/useMessageReactions";

const QUICK_REACTIONS = ["😂", "❤️", "🔥", "👏", "😮"];

export function MessageReactions({
  targetType,
  messageId,
  align = "left",
}: {
  targetType: ReactionTarget;
  messageId: string;
  align?: "left" | "right";
}) {
  const { reactions, myUserId, toggle } = useMessageReactions();
  const realMessageId = messageId.startsWith("cloud-") ? messageId.slice("cloud-".length) : messageId;
  const disabled = messageId.startsWith("local-");

  const grouped = useMemo(() => {
    const map = new Map<string, { emoji: string; count: number; mine: boolean }>();
    reactions
      .filter((r) => r.targetType === targetType && r.messageId === realMessageId)
      .forEach((r) => {
        const current = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
        current.count += 1;
        if (r.userId === myUserId) current.mine = true;
        map.set(r.emoji, current);
      });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
  }, [reactions, targetType, realMessageId, myUserId]);

  if (disabled) return null;

  return (
    <div className={`mt-1 flex flex-wrap gap-1 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {grouped.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => toggle(targetType, messageId, r.emoji)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-black shadow-sm transition-bounce active:scale-95 ${
            r.mine
              ? "border-primary/35 bg-primary/12 text-primary"
              : "border-primary/10 bg-white/90 text-foreground/75 hover:bg-white"
          }`}
          aria-label={`Reagir com ${r.emoji}`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}

      <div className="group relative inline-flex">
        <button
          type="button"
          className="rounded-full border border-primary/10 bg-white/80 px-2 py-0.5 text-[0.65rem] font-black text-foreground/55 shadow-sm transition-bounce hover:bg-white active:scale-95"
          aria-label="Adicionar reação"
        >
          +
        </button>
        <div className={`pointer-events-none absolute bottom-full z-20 mb-1 flex translate-y-1 gap-1 rounded-full border border-primary/10 bg-white/95 p-1 opacity-0 shadow-xl transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 ${align === "right" ? "right-0" : "left-0"}`}>
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(targetType, messageId, emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-bounce hover:bg-primary/8 active:scale-90"
              aria-label={`Reagir com ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
