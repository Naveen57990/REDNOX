"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TOOL_CATEGORIES, TOOLS, countByCategory } from "@/data/tools";
import type { ToolDifficulty } from "@/data/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { Search as SearchIcon, SearchX, FilterX } from "lucide-react";

const counts = countByCategory();

const PLATFORMS = [...new Set(TOOLS.map((t) => t.platform))].sort();
const DIFFICULTIES: ToolDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

export function ToolBrowser() {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>(() => {
    const c = params.get("cat");
    return c && TOOL_CATEGORIES.some((x) => x.id === c) ? c : "all";
  });
  const [platform, setPlatform] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | ToolDifficulty>("all");

  const activeFilters =
    (cat !== "all" ? 1 : 0) +
    (platform !== "all" ? 1 : 0) +
    (difficulty !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (cat !== "all" && t.cat !== cat) return false;
      if (platform !== "all" && t.platform !== platform) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (!q) return true;
      return [t.name, t.slug, t.summary, ...t.tags].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [query, cat, platform, difficulty]);

  const clearAll = () => {
    setQuery("");
    setCat("all");
    setPlatform("all");
    setDifficulty("all");
  };

  const selectCls =
    "rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-muted focus:border-neon/60 focus:outline-none";

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-abyss/90 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by tool name, tag or description…"
                className="w-full rounded-lg border border-line bg-panel py-3 pl-10 pr-4 text-sm text-white placeholder:text-dim focus:border-neon/60 focus:outline-none"
              />
            </div>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={selectCls}
              aria-label="Platform filter"
            >
              <option value="all">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "all" | ToolDifficulty)
              }
              className={selectCls}
              aria-label="Difficulty filter"
            >
              <option value="all">Any difficulty</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {activeFilters > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2.5 text-sm font-medium text-warn transition hover:bg-warn/20"
              >
                <FilterX size={15} />
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCat("all")}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                cat === "all"
                  ? "border-neon/60 bg-neon/15 text-neon"
                  : "border-line bg-panel text-muted hover:text-white"
              }`}
            >
              All ({TOOLS.length})
            </button>
            {TOOL_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  cat === c.id
                    ? "border-neon/60 bg-neon/15 text-neon"
                    : "border-line bg-panel text-muted hover:text-white"
                }`}
              >
                {c.icon} {c.label} ({counts[c.id] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {results.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-line py-20 text-center">
            <SearchX size={32} className="text-dim" />
            <p className="mt-4 text-sm font-medium text-muted">No tools match</p>
            <p className="mt-1 text-xs text-dim">
              Try broadening your search or clearing some filters.
            </p>
            <button
              onClick={clearAll}
              className="mt-5 rounded-lg border border-neon/40 bg-neon/10 px-4 py-2 text-xs font-semibold text-neon transition hover:bg-neon/20"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-dim">
              Showing {results.length} of {TOOLS.length} tools
              {activeFilters > 0 && ` · ${activeFilters} active filter${activeFilters !== 1 ? "s" : ""}`}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}