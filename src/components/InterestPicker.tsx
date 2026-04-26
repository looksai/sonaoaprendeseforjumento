// Tag-style multi-interest picker.
// User types and presses Enter (or comma) to add a tag. Suggestions appear
// dynamically (passed in via `suggestions`). Inspired by Deezer/Spotify's
// taste pickers — fast, dopaminergic, and removable per chip.
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

interface Props {
  label?: string;
  placeholder?: string;
  /** Comma-separated string (kept for compatibility with our profile shape). */
  value: string;
  onChange: (next: string) => void;
  suggestions?: string[];
  maxItems?: number;
  /** Soft accent color for chips. */
  tone?: "primary" | "accent" | "success";
}

function parse(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function serialize(tags: string[]): string {
  return Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).join(", ");
}

export function InterestPicker({
  label,
  placeholder = "Adicionar…",
  value,
  onChange,
  suggestions = [],
  maxItems = 12,
  tone = "primary",
}: Props) {
  const [draft, setDraft] = useState("");
  const tags = useMemo(() => parse(value), [value]);
  const lower = useMemo(() => new Set(tags.map((t) => t.toLowerCase())), [tags]);

  const remainingSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !lower.has(s.toLowerCase()))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [suggestions, lower, draft]);

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (lower.has(tag.toLowerCase())) return;
    if (tags.length >= maxItems) return;
    onChange(serialize([...tags, tag]));
    setDraft("");
  }

  function remove(tag: string) {
    onChange(serialize(tags.filter((t) => t.toLowerCase() !== tag.toLowerCase())));
  }

  const chipBase =
    tone === "accent"
      ? "bg-accent/10 text-accent border-accent/30"
      : tone === "success"
        ? "bg-success/10 text-success border-success/30"
        : "bg-primary/10 text-primary border-primary/30";

  return (
    <div>
      {label && (
        <div className="mb-1.5 text-sm font-semibold text-foreground">{label}</div>
      )}

      <div className="rounded-2xl border-2 border-border bg-card p-2 transition-smooth focus-within:border-primary/60">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${chipBase}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="rounded-full p-0.5 transition-smooth hover:bg-foreground/10"
                aria-label={`Remover ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && tags.length) {
                remove(tags[tags.length - 1]);
              }
            }}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="min-w-[80px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
            maxLength={60}
          />
        </div>
      </div>

      {remainingSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remainingSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary"
            >
              <Plus className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-1.5 text-[0.65rem] text-muted-foreground">
        {tags.length}/{maxItems} · pressione Enter ou vírgula para adicionar
      </div>
    </div>
  );
}
