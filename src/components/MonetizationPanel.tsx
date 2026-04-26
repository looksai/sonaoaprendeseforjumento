import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CREDIT_PACKAGES, getTierLabel } from "@/lib/globalPortuguese";
import { useGlobalPortuguese } from "@/store/useGlobalPortuguese";
import { CreditCard, Gem, LockKeyhole, WalletCards } from "lucide-react";

export function MonetizationPanel() {
  const global = useGlobalPortuguese();
  return (
    <div className="surface-elevated rounded-3xl border border-border/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-warning">
            <WalletCards className="h-3.5 w-3.5" /> Monetização preparada
          </div>
          <h2 className="mt-3 text-xl font-black text-foreground">Assinatura + créditos de chamada</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sem pagamento real nesta parte: é a camada visual/lógica para testar preço, créditos e vídeo pago antes de integrar Stripe/Mercado Pago/Twilio.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Créditos</div>
          <div className="text-2xl font-black text-foreground">{global.credits}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {([
          { id: "free", title: "Free Preview", price: "R$0", desc: "Testa trilha e 1 sotaque." },
          { id: "global", title: "Global", price: "US$10/mês", desc: "Trilha PT-BR + salas + sotaques." },
          { id: "native_plus", title: "Native+", price: "US$10 + créditos", desc: "Inclui preparação para chamadas pagas." },
        ] as const).map((plan) => (
          <div key={plan.id} className={`rounded-2xl border p-4 ${global.subscriptionTier === plan.id ? "border-primary bg-primary/10" : "border-border bg-background/35"}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black text-foreground">{plan.title}</h3>
              {global.subscriptionTier === plan.id && <Badge className="rounded-full">ativo</Badge>}
            </div>
            <div className="mt-2 text-lg font-black text-foreground">{plan.price}</div>
            <p className="mt-1 text-xs text-muted-foreground">{plan.desc}</p>
            <Button className="mt-4 w-full rounded-xl" variant={global.subscriptionTier === plan.id ? "outline" : "default"} onClick={() => global.setSubscriptionTier(plan.id)}>
              <Gem className="mr-1.5 h-3.5 w-3.5" /> {global.subscriptionTier === plan.id ? getTierLabel(plan.id) : "Simular plano"}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {CREDIT_PACKAGES.map((pack) => (
          <div key={pack.id} className="rounded-2xl border border-border bg-background/35 p-4">
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /><h3 className="font-black text-foreground">{pack.label}</h3></div>
            <div className="mt-2 text-xl font-black text-foreground">{pack.price}</div>
            <p className="mt-1 text-xs text-muted-foreground">{pack.credits} créditos · {pack.description}</p>
            <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => global.addCredits(pack.credits)}>
              Adicionar localmente
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-xs leading-relaxed text-muted-foreground">
        <LockKeyhole className="mb-2 h-4 w-4 text-muted-foreground" />
        Integração final sugerida: Stripe para US$/€, Mercado Pago/Pix para Brasil, Supabase para ledger de créditos, Twilio/Zoom SDK para vídeo e moderação por denúncia/bloqueio.
      </div>
    </div>
  );
}
