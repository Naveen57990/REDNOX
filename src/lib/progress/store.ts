import {
  EMPTY_PROGRESS,
  type MissionRecord,
  type ProgressState,
} from "./types";

export const PROGRESS_KEY = "cyberlab-progress";

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (parsed.v !== 1) return EMPTY_PROGRESS;
    return {
      ...EMPTY_PROGRESS,
      ...parsed,
      missions: parsed.missions ?? {},
      detective: parsed.detective ?? {},
      achievements: parsed.achievements ?? [],
      daily: parsed.daily ?? [],
      toolsInstalled: parsed.toolsInstalled ?? {},
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(p: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    // storage full or blocked — non-fatal
  }
}

export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const missions: Record<string, MissionRecord> = {};
  for (const key of new Set([...Object.keys(a.missions), ...Object.keys(b.missions)])) {
    const ma = a.missions[key];
    const mb = b.missions[key];
    missions[key] = {
      done: (ma?.done ?? false) || (mb?.done ?? false),
      best: Math.max(ma?.best ?? 0, mb?.best ?? 0),
      attempts: (ma?.attempts ?? 0) + (mb?.attempts ?? 0),
    };
  }
  return {
    v: 1,
    xp: Math.max(a.xp, b.xp),
    missions,
    detective: mergeDetective(a.detective, b.detective),
    achievements: [...new Set([...a.achievements, ...b.achievements])],
    daily: a.daily.length >= b.daily.length ? a.daily : b.daily,
    streak: Math.max(a.streak, b.streak),
    toolsInstalled: mergeCounts(a.toolsInstalled, b.toolsInstalled),
    quizzesTaken: Math.max(a.quizzesTaken, b.quizzesTaken),
    commandsRun: Math.max(a.commandsRun, b.commandsRun),
  };
}

function mergeDetective(
  a: ProgressState["detective"],
  b: ProgressState["detective"],
): ProgressState["detective"] {
  const out: ProgressState["detective"] = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const da = a[key];
    const db = b[key];
    out[key] = {
      solved: (da?.solved ?? false) || (db?.solved ?? false),
      best: Math.max(da?.best ?? 0, db?.best ?? 0),
      attempts: (da?.attempts ?? 0) + (db?.attempts ?? 0),
    };
  }
  return out;
}

function mergeCounts(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[key] = Math.max(a[key] ?? 0, b[key] ?? 0);
  }
  return out;
}