import type { ProgressState } from "./types";

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: (p: ProgressState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-steps",
    icon: "🐣",
    title: "First steps",
    desc: "Earn your first 50 XP.",
    check: (p) => p.xp >= 50,
  },
  {
    id: "xp-100",
    icon: "⚡",
    title: "Century club",
    desc: "Cross 100 XP.",
    check: (p) => p.xp >= 100,
  },
  {
    id: "xp-500",
    icon: "🚀",
    title: "Power user",
    desc: "Cross 500 XP.",
    check: (p) => p.xp >= 500,
  },
  {
    id: "xp-1000",
    icon: "💎",
    title: "Pro tier",
    desc: "Cross 1000 XP.",
    check: (p) => p.xp >= 1000,
  },
  {
    id: "first-mission",
    icon: "🎯",
    title: "Mission accepted",
    desc: "Complete your first lab mission.",
    check: (p) => Object.values(p.missions).some((m) => m.done),
  },
  {
    id: "missions-5",
    icon: "🛰️",
    title: "Field agent",
    desc: "Complete 5 lab missions.",
    check: (p) => Object.values(p.missions).filter((m) => m.done).length >= 5,
  },
  {
    id: "missions-10",
    icon: "🏆",
    title: "Mission master",
    desc: "Complete 10 lab missions.",
    check: (p) => Object.values(p.missions).filter((m) => m.done).length >= 10,
  },
  {
    id: "hard-mission",
    icon: "🕹️",
    title: "Hard targets",
    desc: "Complete an Advanced difficulty mission.",
    check: (p) =>
      Object.entries(p.missions).some(
        ([slug, m]) => m.done && slug.startsWith("hard-"),
      ),
  },
  {
    id: "quiz-first",
    icon: "📅",
    title: "Daily grind",
    desc: "Take your first daily challenge.",
    check: (p) => p.daily.length > 0,
  },
  {
    id: "quiz-perfect",
    icon: "🎯",
    title: "Flawless",
    desc: "Score 100% on a daily challenge.",
    check: (p) => p.daily.some((d) => d.score === d.total && d.total > 0),
  },
  {
    id: "quiz-streak-3",
    icon: "🔥",
    title: "On a roll",
    desc: "Keep a 3-day daily challenge streak.",
    check: (p) => p.streak >= 3,
  },
  {
    id: "detective-first",
    icon: "🕵️",
    title: "Detective",
    desc: "Solve your first exploit investigation.",
    check: (p) => Object.values(p.detective).some((d) => d.solved),
  },
  {
    id: "detective-3",
    icon: "🔎",
    title: "Investigator",
    desc: "Solve 3 exploit investigations.",
    check: (p) => Object.values(p.detective).filter((d) => d.solved).length >= 3,
  },
  {
    id: "install-1",
    icon: "📦",
    title: "Toolsmith",
    desc: "Install your first tool in the lab.",
    check: (p) => Object.keys(p.toolsInstalled).length >= 1,
  },
  {
    id: "install-5",
    icon: "⚙️",
    title: "Lab rat",
    desc: "Install 5 different tools in the lab.",
    check: (p) => Object.keys(p.toolsInstalled).length >= 5,
  },
  {
    id: "install-10",
    icon: "🧰",
    title: "Armory",
    desc: "Install 10 different tools in the lab.",
    check: (p) => Object.keys(p.toolsInstalled).length >= 10,
  },
  {
    id: "reconner",
    icon: "🌐",
    title: "Reconner",
    desc: "Install a reconnaissance tool.",
    check: (p) =>
      Object.keys(p.toolsInstalled).some((t) =>
        ["nmap", "masscan", "whois", "theharvester", "amass", "sublist3r"].includes(t),
      ),
  },
  {
    id: "runner",
    icon: "⌨️",
    title: "Heavy typer",
    desc: "Run 50 commands in the terminal.",
    check: (p) => p.commandsRun >= 50,
  },
];

export function checkAchievements(p: ProgressState): string[] {
  const owned = new Set(p.achievements);
  return ACHIEVEMENTS.filter((a) => !owned.has(a.id) && a.check(p)).map((a) => a.id);
}

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}