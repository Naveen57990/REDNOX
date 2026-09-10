"use client";

import Link from "next/link";
import { Flame, Trophy, Target, ShieldCheck, TerminalSquare, Package, Gauge } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ACHIEVEMENTS } from "@/lib/progress/achievements";
import { xpForLevel } from "@/lib/progress/types";
import { MISSIONS } from "@/data/missions";
import { DETECTIVE_CASES } from "@/data/detective";

export function ProfileApp() {
  const { progress, level, xpInto, xpNext, resetProgress } = useProgress();
  const levelXp = xpForLevel(level);
  const pct = Math.min(100, Math.round((xpInto / levelXp) * 100));

  const missionsDone = Object.values(progress.missions).filter((m) => m.done).length;
  const detectiveSolved = Object.values(progress.detective).filter((d) => d.solved).length;
  const toolsInstalled = Object.keys(progress.toolsInstalled).length;
  const unlocked = ACHIEVEMENTS.filter((a) => progress.achievements.includes(a.id)).length;

  const stats = [
    { icon: Flame, label: "Day streak", value: `${progress.streak}`, sub: "play daily to grow it" },
    { icon: Target, label: "Missions done", value: `${missionsDone}`, sub: `of ${MISSIONS.length}` },
    { icon: ShieldCheck, label: "Investigations", value: `${detectiveSolved}`, sub: `of ${DETECTIVE_CASES.length}` },
    { icon: Gauge, label: "Quizzes taken", value: `${progress.quizzesTaken}`, sub: "daily challenges" },
    { icon: Package, label: "Tools installed", value: `${toolsInstalled}`, sub: "in the lab sandbox" },
    { icon: TerminalSquare, label: "Terminal runs", value: `${progress.commandsRun}`, sub: "commands executed" },
  ];

  const bars = [
    { label: "Lab missions", pct: Math.min(100, (missionsDone / MISSIONS.length) * 100), value: `${missionsDone}/${MISSIONS.length}` },
    { label: "Exploit detective", pct: Math.min(100, (detectiveSolved / DETECTIVE_CASES.length) * 100), value: `${detectiveSolved}/${DETECTIVE_CASES.length}` },
    { label: "Daily challenges", pct: Math.min(100, (progress.daily.length / 7) * 100), value: `${progress.daily.length} played` },
    { label: "Distinct tools installed", pct: Math.min(100, (toolsInstalled / 10) * 100), value: `${toolsInstalled}/10` },
    { label: "Terminal commands", pct: Math.min(100, (progress.commandsRun / 50) * 100), value: `${progress.commandsRun}/50` },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-neon/40 bg-neon/10 font-display text-xl font-bold text-neon">
              {level}
            </div>
            <div>
              <p className="mono text-xs uppercase tracking-[0.25em] text-neon">Level {level}</p>
              <p className="mt-1 text-sm text-mut">
                {xpInto} / {levelXp} XP · {xpNext} to level {level + 1}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Reset all progress, XP and achievements? This cannot be undone.")) {
                resetProgress();
              }
            }}
            className="rounded-lg border border-rose/40 px-3 py-1.5 text-xs text-rose transition hover:bg-rose/10"
          >
            Reset progress
          </button>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full border border-line bg-panel2">
          <div
            className="h-full rounded-full bg-neon transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg text-white">
                <s.icon size={18} />
              </span>
              <Trophy
                size={16}
                className={s.label === "Day streak" && progress.streak >= 3 ? "text-neon" : "text-dim"}
              />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs font-medium text-fg">{s.label}</p>
            <p className="mt-0.5 text-xs text-mut">{s.sub}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-panel p-6">
        <h2 className="text-sm font-semibold text-fg">Skill bars</h2>
        <div className="mt-4 space-y-4">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-mut">{b.label}</span>
                <span className="mono text-neon">{b.value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-line bg-panel2">
                <div className="h-full rounded-full bg-neon/70" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/missions"
            className="rounded-lg border border-line bg-panel2 px-4 py-3 text-sm text-fg transition hover:border-neon/40 hover:text-neon"
          >
            → Run a lab mission
          </Link>
          <Link
            href="/challenge"
            className="rounded-lg border border-line bg-panel2 px-4 py-3 text-sm text-fg transition hover:border-neon/40 hover:text-neon"
          >
            → Today&apos;s daily challenge
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Achievements</h2>
          <span className="mono text-xs text-neon">
            {unlocked} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const owned = progress.achievements.includes(a.id);
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  owned ? "border-neon/40 bg-neon/5" : "border-line bg-panel2 opacity-55"
                }`}
              >
                <span className={`text-xl ${owned ? "" : "grayscale"}`}>{a.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${owned ? "text-neon" : "text-mut"}`}>
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-mut">{a.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}