// Voice & phonetics settings panel for Perfil.
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useVoicePrefs, VOICES, type VoiceId, type PhoneticMode } from "@/store/useVoicePrefs";
import { useEnglishVoice } from "@/hooks/useEnglishVoice";
import { Volume2, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

const PHON_OPTIONS: { id: PhoneticMode; label: string; sub: string }[] = [
  { id: "off", label: "Desligado", sub: "Sem dicas" },
  { id: "pt", label: "Adaptado", sub: "thought → thót" },
  { id: "ipa", label: "IPA", sub: "thought → /θɔːt/" },
];

// Voice-specific preview lines — natural American English that highlights
// each voice's character (warmth, clarity, register).
const PREVIEW_LINES: Record<VoiceId, string> = {
  sarah: "Hi there, I'm Sarah. Let's practice your English — ready when you are.",
  laura: "Hey, I'm Laura. Try saying this: \"I really enjoyed the weekend.\"",
  brian: "Hello, I'm Brian. Listen carefully and repeat after me.",
};

export function VoiceSettings() {
  const { prefs, setVoice, setSpeed, setUseElevenLabs, setPhoneticMode } = useVoicePrefs();
  const voice = useEnglishVoice();
  const [previewing, setPreviewing] = useState<VoiceId | null>(null);

  function preview(v: VoiceId) {
    voice.stop();
    setPreviewing(v);
    voice.play(PREVIEW_LINES[v], {
      voice: v,
      speed: prefs.speed,
      onEnd: () => setPreviewing((cur) => (cur === v ? null : cur)),
    });
  }

  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Voz & pronúncia
      </div>

      {/* High-quality toggle */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-muted/60 p-3">
        <div className="pr-3">
          <div className="text-sm font-semibold">Voz premium da OpenAI</div>
          <div className="text-xs text-muted-foreground">
            Áudio premium em inglês americano. Desligue para usar a voz do navegador (offline).
          </div>
        </div>
        <Switch checked={prefs.useElevenLabs} onCheckedChange={setUseElevenLabs} />
      </div>

      {/* Fallback / status banner */}
      {prefs.useElevenLabs && voice.usedFallback && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
          <div>
            <div className="font-semibold">Usando voz do navegador</div>
            <div className="text-muted-foreground">
              A voz da OpenAI não respondeu agora — caímos para a voz do sistema.
            </div>
          </div>
        </div>
      )}
      {!prefs.useElevenLabs && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            Voz do navegador ativa. Ative a voz premium para uma pronúncia mais clara.
          </div>
        </div>
      )}

      {/* Voice picker */}
      {prefs.useElevenLabs && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground">Sua voz nativa</div>
            <div className="text-[0.65rem] text-muted-foreground">Toque para ouvir</div>
          </div>
          <div className="space-y-2">
            {VOICES.map((v) => {
              const isSelected = prefs.voice === v.id;
              const isPreviewing = previewing === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => { setVoice(v.id); preview(v.id); }}
                  disabled={voice.loading && isPreviewing}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 p-3 text-left transition-bounce ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold">{v.label}</span>
                      {isSelected && !isPreviewing && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div className="text-[0.7rem] text-muted-foreground">🇺🇸 {v.tagline}</div>
                  </div>
                  {isPreviewing && voice.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : isPreviewing && voice.playing ? (
                    <Volume2 className="h-4 w-4 animate-pulse text-primary" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Speed */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground">Velocidade</div>
          <div className="text-xs font-mono tabular-nums">{prefs.speed.toFixed(2)}x</div>
        </div>
        <Slider
          value={[prefs.speed]}
          min={0.7}
          max={1.2}
          step={0.05}
          onValueChange={(val) => setSpeed(val[0] ?? 0.95)}
        />
        <div className="mt-1 flex justify-between text-[0.6rem] text-muted-foreground">
          <span>Devagar</span><span>Natural</span><span>Rápida</span>
        </div>
      </div>

      {/* Phonetic mode */}
      <div>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Guia de pronúncia nas frases
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PHON_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setPhoneticMode(o.id)}
              className={`rounded-xl border-2 p-2.5 text-center transition-bounce ${
                prefs.phoneticMode === o.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="text-xs font-bold">{o.label}</div>
              <div className="mt-0.5 text-[0.6rem] text-muted-foreground">{o.sub}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[0.65rem] text-muted-foreground">
          Esse guia também aparece em cada frase com áudio (botão “Ver pronúncia”).
        </p>
      </div>
    </div>
  );
}
