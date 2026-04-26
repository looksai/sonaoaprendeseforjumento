import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, UserPlus } from "lucide-react";

export const Route = createFileRoute("/i/$code")({
  head: () => ({
    meta: [
      { title: "Convite — Last Course" },
      { name: "description", content: "Entre no Last Course com um convite de amigo." },
    ],
  }),
  component: InviteRoute,
});

function InviteRoute() {
  const { code } = Route.useParams();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="surface-card w-full max-w-md rounded-3xl p-6 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <UserPlus className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-foreground">Você recebeu um convite</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Código <span className="font-bold text-foreground">{code}</span> recebido. Entre ou crie sua conta para continuar no Last Course.
        </p>
        <Link to="/auth" className="v6-primary-action mt-6 w-full px-5 py-3 text-sm">
          Continuar <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}