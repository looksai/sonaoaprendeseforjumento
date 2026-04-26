export type AtmosphericMode = "full" | "dimmed" | "none";

interface AtmosphericLayerProps {
  mode?: AtmosphericMode;
}

/**
 * Fixed root background. It intentionally stays behind all content and never
 * participates in page layout, which prevents z-index fights with dialogs,
 * bottom nav and full-screen chat screens.
 */
export function AtmosphericLayer({ mode = "full" }: AtmosphericLayerProps) {
  const isDimmed = mode === "dimmed";
  const isNone = mode === "none";

  return (
    <div aria-hidden="true" className="atmosphere-root" data-mode={mode}>
      <div
        className="atmosphere-image"
        style={{
          opacity: isNone
            ? 0
            : isDimmed
              ? "calc(var(--theme-image-opacity, 0.22) * 0.18)"
              : "var(--theme-image-opacity, 0.22)",
          filter: isDimmed
            ? "blur(calc(var(--theme-image-blur, 0px) + 7px)) saturate(0.88)"
            : "blur(var(--theme-image-blur, 0px)) saturate(var(--theme-image-saturate, 1))",
        }}
      />
      <div
        className="atmosphere-overlay"
        style={{
          background: isNone
            ? "var(--theme-overlay-none, var(--theme-overlay-focus, var(--theme-overlay)))"
            : isDimmed
              ? "var(--theme-overlay-focus, var(--theme-overlay))"
              : "var(--theme-overlay)",
        }}
      />
    </div>
  );
}
