import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/useAuth";
import { useConsent } from "@/store/useConsent";
import { useProgress } from "@/store/useProgress";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Last Course — Entrar" },
      {
        name: "description",
        content:
          "Entre no Last Course — o último curso de inglês que você vai precisar.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  const { decided } = useConsent();
  const { profile } = useProgress();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (!decided) navigate({ to: "/consent" });
    else if (!profile) navigate({ to: "/onboarding" });
    else navigate({ to: "/" });
  }, [user, loading, decided, profile, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setError(translate(error));
        } else {
          toast.success("Bem-vindo de volta ✨");
          navigate({ to: profile ? "/" : "/onboarding" });
        }
      } else {
        if (password.length < 6) {
          setError("A senha precisa ter pelo menos 6 caracteres.");
          return;
        }
        const { error } = await signUp(
          email.trim(),
          password,
          displayName.trim() || email.split("@")[0],
        );
        if (error) {
          setError(translate(error));
        } else {
          toast.success("Conta criada — vamos começar!");
          navigate({ to: "/onboarding" });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <div className="mb-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Last Course</div>
            <div className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              o último curso de inglês
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-bold leading-tight">
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Bom te ver de novo. Continue sua jornada de onde parou."
              : "Você está a um passo de parar de procurar o próximo curso."}
          </p>

          <div className="mt-7 space-y-4">
            <GoogleSignInButton />
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou email
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Como podemos te chamar?
                </Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-12 rounded-xl border-border bg-card text-base"
                  maxLength={40}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="h-12 rounded-xl border-border bg-card text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl border-border bg-card text-base"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-xl bg-gradient-cta text-base font-semibold text-primary-foreground shadow-glow transition-bounce hover:opacity-95 active:scale-[0.99]"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "signin" ? (
                "Entrar"
              ) : (
                "Criar minha conta"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Ainda não tem conta?{" "}
                <button
                  className="font-semibold text-primary hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem uma conta?{" "}
                <button
                  className="font-semibold text-primary hover:underline"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                >
                  Entrar
                </button>
              </>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="mb-4 text-sm font-semibold text-primary hover:underline"
            >
              Continuar sem login para testar
            </button>
            <br />
            <Link
              to="/welcome"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "Este email já tem conta — tente entrar.";
  if (m.includes("rate") || m.includes("too many"))
    return "Muitas tentativas. Aguarde um momento e tente novamente.";
  if (m.includes("password")) return "Senha inválida ou muito curta.";
  return msg;
}
