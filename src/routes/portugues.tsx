import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Globe2, Lock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/portugues")({
  head: () => ({
    meta: [
      { title: "Last Course — Português Global" },
      { name: "description", content: "Módulo futuro para quem escolher aprender português brasileiro." },
    ],
  }),
  component: PortuguesFutureModeGuarded,
});

function PortuguesFutureMode() {
  return (
    <AppShell>
      <div className="v6-page-pad flex min-h-[calc(100dvh-7rem)] items-center py-8">
        <section className="v6-hero w-full p-6 sm:p-8">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">
              <Globe2 className="h-3.5 w-3.5" /> Módulo futuro
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-foreground">
              Português brasileiro para o mundo
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/72">
              Essa área não deve aparecer como aba principal no curso de inglês para brasileiros. Ela fica preparada para a tela inicial global, onde o usuário escolhe: aprender inglês, português brasileiro ou outro idioma.
            </p>

            <div className="mt-5 rounded-2xl border border-primary/15 bg-white/72 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-black text-foreground">Guardado para a versão global</div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/65">
                    Quando esse modo for ativado, o app abre com escolha de idioma. Quem escolher português recebe Personal bilíngue, sotaques regionais, salas com nativos e créditos de chamada.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/">
                <Button className="rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao inglês
                </Button>
              </Link>
              <Link to="/comunidade">
                <Button variant="outline" className="rounded-full bg-white/72">
                  Abrir comunidade
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function PortuguesFutureModeGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <PortuguesFutureMode />
    </RequireAuth>
  );
}
