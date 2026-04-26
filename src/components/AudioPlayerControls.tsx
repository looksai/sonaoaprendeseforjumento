// Reusable audio transport controls — play/pause, seek bar, replay, loop.
import { Play, Pause, RotateCcw, Repeat, Square, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Props {
  playing: boolean;
  loading?: boolean;
  currentTime: number;
  duration: number;
  looping: boolean;
  onPlayPause: () => void;
  onReplay: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onSeek: (seconds: number) => void;
  compact?: boolean;
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerControls({
  playing,
  loading = false,
  currentTime,
  duration,
  looping,
  onPlayPause,
  onReplay,
  onStop,
  onToggleLoop,
  onSeek,
  compact = false,
}: Props) {
  const max = Math.max(0.01, duration);
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "rounded-2xl bg-muted/40 p-2"}`}>
      <button
        onClick={onPlayPause}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-smooth active:scale-95"
        aria-label={playing ? "Pausar" : "Tocar"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 translate-x-[1px]" />
        )}
      </button>

      <div className="flex flex-1 items-center gap-2">
        <span className="w-9 text-right text-[0.65rem] font-mono tabular-nums text-muted-foreground">
          {fmt(currentTime)}
        </span>
        <Slider
          value={[Math.min(currentTime, max)]}
          max={max}
          step={0.05}
          onValueChange={(v) => onSeek(v[0] ?? 0)}
          className="flex-1"
          aria-label="Buscar"
        />
        <span className="w-9 text-[0.65rem] font-mono tabular-nums text-muted-foreground">
          {fmt(duration)}
        </span>
      </div>

      <button
        onClick={onReplay}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-smooth active:bg-muted"
        aria-label="Recomeçar"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onToggleLoop}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-smooth active:bg-muted ${
          looping ? "text-primary" : "text-muted-foreground"
        }`}
        aria-label="Loop"
        aria-pressed={looping}
      >
        <Repeat className="h-3.5 w-3.5" />
      </button>
      {playing && (
        <button
          onClick={onStop}
          className="flex h-8 w-8 items-center justify-center rounded-full text-destructive transition-smooth active:bg-muted"
          aria-label="Parar"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
