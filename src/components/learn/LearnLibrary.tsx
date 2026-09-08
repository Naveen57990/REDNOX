"use client";

import { useEffect, useMemo, useState } from "react";
import { COMMANDS, COMMAND_CATEGORIES, TOTAL_COMMANDS } from "@/data/commands";
import type { KaliCommand } from "@/data/commands";
import {
  Search as SearchIcon,
  SearchX,
  X,
  Copy,
  Check,
  Circle,
  CircleCheck,
  ArrowRight,
} from "lucide-react";

const STORAGE_KEY = "cyberlab-lessons-done";

function loadDone(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function LearnLibrary() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [selected, setSelected] = useState<KaliCommand | null>(null);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<Set<string>>(loadDone);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
    } catch {
      /* ignore */
    }
  }, [done]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMANDS.filter((c) => {
      if (cat !== "all" && c.category !== cat) return false;
      if (!q) return true;
      return [c.name, c.description].some((f) => f.toLowerCase().includes(q));
    });
  }, [query, cat]);

  const toggleDone = (name: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  async function copy(syntax: string) {
    try {
      await navigator.clipboard.writeText(syntax);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Kali <span className="text-neon">Learn</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            <span className="text-neon">{TOTAL_COMMANDS} essential Linux commands</span>{" "}
            with syntax, flags and safe practice examples. Mark ones you&apos;ve
            understood — progress is saved locally.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-panel px-4 py-2.5 text-sm">
          <span className="text-muted">Understood: </span>
          <span className="font-mono font-bold text-neon">
            {done.size}/{TOTAL_COMMANDS}
          </span>
        </div>
      </div>

      <div className="relative mb-4">
        <SearchIcon
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands — chmod, grep, curl, ss…"
          className="w-full rounded-xl border border-line bg-panel py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-dim focus:border-neon/60 focus:outline-none"
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCat("all")}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            cat === "all"
              ? "border-neon/60 bg-neon/15 text-neon"
              : "border-line bg-panel text-muted hover:text-white"
          }`}
        >
          All ({TOTAL_COMMANDS})
        </button>
        {COMMAND_CATEGORIES.map((c) => {
          const n = COMMANDS.filter((x) => x.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                cat === c
                  ? "border-neon/60 bg-neon/15 text-neon"
                  : "border-line bg-panel text-muted hover:text-white"
              }`}
            >
              {c} ({n})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-line py-20 text-center">
          <SearchX size={32} className="text-dim" />
          <p className="mt-4 text-sm font-medium text-muted">No commands found</p>
          <p className="mt-1 text-xs text-dim">Try another keyword or category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const isDone = done.has(c.name);
            return (
              <div
                key={c.name}
                className={`group flex flex-col rounded-xl border bg-panel p-4 transition ${
                  isDone ? "border-neon/40" : "border-line hover:border-neon/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="mono rounded border border-line bg-abyss px-2 py-0.5 text-sm font-semibold text-neon">
                      {c.name}
                    </span>
                    <button
                      onClick={() => toggleDone(c.name)}
                      aria-label={`Mark ${c.name} ${isDone ? "incomplete" : "understood"}`}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                        isDone ? "border-neon bg-neon text-black" : "border-line text-dim hover:text-neon"
                      }`}
                    >
                      {isDone ? <CircleCheck size={13} /> : <Circle size={13} />}
                    </button>
                  </div>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-dim">
                    {c.category}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {c.description}
                </p>
                <p className="mono mt-3 truncate rounded bg-black/50 px-2 py-1.5 text-xs text-cyber/80">
                  $ {c.example.split("\n")[0]}
                </p>
                <button
                  onClick={() => setSelected(c)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-neon"
                >
                  Open details <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fade-up max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-line bg-panel shadow-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel/95 px-5 py-4 backdrop-blur">
              <div>
                <h2 className="mono text-lg font-bold text-white">{selected.name}</h2>
                <p className="text-[11px] text-dim">{selected.category}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-neon/50 hover:text-neon"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <p className="text-sm leading-relaxed text-muted">
                {selected.description}
              </p>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">
                  Syntax
                </h3>
                <div className="mt-2 space-y-2">
                  {selected.syntax.map((s) => (
                    <div
                      key={s}
                      className="group flex items-center justify-between gap-2 rounded-lg border border-line bg-black/50 px-3 py-2.5"
                    >
                      <code className="mono text-[13px] text-neon">{s}</code>
                      <button
                        onClick={() => copy(s)}
                        aria-label="Copy syntax"
                        className="text-dim transition hover:text-neon"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {selected.flags.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">
                    Common flags
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {selected.flags.map((f) => (
                      <li key={f.flag} className="flex gap-2 text-sm">
                        <code className="mono shrink-0 rounded bg-abyss px-1.5 py-0.5 text-[11px] text-cyber">
                          {f.flag}
                        </code>
                        <span className="text-muted">{f.desc}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">
                  Safe practice example
                </h3>
                <pre className="mono mt-2 overflow-x-auto rounded-lg border border-line bg-black/60 px-3 py-3 text-[13px] leading-relaxed text-neon">
                  {selected.example}
                </pre>
              </section>

              <p className="rounded-lg border border-neon/30 bg-neon/5 px-3 py-2.5 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-neon">Tip:</span> {selected.tip}
              </p>

              <button
                onClick={() => toggleDone(selected.name)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  done.has(selected.name)
                    ? "border-neon bg-neon text-black hover:bg-neon/85"
                    : "border-neon/50 bg-neon/10 text-neon hover:bg-neon/20"
                }`}
              >
                <CircleCheck size={15} />
                {done.has(selected.name) ? "Understood ✓" : "Mark as understood"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}