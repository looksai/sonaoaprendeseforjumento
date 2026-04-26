import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCENT_PACKS, estimateCallCost, type AccentId } from "@/lib/globalPortuguese";
import { useGlobalPortuguese } from "@/store/useGlobalPortuguese";
import { CalendarClock, Video } from "lucide-react";

const natives = [
  { name: "Maria Clara", accentId: "nordeste" as AccentId, specialty: "conversa leve + expressões" },
  { name: "Luana", accentId: "nordeste" as AccentId, specialty: "sotaque baiano + escuta" },
  { name: "Rafa Carioca", accentId: "carioca" as AccentId, specialty: "gírias + música" },
  { name: "Pedro SP", accentId: "paulista" as AccentId, specialty: "trabalho + cidade" },
];

export function NativeCallPanel() {
  const global = useGlobalPortuguese();
  const [nativeName, setNativeName] = useState(natives[0].name);
  const [minutes, setMinutes] = useState("10");
  const native = natives.find((item) => item.name === nativeName) ?? natives[0];
  const cost = estimateCallCost(Number(minutes));

  return (
    <div className="surface-elevated rounded-3xl border border-border/70 p-5">
      <div className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-success">
        <Video className="h-3.5 w-3.5" /> Videochamada paga · preparado
      </div>
      <h2 className="mt-3 text-xl font-black text-foreground">Conversar com nativo</h2>
      <p className="mt-2 text-sm text-muted-foreground">Simulação de créditos/minutos. Na junção final, isso vira chamada real com pagamento, agenda, denúncia e bloqueio.</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Nativo</div>
          <Select value={nativeName} onValueChange={setNativeName}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {natives.map((item) => <SelectItem key={item.name} value={item.name}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Duração</div>
          <Select value={minutes} onValueChange={setMinutes}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutos</SelectItem>
              <SelectItem value="10">10 minutos</SelectItem>
              <SelectItem value="20">20 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-2xl border border-border bg-background/35 p-3">
          <div className="text-xs text-muted-foreground">Custo</div>
          <div className="text-2xl font-black text-foreground">{cost} créditos</div>
          <div className="text-xs text-muted-foreground">Você tem {global.credits}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-background/45 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">{native.name}</strong> · {ACCENT_PACKS.find((pack) => pack.id === native.accentId)?.name} · {native.specialty}
      </div>

      <Button className="mt-4 w-full rounded-xl" onClick={() => global.scheduleNativeCall(native.name, native.accentId, Number(minutes))}>
        <CalendarClock className="mr-2 h-4 w-4" /> Reservar simulação
      </Button>

      {global.scheduledCalls.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chamadas recentes</div>
          {global.scheduledCalls.slice(0, 3).map((call) => (
            <div key={call.id} className="rounded-xl border border-border bg-background/35 px-3 py-2 text-xs text-muted-foreground">
              {call.nativeName} · {call.minutes} min · {call.creditsCost} créditos · aguardando gateway real
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
