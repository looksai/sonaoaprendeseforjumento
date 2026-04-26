// AvatarUpload — circular photo picker used in onboarding & profile.
// Resizes the chosen image to ~256px square JPEG to keep the data URL tiny
// before storing it in the dopamine profile (which syncs to user_progress).

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

interface Props {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  fallbackInitial?: string;
  size?: number;
}

async function fileToSquareJpeg(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const min = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - min) / 2;
  const sy = (bitmap.height - min) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, sx, sy, min, min, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AvatarUpload({ value, onChange, fallbackInitial, size = 112 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await fileToSquareJpeg(file);
      onChange(url);
    } catch {
      // ignore — keep previous value
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative overflow-hidden rounded-full border-2 border-white/70 bg-white/60 shadow-lg backdrop-blur"
        style={{ width: size, height: size }}
      >
        {value ? (
          <img src={value} alt="Sua foto" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-3xl font-bold text-primary-foreground">
            {(fallbackInitial ?? "·").slice(0, 1).toUpperCase()}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Escolher foto"
          className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-smooth hover:bg-black/40 hover:opacity-100"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {value ? "Trocar foto" : "Adicionar foto"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" /> remover
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
