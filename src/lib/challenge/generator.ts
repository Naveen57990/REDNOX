import { TOOLS } from "@/data/tools";
import { COMMANDS } from "@/data/commands";
import { catLabel } from "@/lib/compare/insights";
import { CHALLENGE_CASES, type CaseTier } from "@/data/challengeCases";

export type ChallengeTier = CaseTier;

export interface ChallengeQuestion {
  id: string;
  tier: ChallengeTier;
  text: string;
  options: string[];
  answer: number;
  explain: string;
}

export const CHALLENGE_QUESTIONS = 5;

type Rng = () => number;

function hashSeed(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDistinct<T>(pool: T[], exclude: (t: T) => boolean, count: number, rng: Rng): T[] {
  const available = pool.filter((t) => !exclude(t));
  return shuffle(available, rng).slice(0, count);
}

/** Adaptive tier mix: user's level decides the weights, last day's score nudges harder/easier. */
function tierWeights(level: number, lastPct: number | null): { Easy: number; Medium: number; Hard: number } {
  let w: { Easy: number; Medium: number; Hard: number };
  if (level <= 2) w = { Easy: 0.9, Medium: 0.1, Hard: 0 };
  else if (level <= 5) w = { Easy: 0.5, Medium: 0.4, Hard: 0.1 };
  else if (level <= 10) w = { Easy: 0.2, Medium: 0.6, Hard: 0.2 };
  else if (level <= 20) w = { Easy: 0.1, Medium: 0.5, Hard: 0.4 };
  else w = { Easy: 0, Medium: 0.4, Hard: 0.6 };

  if (lastPct != null) {
    if (lastPct >= 0.8) w = { Easy: w.Easy * 0.5, Medium: w.Medium + w.Easy * 0.3, Hard: w.Hard + w.Easy * 0.2 };
    else if (lastPct <= 0.4) w = { Easy: 0.25, Medium: 0.55, Hard: 0.2 };
  }
  return w;
}

function pickTier(rng: Rng, weights: { Easy: number; Medium: number; Hard: number }): ChallengeTier {
  const r = rng();
  if (r < weights.Easy) return "Easy";
  if (r < weights.Easy + weights.Medium) return "Medium";
  return "Hard";
}

function easyQuestion(rng: Rng): ChallengeQuestion {
  const [tool] = shuffle(TOOLS, rng);
  const options = shuffle(
    [tool.name, ...pickDistinct(TOOLS, (t) => t.name === tool.name, 3, rng).map((t) => t.name)],
    rng,
  );
  return {
    id: `e:${tool.slug}`,
    tier: "Easy",
    text: `Which tool is described as "${tool.summary}"?`,
    options,
    answer: options.indexOf(tool.name),
    explain: `${tool.name} — ${tool.summary}`,
  };
}

function mediumQuestion(rng: Rng): ChallengeQuestion {
  const kind = Math.floor(rng() * 3);
  if (kind === 0) {
    const [tool] = shuffle(TOOLS, rng);
    const label = catLabel(tool.cat);
    const catPool = Array.from(new Set(TOOLS.map((t) => catLabel(t.cat)))).filter((c) => c !== label);
    const options = shuffle([label, ...shuffle(catPool, rng).slice(0, 3)], rng);
    return {
      id: `c:${tool.slug}:${label}`,
      tier: "Medium",
      text: `${tool.name} ("${tool.summary.slice(0, 90)}…") belongs to which tool category?`,
      options,
      answer: options.indexOf(label),
      explain: `${tool.name} is grouped under ${label}.`,
    };
  }
  if (kind === 1) {
    const [tool] = shuffle(TOOLS, rng);
    const inst = tool.install.includes("pip")
      ? `pip install ${tool.install.split("pip install")[1]?.trim() ?? tool.install}`
      : tool.install;
    const dist = pickDistinct(
      TOOLS,
      (t) => t.install === tool.install,
      3,
      rng,
    )
      .map((t) => (t.install.includes("pip") ? `pip install ${t.install.split("pip install")[1]?.trim() ?? t.install}` : t.install))
      .filter((s) => s !== inst);
    const fill = ["sudo apt install", "pip install", "git clone"].filter((p) => !inst.includes(p));
    while (dist.length < 3 && fill.length) dist.push(`${fill.shift()} ${tool.install.split(" ").slice(-1)[0] ?? tool.slug}`);
    const options = shuffle([inst, ...dist.slice(0, 3)], rng);
    return {
      id: `i:${tool.slug}`,
      tier: "Medium",
      text: `How do you install ${tool.name} on Kali?`,
      options,
      answer: options.indexOf(inst),
      explain: `Kali installs it with: ${tool.install}`,
    };
  }
  const [cmd] = shuffle(COMMANDS, rng);
  const options = shuffle(
    [cmd.name, ...pickDistinct(COMMANDS, (c) => c.name === cmd.name, 3, rng).map((c) => c.name)],
    rng,
  );
  return {
    id: `k:${cmd.name}`,
    tier: "Medium",
    text: `Commands lab — which command ${/^[aeiou]/i.test(cmd.name) ? "is" : "is"} the one whose job is "${cmd.description}"?`,
    options,
    answer: options.indexOf(cmd.name),
    explain: `\`${cmd.name}\` — ${cmd.description}`,
  };
}

function hardQuestion(rng: Rng): ChallengeQuestion {
  const [c] = shuffle(CHALLENGE_CASES, rng);
  const options = shuffle(c.options, rng);
  return {
    id: `h:${c.id}`,
    tier: "Hard",
    text: c.text,
    options,
    answer: options.indexOf(c.options[c.answer]),
    explain: c.explain,
  };
}

const POOL_WORKERS = {
  Easy: easyQuestion,
  Medium: mediumQuestion,
  Hard: hardQuestion,
} as const;

/**
 * Build today's {CHALLENGE_QUESTIONS}-question set.
 * Deterministic per (userId, date) so the same day always serves the same set.
 */
export function buildDaily(
  date: string,
  userId: string | null,
  level: number,
  lastPct: number | null,
): ChallengeQuestion[] {
  const rng = mulberry32(hashSeed(`${date}:${userId ?? "anon"}`));
  const weights = tierWeights(level, lastPct);
  const used = new Set<string>();
  const questions: ChallengeQuestion[] = [];
  let guard = 0;
  while (questions.length < CHALLENGE_QUESTIONS && guard++ < 60) {
    const tier = pickTier(rng, weights);
    const q = POOL_WORKERS[tier](rng);
    if (used.has(q.id)) continue;
    used.add(q.id);
    questions.push(q);
  }
  return questions;
}