"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ROADMAP_SECTIONS,
  TOTAL_ROADMAP_TOPICS,
} from "@/data/cyberlab/roadmap";
import type { RoadmapDifficulty, RoadmapTopic } from "@/data/cyberlab/roadmap";
import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Circle,
  LinkIcon,
  AlertTriangle,
  Award,
  BarChart3,
} from "lucide-react";

const STORAGE_KEY = "cyberlab-roadmap";

const TIER_THEME: Record<RoadmapDifficulty, { badge: string; dot: string }> = {
  Beginner: { badge: "border-neon/40 bg-neon/10 text-neon", dot: "bg-neon" },
  Intermediate: {
    badge: "border-warn/40 bg-warn/10 text-warn",
    dot: "bg-warn",
  },
  Advanced: {
    badge: "border-red-400/40 bg-red-400/10 text-red-400",
    dot: "bg-red-400",
  },
};

function loadDone(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function RoadmapApp() {
  const [done, setDone] = useState<Set<string>>(loadDone);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
    } catch {
      /* ignore */
    }
  }, [done]);

  const pct = Math.round((done.size / TOTAL_ROADMAP_TOPICS) * 100);

  const toggle = (title: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const toggleSection = (tier: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });

  const resetProgress = () => {
    if (
      window.confirm(
        "Reset all roadmap progress? Your completed items will be cleared.",
      )
    ) {
      setDone(new Set());
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Learning <span className="text-neon">Roadmap</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          A structured path from fundamentals to advanced practice. Mark topics
          complete as you master them — progress is saved in your browser and
          recalculated instantly.
        </p>
      </div>

      {/* Overall progress */}
      <div className="mb-8 rounded-xl border border-line bg-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart3 size={15} className="text-neon" /> Overall progress
          </h2>
          <span className="mono text-sm font-bold text-neon">{pct}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-abyss">
          <div
            className="h-full overflow-hidden rounded-full bg-neon transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          >
            <div className="bar-stripes h-full w-full opacity-40" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          {done.size} of {TOTAL_ROADMAP_TOPICS} topics complete
        </p>
        <button
          onClick={resetProgress}
          disabled={done.size === 0}
          className="mt-4 text-xs font-medium text-dim transition hover:text-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset progress
        </button>
      </div>

      {/* Sections */}
      <div className="relative space-y-8 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-line">
        {ROADMAP_SECTIONS.map((section) => {
          const sectionDone = section.topics.filter((t) => done.has(t.title)).length;
          const sectionPct = Math.round((sectionDone / section.topics.length) * 100);
          const isCollapsed = collapsed.has(section.tier);

          return (
            <section key={section.tier} className="relative pl-8">
              <span className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-neon/50 bg-abyss">
                <Award size={11} className="text-neon" />
              </span>

              <button
                onClick={() => toggleSection(section.tier)}
                className="group flex w-full items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <h2
                    className={`text-xl font-bold tracking-tight ${
                      section.tier === "Beginner"
                        ? "text-neon"
                        : section.tier === "Intermediate"
                          ? "text-warn"
                          : "text-red-400"
                    }`}
                  >
                    {section.tier}
                  </h2>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                    {sectionDone}/{section.topics.length}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-abyss">
                    <div
                      className={`h-full rounded-full bg-neon transition-all duration-500 ${
                        sectionPct === 100 ? "opacity-100" : "opacity-70"
                      }`}
                      style={{ width: `${sectionPct}%` }}
                    />
                  </div>
                  {isCollapsed ? (
                    <ChevronRight size={16} className="text-dim" />
                  ) : (
                    <ChevronDown size={16} className="text-dim" />
                  )}
                </div>
              </button>

              {!isCollapsed && (
                <div className="mt-4 space-y-3">
                  {section.topics.map((topic) => (
                    <RoadmapItem
                      key={topic.title}
                      topic={topic}
                      done={done.has(topic.title)}
                      onToggle={() => toggle(topic.title)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-10 flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn/5 p-4">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
        <p className="text-xs leading-relaxed text-muted">
          This roadmap is educational. Every advanced topic must be practiced
          only inside your own labs, VMs, or authorized CTF platforms — never
          against systems you do not own.
        </p>
      </div>
    </div>
  );
}

function RoadmapItem({
  topic,
  done,
  onToggle,
}: {
  topic: RoadmapTopic;
  done: boolean;
  onToggle: () => void;
}) {
  const theme = TIER_THEME[topic.difficulty];

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        done ? "border-neon/40 bg-neon/5" : "border-line bg-panel hover:border-neon/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            aria-label={done ? "Mark incomplete" : "Mark complete"}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
              done
                ? "border-neon bg-neon text-black"
                : "border-line text-dim hover:border-neon/60 hover:text-neon"
            }`}
          >
            {done ? <CircleCheck size={13} /> : <Circle size={13} />}
          </button>
          <div>
            <h3
              className={`text-sm font-semibold ${done ? "text-dim line-through" : "text-white"}`}
            >
              {topic.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {topic.description}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium ${theme.badge}`}
        >
          {topic.difficulty}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
        <span className="flex items-center gap-1 text-[11px] text-dim">
          <LinkIcon size={11} /> Resources:
        </span>
        {topic.resources.map((r) => (
          <Link
            key={r.href + r.label}
            href={r.href}
            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted transition hover:border-neon/40 hover:text-neon"
          >
            {r.label}
          </Link>
        ))}
      </div>
    </div>
  );
}