"use client";

import { useEffect, useState } from "react";
import { Check, Locate } from "lucide-react";

const THEMES = [
  { id: "neon", label: "Neon", color: "#2ddf8e" },
  { id: "cosmic", label: "Cosmic", color: "#a78bfa" },
  { id: "aurora", label: "Aurora", color: "#2dd4bf" },
  { id: "ember", label: "Ember", color: "#fbbf24" },
  { id: "ice", label: "Ice", color: "#22d3ee" },
];

export function ThemePicker() {
  const [theme, setThemeState] = useState<string>("neon");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setThemeState(
        document.documentElement.getAttribute("data-theme") ?? "neon"
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const setTheme = (id: string) => {
    setThemeState(id);
    setOpen(false);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem("cyberlab-theme", id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-muted transition-colors hover:border-accent/40 hover:text-white"
        aria-label="Accent theme"
        aria-expanded={open}
        title="Accent theme"
      >
        <Locate size={14} className="blink-soft" />
        <span
          className="h-2.5 w-2.5 rounded-full ring-2 ring-white/10"
          style={{ backgroundColor: `var(--accent)` }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fade-in absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-line bg-panel p-2 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.8)]">
            <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-dim">
              Accent theme
            </p>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-panel2 hover:text-white"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="flex-1 text-left">{t.label}</span>
                {theme === t.id && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}