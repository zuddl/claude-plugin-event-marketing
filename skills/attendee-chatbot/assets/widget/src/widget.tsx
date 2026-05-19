import { useState, useEffect, useMemo } from "react";
import { config } from "./config";
import { ChatPopup } from "./chat-popup";

export function Widget() {
  const [open, setOpen] = useState(false);

  // Brand kit -> CSS variables. Done at runtime so re-theming after a config
  // edit doesn't require rebuilding the stylesheet — only `config.ts` changes.
  const cssVars = useMemo<React.CSSProperties>(
    () => ({
      ["--ec-primary" as any]: config.brand.primaryColor,
      ["--ec-accent" as any]: config.brand.accentColor,
      ["--ec-text" as any]: config.brand.textColor,
      ["--ec-bg" as any]: config.brand.bgColor,
      ["--ec-font" as any]: config.brand.fontFamily,
    }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const isImageGlyph = /^https?:\/\//.test(config.brand.iconGlyph);

  return (
    <div className={`ec-root ec-${config.position}`} style={cssVars}>
      {open ? <ChatPopup onClose={() => setOpen(false)} /> : null}
      <button
        className="ec-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open event assistant"}
        aria-expanded={open}
      >
        {isImageGlyph ? <img src={config.brand.iconGlyph} alt="" /> : <span>{config.brand.iconGlyph}</span>}
      </button>
    </div>
  );
}
