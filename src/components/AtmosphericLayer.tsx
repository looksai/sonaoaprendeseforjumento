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
  const isNone = mode === "none";

  return (
    <div aria-hidden="true" className="atmosphere-root" data-mode={mode}>
      <div
        className="atmosphere-image"
        style={{
          opacity: isNone
            ? 0
            : "var(--theme-image-opacity, 1)",
          filter: "none",
        }}
      />
      <div
        className="atmosphere-overlay"
        style={{
          background: isNone
            ? "var(--theme-overlay-none, var(--theme-overlay-focus, var(--theme-overlay)))"
            : "transparent",
        }}
      />
    </div>
  );
}
