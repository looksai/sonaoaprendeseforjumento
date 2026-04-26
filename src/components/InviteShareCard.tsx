// InviteShareCard — a low-friction viral loop on the home page.
// Uses the native share sheet when available, falls back to copy-link.
// The copy is positioning-driven: "Last Course" as a category killer.

import { Share2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const SHARE_TEXT =
  "Eu estou aprendendo inglês com o Last Course — o último curso de inglês que você vai precisar comprar. Vem comigo:";

export function InviteShareCard() {
  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Last Course", text: SHARE_TEXT, url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
      toast.success("Link copiado — cole onde quiser");
    } catch {
      toast.error("Não consegui copiar — tente de novo");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="surface-card group flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-smooth hover:border-primary/40 active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <UserPlus className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-foreground">Convide alguém pra aprender com você</div>
        <div className="text-xs text-muted-foreground">
          Tudo fica mais fácil quando tem companhia
        </div>
      </div>
      <Share2 className="h-4 w-4 text-muted-foreground transition-smooth group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}
