// /series — alias route for the "Estude com séries" experience.
// Renders the same Component the legendas route uses.
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import LegendasPage from "./legendas";

export const Route = createFileRoute("/series")({
  head: () => ({
    meta: [
      { title: "Last Course — Estude com séries" },
      {
        name: "description",
        content:
          "Aprenda inglês com as séries e filmes que você ama: frases icônicas, prática de fala e revisão.",
      },
    ],
  }),
  component: LegendasPageGuarded,
});

function LegendasPageGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <LegendasPage />
    </RequireAuth>
  );
}
