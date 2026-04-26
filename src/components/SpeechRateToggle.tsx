import { useEffect, useState } from "react";
import { type SpeechRate, getSavedRate, saveRate } from "@/hooks/useSpeech";
import { Turtle, Rabbit } from "lucide-react";

interface Props {
  onChange?: (rate: SpeechRate) => void;
  className?: string;
}

export function SpeechRateToggle({ onChange, className }: Props) {
  const [rate, setRate] = useState<SpeechRate>("normal");

  useEffect(() => {
    setRate(getSavedRate());
  }, []);

  function pick(r: SpeechRate) {
    setRate(r);
    saveRate(r);
    onChange?.(r);
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 ${className ?? ""}`}>
      <button
        onClick={() => pick("slow")}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth ${
          rate === "slow" ? "bg-gradient-primary text-white shadow-soft" : "text-muted-foreground"
        }`}
        aria-label="Velocidade lenta"
      >
        <Turtle className="h-3.5 w-3.5" />
        Lenta
      </button>
      <button
        onClick={() => pick("normal")}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth ${
          rate === "normal" ? "bg-gradient-primary text-white shadow-soft" : "text-muted-foreground"
        }`}
        aria-label="Velocidade normal"
      >
        <Rabbit className="h-3.5 w-3.5" />
        Normal
      </button>
    </div>
  );
}
