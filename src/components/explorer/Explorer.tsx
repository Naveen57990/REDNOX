"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TOOLS, countByCategory, getFeaturedTools } from "@/data/tools";
import type { EnrichedTool } from "@/data/tools";
import { ExplorerToolCard } from "./ExplorerToolCard";
import { ToolDetailModal } from "./ToolDetailModal";
import { useSavedTools } from "./useSavedTools";
import {
  Search as SearchIcon,
  SearchX,
  Star,
  Bookmark,
  Bug,
  Globe,
  KeyRound,
  Wifi,
  Radar,
  Zap,
  Ghost,
  Microscope,
  Cpu,
  FileText,
  Layers,
  type LucideIcon,
} from "lucide-react";

const counts = countByCategory();
const featuredTools = getFeaturedTools();

const SPECIAL: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "popular", label: "Popular Tools", Icon: Star },
  { id: "saved", label: "Saved Tools", Icon: Bookmark },
];

const SIDEBAR: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "recon", label: "Information Gathering", Icon: SearchIcon },
  { id: "vuln", label: "Vulnerability Analysis", Icon: Bug },
  { id: "web", label: "Web Application Security", Icon: Globe },
  { id: "password", label: "Password Security", Icon: KeyRound },
  { id: "wireless", label: "Wireless Security", Icon: Wifi },
  { id: "sniff", label: "Sniffing and Spoofing", Icon: Radar },
  { id: "exploit", label: "Exploitation Concepts", Icon: Zap },
  { id: "post", label: "Post-Exploitation Concepts", Icon: Ghost },
  { id: "forensics", label: "Forensics", Icon: Microscope },
  { id: "reverse", label: "Reverse Engineering", Icon: Cpu },
  { id: "reporting", label: "Reporting", Icon: FileText },
];

