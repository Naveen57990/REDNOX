"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCcw, Sparkles, AlertTriangle, Type, Hash, CaseUpper, CaseLower, Binary, Split, CaseSensitive, CopyPlus } from "lucide-react";

interface GenOptions {
  words: string[];
  prefix: string;
  suffix: string;
  numbers: boolean;
  special: boolean;
  upper: boolean;
  lower: boolean;
  capitalize: boolean;
  leet: boolean;
  separators: boolean;
  doubled: boolean;
  minLen: number;
  maxLen: number;
}

const NUMBER_SET = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
  "12", "123", "1234", "12345", "987", "666", "007",
  "2000", "2005", "2010", "2015", "2020", "2024", "2025", "2026",
  "69", "420",
];
const SPECIAL_SET = ["!", "@", "#", "$", "%", "*", "?", ".", "-", "_", "&"];
const SEPARATOR_SET = ["-", "_", ".", "@"];

const LEET_MAP: Record<string, string> = {
  a: "4", b: "8", e: "3", g: "9", i: "1", l: "1", o: "0",
  s: "5", t: "7", z: "2",
};

const DEFAULT_WORDS =
  "admin\npassword\nkali\nroot\nsecret\nletmein\nqwerty\nwelcome\njordan\niloveyou\nmaster\nmonkey";

function toLeet(word: string): string {
  return word
    .split("")
    .map((c) => LEET_MAP[c.toLowerCase()] ?? c)
    .join("");
}

const MAX_CAP = 200000;

