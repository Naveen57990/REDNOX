import type { CommandSpec, KaliTool, MasterGuide } from "../types";
import { part1 } from "./part1";
import { part2 } from "./part2";
import { part3 } from "./part3";
import { part4 } from "./part4";
import { part5 } from "./part5";
import { part6 } from "./part6";
import { part7 } from "./part7";
import { part8 } from "./part8";
import { TOOL_GUIDES, PLAIN_EXPLAIN_OVERRIDES } from "./guides";
import { autoPlainExplain, autoCommandExplain } from "./autoexplain";
import { MASTER_GUIDES_1 } from "./master-guides-1";
import { MASTER_GUIDES_2 } from "./master-guides-2";
import { MASTER_GUIDES_3 } from "./master-guides-3";
import { MASTER_GUIDES_4 } from "./master-guides-4";
import { MASTER_GUIDES_5 } from "./master-guides-5";

export type ToolDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface EnrichedTool extends KaliTool {
  difficulty: ToolDifficulty;
  platform: string;
  stars: number;
  featured: boolean;
  /** Hand-written or generated "what is this and why use it" in plain English. */
  plainExplain: string;
  /** Every command paired with a plain-English explanation. */
  commandExplains: CommandSpec[];
}

/** Highly-regarded / popular / powerful tools shown with a star badge. */
const FEATURED_SLUGS = new Set([
  "nmap", "masscan", "metasploit", "msfvenom", "burpsuite", "sqlmap",
  "hydra", "hashcat", "john", "johnny", "aircrack-ng", "wireshark",
  "tcpdump", "gobuster", "ffuf", "dirb", "wpscan", "nikto", "enum4linux",
  "responder", "bettercap", "mitm6", "evil-winrm", "crackmapexec", "chisel",
  "proxychains", "beef", "searchsploit", "linpeas", "seclists", "wordlists",
  "bloodhound", "zerologon", "sherlock", "theharvester", "recon-ng",
  "volatility3", "autopsy", "binwalk", "burpsuite-community", "crunch",
  "cewl", "ophcrack", "kismet", "reaver", "wifite", "maltego", "amass",
]);

const DIFF_BASE: Record<string, ToolDifficulty> = {
  recon: "Beginner",
  vuln: "Intermediate",
  web: "Advanced",
  password: "Intermediate",
  wireless: "Advanced",
  exploit: "Advanced",
  sniff: "Beginner",
  post: "Advanced",
  forensics: "Intermediate",
  reporting: "Beginner",
  stress: "Intermediate",
  social: "Intermediate",
  reverse: "Advanced",
  hardware: "Advanced",
  utils: "Beginner",
};

const PLATFORM: Record<string, string> = {
  recon: "Linux · CLI",
  vuln: "Linux · CLI",
  web: "Linux · CLI + Web",
  password: "Linux · CLI",
  wireless: "Linux · Hardware",
  exploit: "Linux · CLI",
  sniff: "Linux · CLI",
  post: "Linux · CLI",
  forensics: "Linux · GUI + CLI",
  reporting: "Cross-platform · GUI",
  stress: "Linux · CLI",
  social: "Cross-platform",
  reverse: "Linux · GUI + CLI",
  hardware: "Linux · Hardware",
  utils: "Linux · CLI",
};

const DIFF_ORDER: Record<ToolDifficulty, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};
const DIFF_NAMES: ToolDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

function stableHash(slug: string): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function difficultyFor(tool: KaliTool): ToolDifficulty {
  const base = DIFF_BASE[tool.cat] ?? "Intermediate";
  const order = DIFF_ORDER[base];
  const r = stableHash(tool.slug) % 3;
  let adj = order;
  if (r === 0 && order > 0) adj = order - 1;
  else if (r === 2 && order < 2) adj = order + 1;
  return DIFF_NAMES[adj];
}

function buildCommandExplains(tool: KaliTool): CommandSpec[] {
  const guide = TOOL_GUIDES[tool.slug];
  if (guide) return guide.commands;
  return tool.commands.map((cmd) => ({
    cmd,
    explain: autoCommandExplain(tool, cmd),
  }));
}

function buildPlainExplain(tool: KaliTool): string {
  const guide = TOOL_GUIDES[tool.slug];
  if (guide) return guide.plainExplain;
  if (PLAIN_EXPLAIN_OVERRIDES[tool.slug])
    return PLAIN_EXPLAIN_OVERRIDES[tool.slug];
  return autoPlainExplain(tool);
}

function enrich(tool: KaliTool): EnrichedTool {
  const featured = FEATURED_SLUGS.has(tool.slug);
  const hash = stableHash(tool.slug);
  return {
    ...tool,
    difficulty: difficultyFor(tool),
    platform: PLATFORM[tool.cat] ?? "Linux · CLI",
    featured,
    stars: featured ? 5 : (hash % 3) + 2,
    plainExplain: buildPlainExplain(tool),
    commandExplains: buildCommandExplains(tool),
  };
}

export const TOOLS: EnrichedTool[] = [
  ...part1, ...part2, ...part3, ...part4, ...part5, ...part6, ...part7, ...part8,
].map(enrich);

export function getFeaturedTools(): EnrichedTool[] {
  return TOOLS.filter((t) => t.featured);
}

export function getPopularTools(limit = 12): EnrichedTool[] {
  return [...TOOLS].sort((a, b) => b.stars - a.stars).slice(0, limit);
}

export function getToolBySlug(slug: string): EnrichedTool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** In-depth "master guide" content for popular tools. */
export const MASTER_GUIDES: MasterGuide[] = [
  ...MASTER_GUIDES_1,
  ...MASTER_GUIDES_2,
  ...MASTER_GUIDES_3,
  ...MASTER_GUIDES_4,
  ...MASTER_GUIDES_5,
];

export function getMasterGuide(slug: string): MasterGuide | undefined {
  return MASTER_GUIDES.find((g) => g.slug === slug);
}

export function getMasterGuideForTool(
  tool: KaliTool,
): MasterGuide | undefined {
  return getMasterGuide(tool.slug);
}

export function getToolsByCategory(cat: string): EnrichedTool[] {
  return TOOLS.filter((t) => t.cat === cat);
}

export function searchTools(query: string): EnrichedTool[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((t) =>
    [t.name, t.slug, t.summary, t.cat, ...t.tags].some((field) =>
      field.toLowerCase().includes(q),
    ),
  );
}

export function countTools(): number {
  return TOOLS.length;
}

export function countByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of TOOLS) counts[t.cat] = (counts[t.cat] || 0) + 1;
  return counts;
}

export { TOOL_CATEGORIES, REAL_TOOL_COUNT } from "../types";
export type { KaliTool, ToolCategory } from "../types";