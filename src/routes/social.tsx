// /social — alias route for the community/chat rooms experience.
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import ComunidadePage from "./comunidade";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Last Course — Comunidade" },
      {
        name: "description",
        content: "Salas de conversa, perfis e prática real de inglês com a comunidade.",
      },
    ],
  }),
  component: ComunidadePageGuarded,
});

function ComunidadePageGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <ComunidadePage />
    </RequireAuth>
  );
}
