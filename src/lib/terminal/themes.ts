import type { ITheme } from "@xterm/xterm";

export interface TermTheme {
  id: string;
  label: string;
  bg: string;
  theme: ITheme;
}

export const TERMINAL_THEMES: TermTheme[] = [
  {
    id: "forest",
    label: "Forest",
    bg: "#070d09",
    theme: {
      background: "#070d09",
      foreground: "#d1e7d9",
      cursor: "#2ddf8e",
      selectionBackground: "#123524",
      brightGreen: "#2ddf8e",
    },
  },
  {
    id: "matrix",
    label: "Matrix",
    bg: "#020a02",
    theme: {
      background: "#020a02",
      foreground: "#33ff66",
      cursor: "#66ff99",
      selectionBackground: "#0f2b0f",
      brightGreen: "#66ff99",
    },
  },
  {
    id: "dracula",
    label: "Dracula",
    bg: "#14141f",
    theme: {
      background: "#14141f",
      foreground: "#f8f8f2",
      cursor: "#f8f8f2",
      selectionBackground: "#44475a",
      brightGreen: "#50fa7b",
    },
  },
  {
    id: "cyber",
    label: "Cyber",
    bg: "#0a1020",
    theme: {
      background: "#0a1020",
      foreground: "#e8eef8",
      cursor: "#22d3ee",
      selectionBackground: "#1d2c47",
      brightGreen: "#4ade80",
    },
  },
];

export const THEME_STORAGE_KEY = "cyberlab-terminal-theme";
export const HISTORY_STORAGE_KEY = "cyberlab-terminal-history";
export const HISTORY_LIMIT = 200;

export function loadThemeId(): string {
  if (typeof window === "undefined") return "forest";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "forest";
  } catch {
    return "forest";
  }
}

export function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function pushHistory(line: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = [...loadHistory(), line].slice(-HISTORY_LIMIT);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // ignore
  }
}