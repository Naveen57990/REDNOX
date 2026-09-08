import Link from "next/link";
import { Star } from "lucide-react";
import type { EnrichedTool } from "@/data/tools";
import { StarRating } from "@/components/explorer/StarRating";

function diffColor(d: string) {
  if (d === "Beginner") return "text-neon border-neon/40 bg-neon/10";
  if (d === "Intermediate") return "text-warn border-warn/40 bg-warn/10";
  return "text-red-400 border-red-400/40 bg-red-400/10";
}

export function ToolCard({ tool }: { tool: EnrichedTool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card-hover group block rounded-lg border border-line bg-panel p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white group-hover:text-neon">
          {tool.name}
        </h3>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${diffColor(tool.difficulty)}`}
        >
          {tool.difficulty}
        </span>
      </div>
      {tool.featured && (
        <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full border border-amber/50 bg-amber/15 px-2 py-0.5 text-[10px] font-semibold text-amber">
          <Star size={10} className="fill-amber" /> Popular
        </span>
      )}
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
        {tool.summary}
      </p>
      {tool.commands[0] && (
        <p className="mono mt-3 truncate rounded bg-abyss px-2 py-1.5 text-xs text-cyber/80">
          $ {tool.commands[0]}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded border border-line bg-abyss px-1.5 py-0.5 text-[10px] text-dim">
          {tool.platform}
        </span>
        {tool.tags.slice(0, 2).map((t) => (
          <span
            key={t}
            className="rounded border border-line px-1.5 py-0.5 text-[10px] text-dim"
          >
            #{t}
          </span>
        ))}
        <span className="ml-auto">
          <StarRating stars={tool.stars} />
        </span>
      </div>
    </Link>
  );
}