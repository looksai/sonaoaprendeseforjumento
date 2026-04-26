import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/store/useConsent";
import { ShieldCheck } from "lucide-react";

export function ConsentModal() {
  const { decided, decide } = useConsent();

  return (
    <Dialog open={!decided}>
      <DialogContent className="max-w-md rounded-2xl">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <DialogTitle className="text-lg">Ajude a melhorar o Last Course</DialogTitle>
        </div>
        <DialogDescription asChild>
          <div className="space-y-3 pt-1 text-sm text-foreground">
            <p>
              Para evoluir sua experiência, podemos usar dados anonimizados do seu
              aprendizado (acertos/erros, tempo de resposta e, se você usar voz,
              padrões de pronúncia).
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Seus dados são anonimizados</li>
              <li>• Você pode desativar a qualquer momento</li>
              <li>• O app funciona mesmo sem essa coleta</li>
            </ul>
          </div>
        </DialogDescription>
        <div className="mt-4 flex items-end justify-end gap-2">
          <button
            onClick={() => void decide(false)}
            className="px-2 py-1 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
          >
            Agora não
          </button>
          <Button onClick={() => void decide(true)} className="rounded-xl px-6">
            ACEITO
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
