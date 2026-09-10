"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, Search, X, Check, Scale } from "lucide-react";
import { TOOLS } from "@/data/tools";
import { compareRows, compareVerdict, catLabel } from "@/lib/compare/insights";

const SUGGESTED: [string, string][] = [
  ["nmap", "masscan"],
  ["nmap", "zenmap"],
  ["sqlmap", "hydra"],
  ["hydra", "john"],
  ["john", "hashcat"],
  ["gobuster", "ffuf"],
  ["wpscan", "nikto"],
  ["aircrack-ng", "kismet"],
  ["theharvester", "amass"],
  ["burpsuite", "sqlmap"],
];

function ToolPicker({
  value,
  onChange,
  disabled,
  exclude,
  placeholder,
}: {
  value: string | null;
  onChange: (slug: string) => void;
  disabled?: boolean;
  exclude?: string | null;
  placeholder: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return TOOLS.slice(0, 8);
    return TOOLS.filter(
      (t) =>
        t.slug !== exclude &&
        (t.name.toLowerCase().includes(query) ||
          t.slug.includes(query) ||
          (t.tags ?? []).some((tag) => tag.includes(query))),
    ).slice(0, 8);
  }, [q, exclude]);

  const selected = value ? TOOLS.find((t) => t.slug === value) : null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 focus-within:border-neon/50">
        <Search className="h-4 w-4 shrink-0 text-dim" />
        {selected ? (
          <>
            <span className="flex-1 truncate text-sm text-fg">
              {selected.name}
              <span className="ml-2 text-[11px] text-dim">{catLabel(selected.cat)}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setQ("");
              }}
              disabled={disabled}
              aria-label="Clear tool"
              className="rounded p-1 text-dim hover:text-rose"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches[0]) {
                  onChange(matches[0].slug);
                  setQ("");
                }
              }}
              disabled={disabled}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-dim"
            />
            {q && <X className="h-3.5 w-3.5 shrink-0 text-dim" />}
          </>
        )}
      </div>
      {open && !selected && q && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-panel2 shadow-2xl">
          {matches.length === 0 && (
            <li className="px-3 py-2 text-xs text-dim">No tools match “{q}”.</li>
          )}
          {matches.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(t.slug);
                  setQ("");
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-abyss"
              >
                <span className="text-sm text-fg">{t.name}</span>
                <span className="ml-auto shrink-0 text-[11px] text-dim">
                  {catLabel(t.cat)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ToolCard({
  tool,
  tag,
}: {
  tool: (typeof TOOLS)[number];
  tag: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.2em] text-neon">
            {tag}
          </p>
          <Link href={`/tools/${tool.slug}`} className="group inline-block">
            <h3 className="mt-1 text-xl font-bold text-fg group-hover:text-neon">
              {tool.name}
            </h3>
          </Link>
        </div>
        <span className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-0.5 text-[11px] text-neon">
          {tool.difficulty}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-mut">{tool.summary}</p>

      <div className="mt-4 rounded-lg border border-line/60 bg-abyss/50 px-3 py-2 font-mono text-[12px] text-emerald-300">
        {tool.install}
      </div>

      <ul className="mt-3 space-y-1">
        {(tool.commands ?? []).slice(0, 3).map((c, i) => (
          <li key={i} className="font-mono text-[11.5px] text-fg/80">
            <span className="mr-1.5 text-dim">$</span>
            {c}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(tool.tags ?? []).slice(0, 5).map((tagName) => (
          <span key={tagName} className="rounded-full border border-line/60 px-2 py-0.5 text-[10.5px] text-dim">
            #{tagName}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CompareApp() {
  const [a, setA] = useState<string>("nmap");
  const [b, setB] = useState<string>("masscan");

  const toolA = TOOLS.find((t) => t.slug === a);
  const toolB = TOOLS.find((t) => t.slug === b);

  const rows = toolA && toolB ? compareRows(toolA, toolB) : [];
  const verdict = toolA && toolB ? compareVerdict(toolA, toolB) : "";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <ToolPicker
          value={a}
          onChange={setA}
          exclude={toolB?.slug}
          placeholder="Search a tool…"
        />
        <button
          type="button"
          onClick={() => {
            setA(b);
            setB(a);
          }}
          aria-label="Swap tools"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-neon/40 bg-neon/10 text-neon transition-colors hover:bg-neon/25"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <ToolPicker
          value={b}
          onChange={setB}
          exclude={toolA?.slug}
          placeholder="Search a tool…"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED.map(([sa, sb]) => (
          <button
            key={`${sa}-${sb}`}
            type="button"
            onClick={() => {
              setA(sa);
              setB(sb);
            }}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              a === sa && b === sb
                ? "border-neon/50 bg-neon/15 text-neon"
                : "border-line/60 text-mut hover:border-neon/40 hover:text-neon"
            }`}
          >
            {sa} vs {sb}
          </button>
        ))}
      </div>

      {toolA && toolB ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolCard tool={toolA} tag="Tool A" />
            <ToolCard tool={toolB} tag="Tool B" />
          </div>

          <div className="rounded-xl border border-neon/30 bg-neon/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-neon">
              <Scale className="h-4 w-4" /> Verdict
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg/90">{verdict}</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-edge">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge bg-panel2/60 text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-dim">
                    Attribute
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neon">
                    {toolA.name}
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neon">
                    {toolB.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.label}
                    className="border-b border-line/50 last:border-0 odd:bg-panel/50"
                  >
                    <td className="px-4 py-2.5 text-mut">{r.label}</td>
                    {r.both && r.a === r.b ? (
                      <td className="px-4 py-2.5 text-fg/90" colSpan={2}>
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Same: {r.both}
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-fg/90">{r.a}</td>
                        <td className="px-4 py-2.5 text-fg/90">{r.b}</td>
                      </>
                    )}
                  </tr>
                ))}
                {toolA.tags?.join(",") === toolB.tags?.join(",") && (
                  <tr className="bg-panel/50">
                    <td className="px-4 py-2.5 text-mut" colSpan={3}>
                      Both tools share the exact same tag set — they&apos;re near-interchangeable in scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-line bg-panel p-8 text-center text-mut">
          Pick a second tool above to see the comparison.
        </div>
      )}
    </div>
  );
}