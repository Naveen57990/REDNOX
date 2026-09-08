"use client";

import type { EnrichedTool } from "@/data/tools";
import { ChevronRight, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { StarRating } from "./StarRating";

export function ExplorerToolCard({
  tool,
  onOpen,
  saved,
  onToggleSaved,
}: {
  tool: EnrichedTool;
  onOpen: (tool: EnrichedTool) => void;
  saved: boolean;
  onToggleSaved: (slug: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(tool)}
      className="card-hover group relative flex w-full flex-col rounded-xl border border-line bg-panel p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white group-hover:text-neon">
          {tool.name}
        </h3>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleSaved(tool.slug);
          }}
          role="button"
          aria-label={saved ? "Remove from saved" : "Save tool"}
          aria-pressed={saved}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-abyss text-dim transition-all hover:border-neon/50 hover:text-neon"
        >
          {saved ? (
            <BookmarkCheck size={14} className="text-neon" />
          ) : (
            <Bookmark size={14} />
          )}
        </span>
      </div>

      {tool.featured && (
        <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-amber/50 bg-amber/15 px-2 py-0.5 text-[10px] font-semibold text-amber">
          <Star size={10} className="fill-amber" /> Popular · Powerful
        </span>
      )}

      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {tool.summary}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-dim">
          {tool.platform}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-neon">
          Learn More
          <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2.5">
        <StarRating stars={tool.stars} />
        <span
          className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
            tool.difficulty === "Beginner"
              ? "border-neon/40 bg-neon/10 text-neon"
              : tool.difficulty === "Intermediate"
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-red-400/40 bg-red-400/10 text-red-400"
          }`}
        >
          {tool.difficulty}
        </span>
      </div>
    </button>
  );
}