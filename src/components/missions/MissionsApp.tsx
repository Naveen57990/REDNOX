"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  TerminalSquare,
  Trophy,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  MISSIONS,
  installStep,
  type MissionStep,
  MISSION_XP,
} from "@/data/missions";
import { useProgress } from "@/components/progress/ProgressProvider";

const DIFF_COLOR: Record<string, string> = {
  Easy: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  Medium: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  Advanced: "border-rose-400/40 bg-rose-400/10 text-rose-300",
};

function stepMatches(step: MissionStep, raw: string): boolean {
  const r = raw.trim().toLowerCase();
  if (!r) return false;
  if (step.startsWith && step.startsWith.length > 0) {
    if (!step.startsWith.some((p) => r.startsWith(p.toLowerCase()))) return false;
  }
  if (step.includes && step.includes.length > 0) {
    if (!step.includes.every((s) => r.includes(s.toLowerCase()))) return false;
  }
  return true;
}

function StepRow({
  step,
  done,
  onRun,
}: {
  step: MissionStep;
  done: boolean;
  onRun: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
        done
          ? "border-emerald-400/40 bg-emerald-400/5"
          : "border-line/60 bg-panel/60"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          done
            ? "border-emerald-400 bg-emerald-400 text-abyss"
            : "border-edge2 bg-abyss"
        }`}
      >
        {done && <Check className="h-3 w-3" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] ${done ? "text-dim" : "text-fg"}`}>
          {step.label}
        </p>
        <code className="mt-0.5 block truncate font-mono text-[11px] text-emerald-300/80">
          $ {step.cmd}
        </code>
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={done}
        aria-label={`Run ${step.cmd}`}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-neon/40 bg-neon/10 px-2 py-1 text-[11px] text-neon transition-colors hover:bg-neon/20 disabled:opacity-40"
      >
        <Play className="h-3 w-3" /> Run
      </button>
    </li>
  );
}

export function MissionsApp() {
  const { progress, recordMission } = useProgress();
  const [activeSlug, setActiveSlug] = useState<string | null>(MISSIONS[0].slug);
  const [doneSteps, setDoneSteps] = useState<Record<string, boolean[]>>({});
  const [toast, setToast] = useState<{ title: string; xp: number } | null>(null);
  const completionGuard = useRef<Record<string, boolean>>({});

  const active = MISSIONS.find((m) => m.slug === activeSlug) ?? null;

  useEffect(() => {
    const onRan = (e: Event) => {
      const raw = ((e as CustomEvent).detail as { raw?: string } | undefined)?.raw ?? "";
      if (!active || !raw.trim()) return;
      setDoneSteps((prev) => {
        const steps = active.install
          ? [installStep(active), ...active.steps]
          : active.steps;
        const cur = prev[active.slug] ?? steps.map(() => false);
        const next = cur.map((d, i) => d || stepMatches(steps[i], raw));
        if (next.every(Boolean) && !completionGuard.current[active.slug]) {
          completionGuard.current[active.slug] = true;
          const wasDone = progress.missions[active.slug]?.done;
          const xp = active.rewardXp ?? MISSION_XP[active.difficulty];
          recordMission(active.slug, xp);
          setToast({
            title: wasDone
              ? `${active.title} completed again`
              : `Mission complete: ${active.title}`,
            xp: wasDone ? 0 : xp,
          });
          window.setTimeout(() => setToast(null), 4200);
        }
        return { ...prev, [active.slug]: next };
      });
    };
    window.addEventListener("gk-terminal-ran", onRan);
    return () => window.removeEventListener("gk-terminal-ran", onRan);
  }, [active, progress.missions, recordMission]);

  function resetMission(slug: string) {
    completionGuard.current[slug] = false;
    setDoneSteps((prev) => ({ ...prev, [slug]: [] }));
  }

  const steps = active
    ? active.install
      ? [installStep(active), ...active.steps]
      : active.steps
    : [];
  const stepState = active ? doneSteps[active.slug] ?? steps.map(() => false) : [];
  const allDone = active ? stepState.length > 0 && stepState.every(Boolean) : false;
  const doneCount = stepState.filter(Boolean).length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed left-1/2 top-20 z-[90] -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/50 bg-panel2 px-5 py-3 shadow-[0_0_40px_-10px_var(--accent)]">
            <Trophy className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-fg">{toast.title}</p>
              <p className="text-[12px] text-emerald-300">
                {toast.xp > 0 ? `+${toast.xp} XP earned` : "Reward already banked before"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
        <aside className="space-y-2 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
          {MISSIONS.map((m) => {
            const done = progress.missions[m.slug]?.done;
            const isActive = activeSlug === m.slug;
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => {
                  setActiveSlug(m.slug);
                  resetMission(m.slug);
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  isActive
                    ? "border-neon/50 bg-panel2"
                    : "border-line/60 bg-panel/50 hover:border-neon/30"
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-fg">
                      {m.title}
                    </span>
                    {done && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[10px] ${DIFF_COLOR[m.difficulty]}`}
                    >
                      {m.difficulty}
                    </span>
                    <span className="text-[11px] text-dim">
                      {MISSION_XP[m.difficulty]} XP
                    </span>
                  </span>
                </span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-neon" : "text-dim"}`}
                />
              </button>
            );
          })}
        </aside>

        <section className="rounded-2xl border border-edge bg-panel p-5">
          {active ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-[12px] text-dim">
                    <span className="text-lg leading-none">{active.icon}</span>
                    {active.category} · {MISSION_XP[active.difficulty]} XP
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-fg">{active.title}</h2>
                  <p className="mt-1 text-[13px] text-mut">{active.tagline}</p>
                  <p className="mt-2 rounded-lg border border-line/60 bg-abyss/40 px-3 py-2 text-[12.5px] text-neon2">
                    🎯 {active.objective}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${DIFF_COLOR[active.difficulty]}`}
                >
                  {active.difficulty}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg">
                  Steps{" "}
                  <span className="text-mut">
                    ({doneCount}/{steps.length})
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => resetMission(active.slug)}
                  className="flex items-center gap-1.5 rounded-lg border border-line/60 px-2 py-1 text-[11px] text-mut transition-colors hover:border-rose/50 hover:text-rose"
                >
                  <RotateCcw className="h-3 w-3" /> Restart
                </button>
              </div>

              <ul className="mt-3 space-y-2">
                {steps.map((s, i) => (
                  <StepRow
                    key={i}
                    step={s}
                    done={!!stepState[i]}
                    onRun={() => {
                      window.dispatchEvent(
                        new CustomEvent("gk-terminal-run", { detail: s.cmd }),
                      );
                    }}
                  />
                ))}
              </ul>

              {allDone && (
                <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
                  Mission complete — pat yourself on the back, then try a harder one.
                  <span className="block text-[12px] text-mut">
                    Related: check the{" "}
                    <Link href="/attacks" className="text-neon hover:underline">
                      attack playbooks
                    </Link>{" "}
                    to chain this into a full scenario.
                  </span>
                </p>
              )}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-mut">
              Pick a mission on the left to begin. Run each step in the terminal below.
            </p>
          )}
        </section>
      </div>

      <div className="flex items-center gap-2 border-b border-line pb-2">
        <TerminalSquare className="h-4 w-4 text-neon" />
        <span className="text-sm font-semibold text-fg">Mission terminal</span>
        <span className="ml-auto text-[11px] text-dim">
          Steps you run here are verified live — try the Run buttons
        </span>
      </div>
    </div>
  );
}