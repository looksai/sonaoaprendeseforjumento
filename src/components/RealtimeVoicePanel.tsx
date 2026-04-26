import { Mic, MicOff, Loader2, Radio, Volume2, AlertCircle, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeVoiceSession } from "@/hooks/useRealtimeVoiceSession";

export type RealtimeVoicePanelProps = {
  userName?: string;
  className?: string;
};

const STATUS_LABEL: Record<string, string> = {
  idle: "parado",
  connecting: "conectando",
  ready: "pronto",
  recording: "ouvindo",
  processing: "pensando",
  playing: "respondendo",
  error: "atenção",
};

export function RealtimeVoicePanel({ userName, className }: RealtimeVoicePanelProps) {
  const voice = useRealtimeVoiceSession();

  const start = () => {
    void voice.startRecording({ userName, language: "en", mode: "conversation" });
  };

  return (
    <section className={className ?? ""}>
      <div className="rounded-3xl border border-primary/15 bg-white/94 p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-soft ${voice.isRecording ? "animate-pulse bg-red-500" : "bg-gradient-primary"}`}>
              {voice.isRecording ? <Radio className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">Voz realtime</p>
              <h2 className="truncate text-base font-black text-foreground">Conversar com Mia em voz</h2>
              <p className="text-xs text-foreground/60">status: {STATUS_LABEL[voice.status] ?? voice.status}</p>
            </div>
          </div>
          {!voice.configured && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-[0.62rem] font-black text-amber-700">
              configurar server
            </span>
          )}
        </div>

        {!voice.configured && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <div className="mb-1 flex items-center gap-1 font-black">
              <AlertCircle className="h-3.5 w-3.5" /> Falta conectar o servidor de voz
            </div>
            Configure <code className="rounded bg-white/80 px-1 font-mono">VITE_VOICE_SERVER_URL</code> no Lovable apontando para o deploy da pasta <code className="rounded bg-white/80 px-1 font-mono">voice-server</code>.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {!voice.isRecording ? (
            <Button type="button" onClick={start} disabled={!voice.configured || voice.isBusy} className="h-11 rounded-2xl font-black transition-bounce active:scale-95">
              {voice.isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
              Falar agora
            </Button>
          ) : (
            <Button type="button" onClick={voice.commit} className="h-11 rounded-2xl bg-red-500 font-black text-white hover:bg-red-600 transition-bounce active:scale-95">
              <MicOff className="mr-2 h-4 w-4" /> Enviar voz
            </Button>
          )}
          <Button type="button" variant="outline" onClick={voice.disconnect} className="h-11 rounded-2xl bg-white font-black transition-bounce active:scale-95">
            <Unplug className="mr-2 h-4 w-4" /> Encerrar
          </Button>
        </div>

        {(voice.transcript || voice.tutorReply || voice.error) && (
          <div className="mt-4 space-y-2">
            {voice.error && (
              <div className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700">{voice.error}</div>
            )}
            {voice.transcript && (
              <div className="rounded-2xl bg-primary/7 p-3">
                <p className="text-[0.62rem] font-black uppercase tracking-wider text-primary">Você disse</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{voice.transcript}</p>
              </div>
            )}
            {voice.tutorReply && (
              <div className="rounded-2xl bg-emerald-50 p-3">
                <p className="text-[0.62rem] font-black uppercase tracking-wider text-emerald-700">Mia respondeu</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">{voice.tutorReply}</p>
              </div>
            )}
            {voice.audioUrl && <audio className="w-full" src={voice.audioUrl} controls />}
          </div>
        )}

        {voice.events.length > 0 && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-2">
            {voice.events.slice(0, 3).map((event) => (
              <div key={event.id} className="truncate px-2 py-1 text-[0.72rem] text-foreground/60">
                <span className="font-black text-foreground/70">{event.type}</span> · {event.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
