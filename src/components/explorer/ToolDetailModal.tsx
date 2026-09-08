"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { EnrichedTool } from "@/data/tools";
import { TOOL_CATEGORIES } from "@/data/tools";
import {
  X,
  ExternalLink,
  AlertTriangle,
  Box,
  Tag,
  MonitorSmartphone,
  Star,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { StarRating } from "./StarRating";

export function ToolDetailModal({
  tool,
  saved,
  onToggleSaved,
  onClose,
}: {
  tool: EnrichedTool;
  saved: boolean;
  onToggleSaved: (slug: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const category = TOOL_CATEGORIES.find((c) => c.id === tool.cat);

  const diffBadge =
    tool.difficulty === "Beginner"
      ? "border-neon/40 bg-neon/10 text-neon"
      : tool.difficulty === "Intermediate"
        ? "border-warn/40 bg-warn/10 text-warn"
        : "border-red-400/40 bg-red-400/10 text-red-400";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-panel shadow-2xl shadow-black/60 sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="mono flex h-9 w-9 items-center justify-center rounded-lg border border-neon/40 bg-neon/10 text-xl text-neon">
              &gt;_
            </span>
            <div>
              <h2 className="mono text-lg font-bold text-white">
                ${tool.name}
              </h2>
              <p className="text-[11px] text-dim">
                {category ? `${category.icon} ${category.label}` : tool.cat}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSaved(tool.slug)}
              aria-label={saved ? "Remove from saved" : "Save tool"}
              aria-pressed={saved}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all ${
                saved
                  ? "border-neon/60 bg-neon/15 text-neon"
                  : "border-line bg-abyss text-muted hover:border-neon/50 hover:text-neon"
              }`}
            >
              {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {saved ? "Saved" : "Save"}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-neon/50 hover:text-neon"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <section>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-dim">
                <Box size={13} className="text-neon" /> Overview
              </h3>
              {tool.featured && (
                <span className="flex items-center gap-1 rounded-full border border-amber/50 bg-amber/15 px-2 py-0.5 text-[10px] font-semibold text-amber">
                  <Star size={10} className="fill-amber" /> Popular · Powerful
                </span>
              )}
              <span className="ml-auto">
                <StarRating stars={tool.stars} size={13} />
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-white">
              {tool.summary}
            </p>
            <div className="mt-3 rounded-lg border border-neon/20 bg-neon/5 p-3">
              <p className="font-hand text-sm text-neon">in plain english</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {tool.plainExplain}
              </p>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-dim">
              <span className="text-neon">◎</span> General purpose
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {category?.blurb ?? "Cybersecurity utility."} Documented here for
              education and authorized security testing — never for attacking
              systems you do not own.
            </p>
          </section>

          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-dim">
              <Tag size={13} className="text-neon" /> Key terminology
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tool.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-abyss px-2.5 py-1 text-[11px] text-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-abyss p-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-dim">
                <MonitorSmartphone size={13} className="text-neon" /> Supported environments
              </h3>
              <p className="mt-1.5 text-sm text-white">{tool.platform}</p>
              <p className="mt-0.5 text-xs text-dim">Recommended: Kali Linux</p>
            </div>
            <div className="rounded-lg border border-line bg-abyss p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">
                Difficulty
              </h3>
              <span
                className={`mt-1.5 inline-block rounded border px-2 py-0.5 text-xs font-medium ${diffBadge}`}
              >
                {tool.difficulty}
              </span>
            </div>
          </section>

          {tool.commandExplains.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">
                Commands — what each one does
              </h3>
              <div className="mt-2 space-y-2">
                {tool.commandExplains.slice(0, 3).map((spec, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-line bg-black/60 px-3 py-2.5"
                  >
                    <p className="font-mono text-[13px] leading-relaxed text-neon">
                      {spec.cmd}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {spec.explain}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mono mt-2 text-[11px] text-dim">
                # Run these only against localhost, your own lab VMs, or CTF
                platforms with permission.
              </p>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">
              Educational notes
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
              <li>
                Understand <span className="text-white">what the tool reads</span>
                {" "}and <span className="text-white">what its output means</span> before automating anything.
              </li>
              <li>
                Combine with the AI Assistant to interpret flags, output, and
                methodology step by step.
              </li>
              <li>
                Practice the syntax in the Terminal Sandbox where safe, then
                apply it only inside your own lab environment.
              </li>
            </ul>
          </section>

          <div className="flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn/5 p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-warn">Legal &amp; ethical warning.</span>{" "}
              Unauthorized scanning, probing, or intrusion into systems you do
              not own is illegal in most jurisdictions. Only test systems you
              own or have explicit written authorization to assess.
            </p>
          </div>

          <Link
            href={`/tools/${tool.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neon/50 bg-neon/10 px-4 py-2.5 text-sm font-semibold text-neon transition hover:bg-neon/20"
          >
            <ExternalLink size={15} />
            Open full reference (commands, flags, install)
          </Link>
        </div>
      </div>
    </div>
  );
}