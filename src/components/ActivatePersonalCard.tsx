// Entry point for Modo Personal. Lives in /explorar.
// Opens a dialog where the user names their coach and picks a style.
// Once activated, shows a small "active" status with rename/deactivate.

import { useState } from "react";
import { Heart, Sparkles, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePersonal, type PersonalStyle } from "@/store/usePersonal";
import { toast } from "sonner";

export function ActivatePersonalCard() {
  const { identity, isActive, activate, deactivate } = usePersonal();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [style, setStyle] = useState<PersonalStyle>("fem");

  function handleActivate() {
    const finalName =
      name.trim() || (style === "fem" ? "Mia" : "Alex");
    activate(finalName, style);
    setOpen(false);
    setName("");
    toast.success(`${finalName} agora te acompanha todos os dias.`);
  }

  if (isActive && identity) {
    return (
      <div className="surface-card flex items-center gap-3 rounded-2xl p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-cta text-base font-bold text-primary-foreground shadow-glow">
          {identity.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">{identity.name}</span>
            <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-success">
              Ativo
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Seu Personal te acompanha na Home todos os dias.
          </p>
        </div>
        <button
          onClick={() => {
            deactivate();
            toast("Modo Personal desativado.");
          }}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Desativar
        </button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="surface-card group block w-full overflow-hidden rounded-2xl bg-gradient-cta p-5 text-left text-primary-foreground shadow-glow transition-bounce active:scale-[0.99]">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Heart className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] opacity-85">
                Novo
              </div>
              <div className="mt-1 text-lg font-bold leading-snug">
                Ativar modo Personal
              </div>
              <p className="mt-1.5 text-sm opacity-90">
                Um treinador pessoal de inglês — te chama todo dia, lembra do que
                você precisa treinar, e te empurra leve.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/95 px-3 py-1.5 text-xs font-bold text-background">
                <Sparkles className="h-3.5 w-3.5" />
                Ativar agora
              </div>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Conheça seu Personal</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <p className="text-sm text-muted-foreground">
            Ele vai te chamar todo dia, lembrar do que você precisa praticar e
            empurrar você quando bater preguiça. Curto, direto, do seu jeito.
          </p>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estilo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <StyleButton
                active={style === "fem"}
                onClick={() => setStyle("fem")}
                label="Feminino"
                hint="ex: Mia, Bia"
              />
              <StyleButton
                active={style === "masc"}
                onClick={() => setStyle("masc")}
                label="Masculino"
                hint="ex: Alex, John"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={style === "fem" ? "Mia" : "Alex"}
              maxLength={24}
              className="h-12 rounded-xl text-base"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Pode mudar depois.
            </p>
          </div>

          <Button
            onClick={handleActivate}
            className="h-12 w-full rounded-xl bg-gradient-cta text-base font-semibold text-primary-foreground shadow-glow"
          >
            <UserCircle2 className="mr-1.5 h-4 w-4" />
            Ativar agora
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StyleButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-3 text-left transition-smooth ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="text-[0.7rem] text-muted-foreground">{hint}</div>
    </button>
  );
}
