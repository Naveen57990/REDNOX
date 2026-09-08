"use client";

import { useState } from "react";

const PHASES = [
  { key: "p1", slug: "foundations", label: "1 · Foundations" },
  { key: "p2", slug: "linux-essentials", label: "2 · Linux Essentials" },
  { key: "p3", slug: "information-gathering", label: "3 · Information Gathering" },
  { key: "p4", slug: "vulnerability-analysis", label: "4 · Vulnerability Analysis" },
  { key: "p5", slug: "web-attacks", label: "5 · Web Attacks" },
  { key: "p6", slug: "password-attacks", label: "6 · Password Attacks" },
  { key: "p7", slug: "exploitation", label: "7 · Exploitation" },
  { key: "p8", slug: "post-exploitation", label: "8 · Post-Exploitation & Privesc" },
  { key: "p9", slug: "wireless-sniffing", label: "9 · Wireless & Sniffing" },
  { key: "p10", slug: "reporting-career", label: "10 · Reporting & Career" },
];

export function DashboardProgress() {
  const [done, setDone] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = localStorage.getItem("gk-progress");
      return raw ? new Set(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  function toggle(key: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem("gk-progress", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const pct = Math.round((done.size / PHASES.length) * 100);

  return (
    <div className="rounded-xl border border-edge bg-panel p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Roadmap Progress</h2>
        <span className="mono text-xs text-neon">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-abyss">
        <div
          className="h-full rounded-full bg-neon transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {PHASES.map((p) => (
          <li key={p.key} className="flex items-center gap-3">
            <button
              onClick={() => toggle(p.key)}
              aria-label={`Toggle ${p.label}`}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                done.has(p.key)
                  ? "border-neon bg-neon text-abyss"
                  : "border-edge2 bg-abyss"
              }`}
            >
              {done.has(p.key) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
              )}
            </button>
            <span
              className={`text-sm ${done.has(p.key) ? "text-dim line-through" : "text-mut"}`}
            >
              {p.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}