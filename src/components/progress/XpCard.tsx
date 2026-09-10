"use client";

import Link from "next/link";
import { Flame, ChevronRight } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { xpForLevel } from "@/lib/progress/types";

export function XpCard() {
  const { progress, level, xpInto } = useProgress();
  const levelXp = xpForLevel(level);
  const pct = Math.min(100, Math.round((xpInto / levelXp) * 100));
  const unlocked = progress.achievements.length;

  return (
    <Link
      href="/profile"
      className="block rounded-xl border border-neon/30 bg-gradient-to-br from-neon/10 to-transparent p-5 transition hover:border-neon/50"
    >
      <div className="flex items-center justify-between">
        <p className="mono text-xs uppercase tracking-[0.2em] text-neon">Level {level}</p>
        <span className="flex items-center gap-1.5 text-xs text-mut">
          <Flame size={13} className={progress.streak >= 3 ? "text-neon" : "text-dim"} />
          {progress.streak}-day streak
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-line bg-panel2">
        <div className="h-full rounded-full bg-neon" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-mut">
          {xpInto} / {levelXp} XP
        </span>
        <span className="text-mut">{unlocked} achievements</span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-sm font-medium text-neon">
        View my progress <ChevronRight size={14} />
      </p>
    </Link>
  );
}