export interface MissionRecord {
  done: boolean;
  best: number;
  attempts: number;
}

export interface DetectiveRecord {
  solved: boolean;
  best: number;
  attempts: number;
}

export interface QuizDay {
  date: string;
  score: number;
  total: number;
  diff: number;
}

export interface ProgressState {
  v: 1;
  xp: number;
  missions: Record<string, MissionRecord>;
  detective: Record<string, DetectiveRecord>;
  achievements: string[];
  daily: QuizDay[];
  streak: number;
  toolsInstalled: Record<string, number>;
  quizzesTaken: number;
  commandsRun: number;
}

export const EMPTY_PROGRESS: ProgressState = {
  v: 1,
  xp: 0,
  missions: {},
  detective: {},
  achievements: [],
  daily: [],
  streak: 0,
  toolsInstalled: {},
  quizzesTaken: 0,
  commandsRun: 0,
};

export function levelForXp(xp: number): number {
  return Math.min(50, Math.floor(Math.sqrt(xp / 40)) + 1);
}

export function xpIntoLevel(xp: number): number {
  const level = levelForXp(xp);
  const base = (level - 1) * (level - 1) * 40;
  return xp - base;
}

export function xpForLevel(level: number): number {
  return level * level * 40;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}