// Primary "Continue with Google" button — uses Lovable Cloud managed OAuth.
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

interface Props {
  className?: string;
  label?: string;
}

export function GoogleSignInButton({ className = "", label = "Continuar com Google" }: Props) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (result.error) {
        toast.error("Não consegui conectar agora. Tente novamente.");
        setBusy(false);
        return;
      }
      // On success: browser redirects, or session is set and AuthProvider routes to /
    } catch {
      toast.error("Não consegui conectar agora. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-base font-semibold text-foreground shadow-card transition-smooth hover:shadow-elevated active:scale-[0.99] disabled:opacity-60 ${className}`}
    >
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <>
          <GoogleGlyph />
          {label}
        </>
      )}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 13 4.5 4 13.5 4 24.5s9 20 20 20 20-9 20-20c0-1.4-.1-2.7-.4-4z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 16.3 4.5 9.7 8.7 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.5c5.4 0 10.3-2.1 14-5.5l-6.5-5.3c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 40.2 16.2 44.5 24 44.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.5 5.3c-.5.4 7-5.1 7-14.4 0-1.4-.1-2.7-.4-4z"
      />
    </svg>
  );
}
