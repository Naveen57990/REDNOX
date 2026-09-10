"use client";

import { useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { XP } from "@/components/progress/ProgressProvider";
import { DETECTIVE_CASES, type DetectiveCase } from "@/data/detective";

export function DetectiveApp() {
  const { progress, recordDetective } = useProgress();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [stepMissed, setStepMissed] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const [solvedAt, setSolvedAt] = useState(false);

  const start = (slug: string) => {
    setActiveSlug(slug);
    setStepIdx(0);
    setPicked(null);
    setMisses(0);
    setStepMissed(false);
    setFirstTry(0);
    setSolvedAt(false);
  };

  const back = () => {
    setActiveSlug(null);
    setStepIdx(0);
    setPicked(null);
    setMisses(0);
    setStepMissed(false);
    setSolvedAt(false);
  };

  const answer = (i: number) => {
    if (picked !== null) return;
    const c = DETECTIVE_CASES.find((x) => x.slug === activeSlug) as DetectiveCase;
    setPicked(i);
    if (i === c.steps[stepIdx].answer) {
      if (!stepMissed) setFirstTry((f) => f + 1);
    } else {
      setMisses((m) => m + 1);
      setStepMissed(true);
    }
  };

  const next = () => {
    const c = DETECTIVE_CASES.find((x) => x.slug === activeSlug) as DetectiveCase;
    if (stepIdx + 1 >= c.steps.length) {
      recordDetective(c.slug, firstTry, c.difficulty);
      setSolvedAt(true);
    } else {
      setStepIdx((s) => s + 1);
      setPicked(null);
      setStepMissed(false);
    }
  };

  if (!activeSlug) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {DETECTIVE_CASES.map((c) => {
          const rec = progress.detective[c.slug];
          const xp = c.difficulty === "Easy" ? XP.detectiveEasy : XP.detectiveHard;
          return (
            <button
              key={c.slug}
              onClick={() => start(c.slug)}
              className="group rounded-xl border border-line bg-panel p-5 text-left transition hover:border-neon/40"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`mono text-[10px] uppercase tracking-[0.2em] ${
                    c.difficulty === "Easy" ? "text-emerald-300" : "text-amber"
                  }`}
                >
                  {c.difficulty === "Easy" ? "Easy" : "Hard"} · +{xp} XP
                </span>
                {rec?.solved && (
                  <span className="mono text-[10px] uppercase tracking-[0.2em] text-neon">
                    solved · best {rec.best}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-neon">
                {c.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{c.tagline}</p>
            </button>
          );
        })}
      </div>
    );
  }

  const c = DETECTIVE_CASES.find((x) => x.slug === activeSlug) as DetectiveCase;
  const step = c.steps[stepIdx];
  const isCorrect = picked === step.answer;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={back}
          className="mono text-xs text-muted transition hover:text-neon"
        >
          ← All cases
        </button>
        <span className="mono text-xs text-muted">
          Step {stepIdx + 1} / {c.steps.length}
        </span>
      </div>

      <div className="rounded-xl border border-line bg-panel p-6">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">{c.title}</p>
        {!solvedAt && <p className="mt-2 text-sm leading-relaxed text-muted">{c.tagline}</p>}

        {!solvedAt ? (
          <>
            <div className="mt-4 space-y-2 border-l-2 border-edge2 pl-4">
              {c.story.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-fg">
                  {p}
                </p>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-white">{step.q}</p>
              {step.options.map((opt, i) => {
                const chosen = picked === i;
                const showCorrect = picked !== null && i === step.answer;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={picked !== null}
                    className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                      showCorrect
                        ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                        : chosen
                          ? "border-rose-400/60 bg-rose-400/10 text-rose"
                          : picked !== null
                            ? "border-line bg-panel2 text-muted"
                            : "border-line bg-panel2 text-fg hover:border-neon/40"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {picked !== null && !isCorrect && (
              <p className="mt-4 rounded-lg border border-amber/30 bg-amber/5 p-3 text-xs text-amber">
                Clue: {step.clue} — try another option.
              </p>
            )}
            {picked !== null && isCorrect && (
              <>
                <p className="mt-4 rounded-lg border border-line bg-panel2 p-3 text-xs leading-relaxed text-muted">
                  {step.explain}
                </p>
                <button
                  onClick={next}
                  className="mt-4 rounded-lg bg-neon px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {stepIdx + 1 >= c.steps.length ? "Solved" : "Next"}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-4">
              <p className="text-sm font-semibold text-emerald-300">
                Case solved: {c.title}
              </p>
              <p className="mt-1 text-xs text-muted">
                Completed all {c.steps.length} steps
                {misses > 0 ? ` with ${misses} miss${misses === 1 ? "" : "es"}` : " on the first pass"} —{" "}
                +{c.difficulty === "Easy" ? XP.detectiveEasy : XP.detectiveHard} XP banked.
              </p>
            </div>
            <div className="space-y-3">
              {c.steps.map((s, i) => (
                <div key={i} className="rounded-lg border border-line bg-panel2 p-3">
                  <p className="text-xs font-medium text-fg">{i + 1}. {s.q}</p>
                  <p className="mt-1 text-xs text-muted">{s.explain}</p>
                </div>
              ))}
            </div>
            <button
              onClick={back}
              className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:border-neon/40 hover:text-fg"
            >
              Back to cases
            </button>
          </div>
        )}
      </div>
    </div>
  );
}