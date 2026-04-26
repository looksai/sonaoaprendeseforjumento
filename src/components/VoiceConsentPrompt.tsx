import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface Props {
  open: boolean;
  onDecide: (allow: boolean) => void;
}

export function VoiceConsentPrompt({ open, onDecide }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onDecide(false);
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl">
        <div className="flex items-center gap-2 text-primary">
          <Mic className="h-5 w-5" />
          <DialogTitle className="text-base">
            Autoriza análise de voz para melhorar sua pronúncia?
          </DialogTitle>
        </div>
        <DialogDescription className="text-sm text-muted-foreground">
          Usaremos apenas padrões anonimizados da gravação. Você pode desativar
          depois nas configurações.
        </DialogDescription>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onDecide(false)}
            className="flex-1 rounded-xl"
          >
            Não
          </Button>
          <Button onClick={() => onDecide(true)} className="flex-1 rounded-xl">
            Permitir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
