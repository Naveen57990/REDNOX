"use client";

import { useMemo, useState } from "react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { buildDaily, CHALLENGE_QUESTIONS, type ChallengeQuestion } from "@/lib/challenge/generator";
import { todayIso } from "@/lib/progress/types";

type Phase = "intro" | "quiz" | "result";

export function DailyChallenge() {
  const { progress, level, recordQuiz } = useProgress();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const today = todayIso();
  const todayEntry = progress.daily.find((d) => d.date === today);
  const lastPct = useMemo(() => {
    const last = [...progress.daily].reverse().find((d) => d.date !== today);
    return last && last.total > 0 ? last.score / last.total : null;
  }, [progress.daily, today]);

  const start = () => {
    const built = buildDaily(today, null, level, lastPct).map((q, i) => ({
      ...q,
      id: `${q.id}:${i}`,
    }));
    setQuestions(built);
    setIdx(0);
    setPicked(null);
    setAnswers([]);
    setPhase("quiz");
  };

  const q = questions[idx];
  const answered = picked !== null;

  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
  };

  const next = () => {
    setAnswers((a) => [...a, picked as number]);
    setPicked(null);
    if (idx + 1 >= questions.length) {
      const score = [...answers, picked].filter((a, i) => a === questions[i].answer).length;
      recordQuiz({ score, total: questions.length });
      setPhase("result");
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (phase === "intro") {
    const hasDone = !!todayEntry;
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-line bg-panel p-6">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">Daily Challenge</p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {hasDone ? `Today's run: ${todayEntry.score}/${todayEntry.total}` : "One short quiz, every day."}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Questions scale with your level (currently LV {level}). Answering correctly earns 2 XP each —
          finish before midnight to keep your {progress.streak}-day streak alive.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-muted">
          <li>· {CHALLENGE_QUESTIONS} questions, ~2 minutes</li>
          <li>· Streak +1 if you play today</li>
          <li>· {progress.streak > 0 ? `Best run: ${Math.max(...progress.daily.map((d) => d.score))}/${CHALLENGE_QUESTIONS}` : "No runs yet"}</li>
        </ul>
        <div className="mt-5 flex gap-3">
          <button
            onClick={start}
            className="rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            {hasDone ? "Replay today's quiz" : "Start today's challenge"}
          </button>
          {hasDone && (
            <button
              onClick={() => setPhase("result")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:border-neon/40 hover:text-fg"
            >
              View results
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const score = questions.filter((question, i) => answers[i] === question.answer).length;
    const perfect = score === questions.length;
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-line bg-panel p-6">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">Results</p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {score}/{questions.length} —{" "}
          {perfect ? "Flawless." : score >= 4 ? "Sharp." : score >= 2 ? "Getting there." : "Recon the basics again."}
        </h2>
        <p className="mt-2 text-sm text-muted">
          +{score * 2} XP banked · streak{" "}
          {score >= 3 ? `continues at ${progress.streak}` : "needs a play to renew"}
        </p>
        <div className="mt-5 space-y-4">
          {questions.map((question, i) => {
            const correct = answers[i] === question.answer;
            return (
              <div key={question.id} className="rounded-lg border border-line bg-panel2 p-4">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 text-sm ${correct ? "text-emerald-300" : "text-rose"}`}>
                    {correct ? "✓" : "✗"}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">{question.text}</p>
                    <p className={`text-xs ${correct ? "text-emerald-300" : "text-rose"}`}>
                      {question.options[question.answer]}
                    </p>
                    <p className="text-xs text-muted">{question.explain}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setPhase("intro")}
          className="mt-5 rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:border-neon/40 hover:text-fg"
        >
          Back to overview
        </button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-line bg-panel p-6">
      <div className="flex items-center justify-between">
        <span className="mono text-xs uppercase tracking-[0.25em] text-neon">
          Question {idx + 1} / {questions.length}
        </span>
        <span className="mono text-xs text-muted">
          Tier {q.tier} · LV {level} adaptive
        </span>
      </div>
      <p className="mt-4 text-base font-medium leading-relaxed text-white">{q.text}</p>
      <div className="mt-5 space-y-2">
        {q.options.map((opt, i) => {
          const isAnswer = answered && i === q.answer;
          const isPick = answered && i === picked;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={answered}
              className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                isAnswer
                  ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                  : isPick
                    ? "border-rose-400/60 bg-rose-400/10 text-rose"
                    : answered
                      ? "border-line bg-panel2 text-muted"
                      : "border-line bg-panel2 text-fg hover:border-neon/40"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <p className="mt-4 rounded-lg border border-line bg-panel2 p-3 text-xs leading-relaxed text-muted">
            {q.explain}
          </p>
          <button
            onClick={next}
            className="mt-4 rounded-lg bg-neon px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            {idx + 1 >= questions.length ? "Finish" : "Next"}
          </button>
        </>
      )}
    </div>
  );
}