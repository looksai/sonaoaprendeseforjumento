import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Smile, Sticker as StickerIcon, Upload } from "lucide-react";
import { useStickers } from "@/store/useStickers";

// Brazilian/MSN-style starter stickers. Custom uploaded stickers are loaded from Supabase Storage.
const STICKER_SET = [
  "😂", "🤣", "😍", "🥰", "😎", "🤔", "😱", "🥳",
  "🙏", "🔥", "💯", "💖", "👏", "💃", "🕺", "🎉",
  "✨", "⚽", "🇧🇷", "☀️", "🌧️", "🌈", "💪", "🤝",
  "🤙", "👀", "😴", "🤯", "🥹", "😅", "🤪", "🫡",
];

const EMOJI_SET = [
  "😂", "❤️", "🔥", "👏", "😮", "😍", "🥹", "😅",
  "😎", "🙏", "💪", "🎉", "✨", "👀", "🤔", "🫡",
  "👍", "👎", "💯", "🤣", "🥳", "😭", "😱", "🤯",
];

export type ChatInputBarProps = {
  onSend: (content: string, kind: "text" | "sticker") => void;
  onTyping?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function ChatInputBar({ onSend, onTyping, placeholder = "Digite sua mensagem...", autoFocus }: ChatInputBarProps) {
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const lastTypingRef = useRef(0);
  const { stickers, uploadSticker, loading } = useStickers();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const pulseTyping = () => {
    const now = Date.now();
    if (now - lastTypingRef.current > 1100) {
      lastTypingRef.current = now;
      onTyping?.();
    }
  };

  const submitText = () => {
    const value = draft.trim();
    if (!value) return;
    onSend(value, "text");
    setDraft("");
  };

  const sendSticker = (sticker: string) => {
    onSend(sticker, "sticker");
    setStickerOpen(false);
  };

  const uploadAndSendSticker = async (file: File | undefined) => {
    if (!file) return;
    const sticker = await uploadSticker(file);
    if (sticker) sendSticker(sticker.url);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="border-t border-primary/10 bg-white/88 p-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/webp,image/gif,image/jpeg"
        className="hidden"
        onChange={(e) => void uploadAndSendSticker(e.target.files?.[0])}
      />
      <div className="flex items-center gap-2">
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white transition-bounce active:scale-95"
              aria-label="Emojis"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-[280px] rounded-2xl border border-primary/10 bg-white/95 p-3 shadow-xl"
          >
            <div className="mb-2 text-[0.65rem] font-black uppercase tracking-wider text-foreground/50">
              Emojis rápidos
            </div>
            <div className="grid grid-cols-6 gap-1">
              {EMOJI_SET.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setDraft((d) => d + emoji);
                    setEmojiOpen(false);
                    inputRef.current?.focus();
                    pulseTyping();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl transition-bounce hover:scale-110 hover:bg-primary/8 active:scale-95"
                  aria-label={`Inserir emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white transition-bounce active:scale-95"
              aria-label="Stickers"
            >
              <StickerIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-[340px] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <div className="text-[0.65rem] font-black uppercase tracking-wider text-foreground/55">
                  Figurinhas
                </div>
                <div className="text-[0.68rem] text-foreground/50">
                  Starter pack + suas imagens
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-xl bg-white text-xs font-black"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
              >
                <Upload className="mr-1 h-3.5 w-3.5" /> Upload
              </Button>
            </div>

            {stickers.length > 0 && (
              <>
                <div className="mb-1 text-[0.62rem] font-black uppercase tracking-wider text-foreground/45">
                  Minhas / packs
                </div>
                <div className="mb-3 grid max-h-32 grid-cols-5 gap-1 overflow-y-auto rounded-2xl bg-primary/5 p-1">
                  {stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => sendSticker(sticker.url)}
                      className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white transition-bounce hover:scale-105 hover:bg-primary/8 active:scale-95"
                      title={sticker.alt}
                      aria-label={`Enviar figurinha ${sticker.alt}`}
                    >
                      <img src={sticker.url} alt={sticker.alt} className="h-full w-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="mb-1 text-[0.62rem] font-black uppercase tracking-wider text-foreground/45">
              Brasileirinho rápido
            </div>
            <div className="grid grid-cols-6 gap-1">
              {STICKER_SET.map((sticker) => (
                <button
                  key={sticker}
                  onClick={() => sendSticker(sticker)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-3xl transition-bounce hover:scale-110 hover:bg-primary/8 active:scale-95"
                  aria-label={`Enviar sticker ${sticker}`}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            pulseTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitText();
            } else {
              pulseTyping();
            }
          }}
          placeholder={placeholder}
          className="rounded-xl bg-white/92"
        />

        <Button size="icon" className="rounded-xl transition-bounce active:scale-95" onClick={submitText} aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
