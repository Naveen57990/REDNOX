"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_PROGRESS,
  levelForXp,
  xpForLevel,
  xpIntoLevel,
  type ProgressState,
} from "@/lib/progress/types";
import { loadProgress, mergeProgress, saveProgress } from "@/lib/progress/store";
import { checkAchievements, getAchievement, type AchievementDef } from "@/lib/progress/achievements";

export const XP = {
  missionEasy: 15,
  missionMedium: 25,
  missionHard: 40,
  quizPerCorrect: 2,
  detectiveEasy: 30,
  detectiveHard: 50,
  achievement: 20,
};

interface ProgressContextValue {
  progress: ProgressState;
  level: number;
  xpInto: number;
  xpNext: number;
  fresh: AchievementDef[];
  dismissFresh: (id: string) => void;
  recordMission: (slug: string, score: number) => void;
  recordQuiz: (r: { score: number; total: number }) => void;
  recordDetective: (slug: string, score: number, difficulty: "Easy" | "Hard") => void;
  recordToolInstall: (pkg: string) => void;
  recordCommand: () => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(EMPTY_PROGRESS);
  const [fresh, setFresh] = useState<AchievementDef[]>([]);
  const [authed, setAuthed] = useState(false);
  const loadedRef = useRef(false);
  const syncTimer = useRef<number | null>(null);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setProgress(loadProgress());
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setAuthed(true);
          return fetch("/api/progress")
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
        }
        return null;
      })
      .then((server) => {
        if (server) {
          setProgress(mergeProgress(server, loadProgress()));
        }
      })
      .catch(() => {});
  }, []);

  const apply = useCallback(
    (mutator: (p: ProgressState) => ProgressState) => {
      setProgress((prev) => {
        const next = mutator(prev);
        const earned = checkAchievements(next);
        let out = next;
        if (earned.length > 0) {
          out = {
            ...next,
            achievements: [...next.achievements, ...earned],
            xp: next.xp + earned.length * XP.achievement,
          };
          setFresh((f) => [
            ...f,
            ...earned.map((id) => getAchievement(id)).filter((a): a is AchievementDef => !!a),
          ]);
        }
        return out;
      });
    },
    [],
  );

  useEffect(() => {
    saveProgress(progress);
    if (!authed) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: progress }),
      }).catch(() => {});
    }, 1500);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [progress, authed]);

  useEffect(() => {
    const onInstalled = (e: Event) => {
      const pkg = ((e as CustomEvent).detail as { pkg?: string } | undefined)?.pkg;
      if (!pkg) return;
      const key = pkg.toLowerCase().split("=")[0].trim();
      apply((p) => ({
        ...p,
        toolsInstalled: { ...p.toolsInstalled, [key]: (p.toolsInstalled[key] ?? 0) + 1 },
      }));
    };
    const onRan = () => {
      apply((p) => ({ ...p, commandsRun: p.commandsRun + 1 }));
    };
    window.addEventListener("gk-tool-installed", onInstalled);
    window.addEventListener("gk-terminal-ran", onRan);
    return () => {
      window.removeEventListener("gk-tool-installed", onInstalled);
      window.removeEventListener("gk-terminal-ran", onRan);
    };
  }, [apply]);

  const recordMission = useCallback(
    (slug: string, score: number) => {
      apply((p) => {
        const prev = p.missions[slug] ?? { done: false, best: 0, attempts: 0 };
        return {
          ...p,
          xp: p.xp + (prev.done ? 0 : score),
          missions: {
            ...p.missions,
            [slug]: { done: true, best: Math.max(prev.best, score), attempts: prev.attempts + 1 },
          },
        };
      });
    },
    [apply],
  );

  const recordQuiz = useCallback(
    (r: { score: number; total: number }) => {
      apply((p) => {
        const today = new Date().toISOString().slice(0, 10);
        const already = p.daily.some((d) => d.date === today);
        const last = [...p.daily].reverse().find((d) => d.date !== today);
        const streak = already
          ? p.streak
          : last && last.date === dayBefore(today)
            ? p.streak + 1
            : 1;
        return {
          ...p,
          xp: p.xp + r.score * XP.quizPerCorrect,
          quizzesTaken: already ? p.quizzesTaken : p.quizzesTaken + 1,
          daily: [...p.daily.filter((d) => d.date !== today), { date: today, score: r.score, total: r.total, diff: 0 }],
          streak,
        };
      });
    },
    [apply],
  );

  const recordDetective = useCallback(
    (slug: string, score: number, difficulty: "Easy" | "Hard") => {
      apply((p) => {
        const prev = p.detective[slug] ?? { solved: false, best: 0, attempts: 0 };
        const base = difficulty === "Easy" ? XP.detectiveEasy : XP.detectiveHard;
        return {
          ...p,
          xp: p.xp + (prev.solved ? 0 : base),
          detective: {
            ...p.detective,
            [slug]: { solved: true, best: Math.max(prev.best, score), attempts: prev.attempts + 1 },
          },
        };
      });
    },
    [apply],
  );

  const recordToolInstall = useCallback(
    (pkg: string) => {
      const key = pkg.toLowerCase().split("=")[0].trim();
      apply((p) => ({
        ...p,
        toolsInstalled: { ...p.toolsInstalled, [key]: (p.toolsInstalled[key] ?? 0) + 1 },
      }));
    },
    [apply],
  );

  const recordCommand = useCallback(() => {
    apply((p) => ({ ...p, commandsRun: p.commandsRun + 1 }));
  }, [apply]);

  const resetProgress = useCallback(() => {
    setProgress(EMPTY_PROGRESS);
    setFresh([]);
  }, []);

  const dismissFresh = useCallback((id: string) => {
    setFresh((f) => f.filter((a) => a.id !== id));
  }, []);

  const level = levelForXp(progress.xp);
  const value: ProgressContextValue = {
    progress,
    level,
    xpInto: xpIntoLevel(progress.xp),
    xpNext: xpForLevel(level) - xpIntoLevel(progress.xp),
    fresh,
    dismissFresh,
    recordMission,
    recordQuiz,
    recordDetective,
    recordToolInstall,
    recordCommand,
    resetProgress,
  };

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

function dayBefore(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within <ProgressProvider>");
  return ctx;
}