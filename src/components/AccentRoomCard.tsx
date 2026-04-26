import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACCENT_PACKS, type AccentPack } from "@/lib/globalPortuguese";
import { useGlobalPortuguese } from "@/store/useGlobalPortuguese";
import { MapPin, Volume2 } from "lucide-react";

export function AccentRoomGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ACCENT_PACKS.map((accent) => <AccentRoomCard key={accent.id} accent={accent} />)}
    </div>
  );
}

function AccentRoomCard({ accent }: { accent: AccentPack }) {
  const global = useGlobalPortuguese();
  const active = global.selectedAccentId === accent.id;

  return (
    <div className={`surface-card rounded-3xl border p-4 ${active ? "border-primary/60 bg-primary/10" : "border-border/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {accent.region}</div>
          <h3 className="mt-2 text-lg font-black text-foreground">{accent.name}</h3>
        </div>
        <Badge variant="secondary" className="rounded-full">Escuta {accent.listeningDifficulty}/5</Badge>
      </div>

      <div className="mt-4 rounded-2xl bg-background/55 p-3">
        <div className="flex items-center gap-2 text-xs font-bold text-primary"><Volume2 className="h-3.5 w-3.5" /> Frase viva</div>
        <p className="mt-2 text-sm font-semibold text-foreground">“{accent.samplePhrase}”</p>
        <p className="mt-1 text-xs text-muted-foreground">{accent.meaningEN}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {accent.notes.map((note) => <span key={note} className="rounded-full border border-border bg-background/40 px-2 py-1 text-[0.66rem] text-muted-foreground">{note}</span>)}
      </div>

      <Button className="mt-4 w-full rounded-xl" variant={active ? "outline" : "default"} onClick={() => global.selectAccent(accent.id)}>
        {active ? "Sotaque ativo" : "Treinar este sotaque"}
      </Button>
    </div>
  );
}