function generate(opts: GenOptions): { list: string[]; truncated: boolean } {
  const out = new Set<string>();
  const {
    prefix, suffix, numbers, special, upper, lower,
    capitalize, leet, separators, doubled, minLen, maxLen,
  } = opts;

  const variants = (w: string): string[] => {
    const v = new Set<string>([w]);
    if (upper && w !== w.toUpperCase()) v.add(w.toUpperCase());
    if (lower && w !== w.toLowerCase()) v.add(w.toLowerCase());
    if (capitalize) {
      v.add(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      if (upper) v.add(w.charAt(0).toUpperCase() + w.slice(1));
    }
    if (leet) {
      const lw = toLeet(w);
      v.add(lw);
      if (upper) v.add(lw.toUpperCase());
      if (capitalize) {
        v.add(lw.charAt(0).toUpperCase() + lw.slice(1));
      }
    }
    return [...v];
  };

  const consider = (cand: string) => {
    const len = cand.length;
    if (len < minLen || len > maxLen) return;
    if (out.size >= MAX_CAP) return;
    out.add(cand);
  };

  for (const raw of opts.words) {
    const word = raw.trim();
    if (!word) continue;
    const sSep = separators ? [...SEPARATOR_SET, ""] : [""];

    for (const v0 of variants(word)) {
      for (const s1 of sSep) {
        const prefixed = prefix + s1 + v0;
        const suffixed = v0 + s1 + suffix;
        const cores: string[] = [
          prefixed,
          v0,
          suffixed,
        ];
        if (prefix && suffix && separators) cores.push(prefix + s1 + v0 + s1 + suffix);

        for (const core of new Set(cores)) {
          consider(core);
          if (doubled) {
            consider(core + core);
            consider(core + s1 + core);
            consider(v0 + v0);
          }
          if (numbers) {
            for (const n of NUMBER_SET) {
              consider(core + n);
              consider(n + core);
              consider(core + n + core);
              if (prefix) consider(prefix + n + v0);
            }
          }
          if (special) {
            for (const s of SPECIAL_SET) {
              consider(core + s);
              consider(s + core);
              if (numbers) {
                for (const n of NUMBER_SET.slice(0, 6)) consider(core + n + s);
              }
            }
          }
        }
      }
    }
  }

  return { list: [...out], truncated: out.size >= MAX_CAP };
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WordlistBuilder() {
  const [words, setWords] = useState(DEFAULT_WORDS);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [numbers, setNumbers] = useState(true);
  const [special, setSpecial] = useState(false);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [capitalize, setCapitalize] = useState(true);
  const [leet, setLeet] = useState(true);
  const [separators, setSeparators] = useState(true);
  const [doubled, setDoubled] = useState(true);
  const [minLen, setMinLen] = useState(6);
  const [maxLen, setMaxLen] = useState(16);

  const [generated, setGenerated] = useState<string[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const opts: GenOptions = useMemo(
    () => ({
      words: words.split("\n"),
      prefix: prefix.trim(),
      suffix: suffix.trim(),
      numbers,
      special,
      upper,
      lower,
      capitalize,
      leet,
      separators,
      doubled,
      minLen,
      maxLen,
    }),
    [words, prefix, suffix, numbers, special, upper, lower, capitalize, leet, separators, doubled, minLen, maxLen],
  );

  const sizeEstimate = useMemo(() => {
    const avg = Math.max(6, (minLen + maxLen) / 2) + 1;
    return generated.length === 0 ? 0 : generated.length * Math.min(avg, 24);
  }, [generated, minLen, maxLen]);

  const generateList = () => {
    if (minLen > maxLen) {
      setInvalid(true);
      setGenerated([]);
      setTruncated(false);
      return;
    }
    setInvalid(false);
    const { list, truncated } = generate(opts);
    setGenerated(list);
    setTruncated(truncated);
  };

  const download = () => {
    if (generated.length === 0) return;
    const blob = new Blob([generated.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyberlab-wordlist.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setWords(DEFAULT_WORDS);
    setPrefix("");
    setSuffix("");
    setNumbers(true);
    setSpecial(false);
    setUpper(true);
    setLower(true);
    setCapitalize(true);
    setLeet(true);
    setSeparators(true);
    setDoubled(true);
    setMinLen(6);
    setMaxLen(16);
    setGenerated([]);
    setTruncated(false);
    setInvalid(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Wordlist <span className="text-neon">Generator</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Craft targeted wordlists for <span className="text-warn">authorized</span>{" "}
          password auditing, lab exercises and CTF challenges. Combine base
          keywords with prefixes, suffixes, numbers and special characters.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Controls */}
        <div className="space-y-4 rounded-xl border border-line bg-panel p-5">
          <label className="block">
            <span className="flex items-center gap-1.5 text-sm text-muted">
              <Type size={14} className="text-neon" /> Base keywords <span className="text-dim">(one per line)</span>
            </span>
            <textarea
              value={words}
              onChange={(e) => setWords(e.target.value)}
              rows={5}
              className="mt-1.5 w-full rounded-lg border border-line bg-abyss px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-neon/60"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-muted">Prefix</span>
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. admin"
                className="mt-1.5 w-full rounded-lg border border-line bg-abyss px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-neon/60"
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted">Suffix</span>
              <input
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. corp"
                className="mt-1.5 w-full rounded-lg border border-line bg-abyss px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-neon/60"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                [numbers, setNumbers, "Numbers", "0–9, 12, 123, years…", Hash],
                [special, setSpecial, "Special characters", "! @ # $ % * ? & . -", Sparkles],
                [upper, setUpper, "Uppercase", "e.g. ADMIN", CaseUpper],
                [lower, setLower, "Lowercase", "e.g. admin", CaseLower],
                [capitalize, setCapitalize, "Capitalize", "e.g. Admin", CaseSensitive],
                [leet, setLeet, "Leetspeak", "e.g. 4dm1n, p4ssw0rd", Binary],
                [separators, setSeparators, "Separators", "- _ . @ between words", Split],
                [doubled, setDoubled, "Doubling", "wordword, 123word123", CopyPlus],
              ] as const
            ).map(([checked, set, label, desc, Icon]) => (
              <label
                key={label}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line px-3 py-2.5 transition hover:border-neon/30"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => set(e.target.checked)}
                  className="mt-0.5 accent-neon"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm text-white">
                    <Icon size={13} className="text-neon" /> {label}
                  </span>
                  <span className="text-[11px] text-dim">{desc}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-muted">
                Min length: <span className="mono text-neon">{minLen}</span>
              </span>
              <input
                type="range"
                min={4}
                max={24}
                value={minLen}
                onChange={(e) => setMinLen(Number(e.target.value))}
                className="mt-2 w-full accent-neon"
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted">
                Max length: <span className="mono text-neon">{maxLen}</span>
              </span>
              <input
                type="range"
                min={4}
                max={30}
                value={maxLen}
                onChange={(e) => setMaxLen(Number(e.target.value))}
                className="mt-2 w-full accent-neon"
              />
            </label>
          </div>
          <p className="text-[11px] text-dim">
            Candidates shorter than the min or longer than the max are dropped.
          </p>

          <div className="flex gap-2">
            <button
              onClick={generateList}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neon px-4 py-3 text-sm font-semibold text-black transition hover:bg-neon/85"
            >
              <Sparkles size={15} /> Generate Wordlist
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-3 text-sm font-medium text-muted transition hover:border-rose/40 hover:text-rose"
            >
              <RefreshCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-white">Generated output</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-neon/10 px-3 py-1 font-mono font-bold text-neon">
                  {generated.length.toLocaleString()} entries
                </span>
                <span className="font-mono text-muted">{fmt(sizeEstimate)}</span>
              </div>
            </div>

            {invalid && (
              <p className="mt-3 rounded-md border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
                Min length cannot exceed max length. Adjust the ranges.
              </p>
            )}
            {truncated && (
              <p className="mt-3 rounded-md border border-warn/30 bg-warn/5 px-3 py-2 text-xs text-warn">
                Output capped at 200,000 entries for this session. Tighten the
                settings to reduce size.
              </p>
            )}

            <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-line bg-black/50 p-3 font-mono text-xs leading-relaxed text-muted">
              {generated.length === 0 ? (
                <p className="p-6 text-center text-sm text-dim">
                  {invalid
                    ? "Fix the length ranges to generate."
                    : "Generate a wordlist to see a preview here."}
                </p>
              ) : (
                <>
                  {generated.slice(0, 200).map((w, i) => (
                    <div key={i} className="break-all">{w}</div>
                  ))}
                  {generated.length > 200 && (
                    <p className="mt-2 border-t border-line pt-2 text-dim">
                      … and {generated.length - 200} more (preview limited to 200)
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={download}
              disabled={generated.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-neon/50 bg-neon/10 px-4 py-3 text-sm font-semibold text-neon transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={15} /> Download Wordlist (.txt)
            </button>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn/5 p-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-warn">Ethical use only.</span>{" "}
              Use generated wordlists only on systems and environments you own or
              are <span className="text-white">explicitly authorized</span> to
              test. Attempting to bypass authentication on other networks is
              illegal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}