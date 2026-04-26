// Settings-page block: two toggles for analytics + voice consent.
import { Switch } from "@/components/ui/switch";
import { useConsent } from "@/store/useConsent";

export function ConsentSettings() {
  const { analytics, voice, setAnalytics, setVoice } = useConsent();

  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Privacidade
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
        <div className="pr-3">
          <div className="text-sm font-semibold">
            Compartilhar dados anonimizados para melhorar o sistema
          </div>
          <div className="text-xs text-muted-foreground">
            Acertos, erros e tempo de resposta. Sem dados pessoais.
          </div>
        </div>
        <Switch checked={analytics} onCheckedChange={(v) => void setAnalytics(v)} />
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-muted/60 p-3">
        <div className="pr-3">
          <div className="text-sm font-semibold">Análise de voz</div>
          <div className="text-xs text-muted-foreground">
            Padrões de pronúncia anonimizados. Reprodução continua funcionando.
          </div>
        </div>
        <Switch
          checked={voice}
          onCheckedChange={(v) => void setVoice(v)}
          disabled={!analytics}
        />
      </div>
    </div>
  );
}
