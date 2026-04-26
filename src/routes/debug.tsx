import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { DebugBrainPanel } from "@/components/DebugBrainPanel";
import { useExperienceV5 } from "@/store/useExperienceV5";

export const Route = createFileRoute("/debug")({
  head: () => ({
    meta: [
      { title: "Last Course — Debug do cérebro" },
      { name: "description", content: "Painel interno para testar CSLE, memória, missão e experiência v5." },
    ],
  }),
  component: DebugGuarded,
});

function Debug() {
  const v5 = useExperienceV5();
  useEffect(() => {
    v5.markDebugOpened();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <DebugBrainPanel />
    </AppShell>
  );
}

function DebugGuarded() {
  return (
    <RequireAuth requireProfile={true}>
      <Debug />
    </RequireAuth>
  );
}