export function Explorer() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState<EnrichedTool | null>(null);
  const { saved, toggleSaved } = useSavedTools();
  const contentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      const inCat =
        cat === "all" ||
        t.cat === cat ||
        (cat === "popular" && t.featured) ||
        (cat === "saved" && saved.has(t.slug));
      if (!inCat) return false;
      if (!q) return true;
      return [t.name, t.slug, t.summary, t.cat, ...t.tags].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [query, cat, saved]);

  const idleTimer = useRef<number | null>(null);

  const flashBusy = () => {
    setBusy(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setBusy(false), 260);
  };

  useEffect(
    () => () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    },
    [],
  );

  const changeQuery = (v: string) => {
    flashBusy();
    setQuery(v);
  };

  const changeCat = (v: string) => {
    flashBusy();
    setCat(v);
  };

  const scrollToContent = () =>
    contentRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
        <div className="pointer-events-none absolute -right-24 top-10 hidden h-72 w-72 rounded-full bg-neon/10 blur-3xl md:block" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-24">
          <p className="mono mb-4 inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-medium text-neon">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon" />
            Your authorized cybersecurity learning workspace
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            EVERYTHING IN{" "}
            <span className="bg-gradient-to-r from-neon to-cyber bg-clip-text text-transparent">
              ONE PLACE
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Learn cybersecurity, explore authorized tools, practice Linux
            concepts, follow structured roadmaps, and build skills in a safe
            environment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={scrollToContent}
              className="glow-pulse rounded-lg bg-neon px-6 py-3 text-sm font-semibold text-black transition hover:bg-neon/85"
            >
              Get Started
            </button>
            <a
              href="#content"
              onClick={(e) => {
                e.preventDefault();
                scrollToContent();
              }}
              className="rounded-lg border border-line bg-panel/70 px-6 py-3 text-sm font-medium text-white transition hover:border-neon/50 hover:text-neon"
            >
              Browse the tools ↓
            </a>
          </div>
        </div>
      </section>

      {/* Content */}
      <div ref={contentRef} id="content" className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Category sidebar */}
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dim">
              Categories
            </p>
            <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              <button
                onClick={() => changeCat("all")}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  cat === "all"
                    ? "border-neon/50 bg-neon/10 text-neon"
                    : "border-line bg-panel text-muted hover:border-neon/30 hover:text-white"
                } lg:justify-between`}
              >
                <span className="flex items-center gap-2">
                  <Layers size={15} /> All Categories
                </span>
                <span className="ml-auto rounded-full bg-abyss px-2 py-0.5 font-mono text-[10px] lg:ml-2">
                  {TOOLS.length}
                </span>
              </button>
              {SPECIAL.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => changeCat(id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    cat === id
                      ? "border-amber/50 bg-amber/10 text-amber"
                      : "border-line bg-panel text-muted hover:border-amber/40 hover:text-white"
                  } lg:justify-between`}
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      size={15}
                      className={cat === id ? "fill-amber/20" : ""}
                    />{" "}
                    {label}
                  </span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] lg:ml-2 ${
                      id === "saved"
                        ? "bg-neon/15 text-neon"
                        : "bg-abyss text-dim"
                    }`}
                  >
                    {id === "popular"
                      ? featuredTools.length
                      : saved.size}
                  </span>
                </button>
              ))}
              {SIDEBAR.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => changeCat(id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    cat === id
                      ? "border-neon/50 bg-neon/10 text-neon"
                      : "border-line bg-panel text-muted hover:border-neon/30 hover:text-white"
                  } lg:justify-between`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={15} /> {label}
                  </span>
                  <span className="ml-auto rounded-full bg-abyss px-2 py-0.5 font-mono text-[10px] lg:ml-2">
                    {counts[id] || 0}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content column */}
          <div>
            <div className="relative">
              <SearchIcon
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim"
              />
              <input
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                placeholder="Search cybersecurity tools and concepts..."
                className="w-full rounded-xl border border-line bg-panel py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-dim focus:border-neon/60 focus:shadow-[0_0_0_3px_rgba(45,223,142,0.12)] focus:outline-none"
              />
            </div>

            <p className="mb-4 mt-5 text-xs text-dim">
              {busy
                ? "Searching catalog…"
                : filtered.length === 0
                  ? "Nothing matches that search."
                  : `Found ${filtered.length} ${filtered.length === 1 ? "result" : "results"}${
                      cat !== "all"
                        ? ` in ${
                            SPECIAL.find((s) => s.id === cat)?.label ??
                            SIDEBAR.find((s) => s.id === cat)?.label ??
                            "catalog"
                          }`
                        : ""
                    }`}
            </p>

            {busy ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-xl border border-line bg-panel"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-line py-20 text-center">
                {cat === "saved" ? (
                  <>
                    <Bookmark size={34} className="text-dim" />
                    <p className="mt-4 text-sm font-medium text-muted">
                      No saved tools yet
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-dim">
                      Tap the bookmark icon on any tool to keep it here for
                      quick access.
                    </p>
                  </>
                ) : (
                  <>
                    <SearchX size={34} className="text-dim" />
                    <p className="mt-4 text-sm font-medium text-muted">
                      No tools or concepts found
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-dim">
                      Try a different keyword, or pick another category. Searches
                      match tool names, categories, tags and descriptions.
                    </p>
                  </>
                )}
                <button
                  onClick={() => {
                    changeQuery("");
                    changeCat("all");
                  }}
                  className="mt-5 rounded-lg border border-neon/40 bg-neon/10 px-4 py-2 text-xs font-semibold text-neon transition hover:bg-neon/20"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((t) => (
                  <ExplorerToolCard
                    key={t.slug}
                    tool={t}
                    onOpen={setSelected}
                    saved={saved.has(t.slug)}
                    onToggleSaved={toggleSaved}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <ToolDetailModal
          tool={selected}
          saved={saved.has(selected.slug)}
          onToggleSaved={toggleSaved}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}