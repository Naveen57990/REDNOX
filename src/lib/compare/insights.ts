import type { EnrichedTool, ToolDifficulty } from "@/data/tools";

export interface CompareRow {
  label: string;
  a?: string;
  b?: string;
  both?: string;
}

const DIFF_WEIGHT: Record<ToolDifficulty, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

function installMethod(install: string): string {
  if (/apt(-get)?/.test(install)) return "apt";
  if (/pipx|pip /.test(install) || install.startsWith("pip")) return "pip";
  if (/go install/.test(install)) return "go";
  if (/snap/.test(install)) return "snap";
  return "other";
}

export function compareRows(a: EnrichedTool, b: EnrichedTool): CompareRow[] {
  const aCat = catLabel(a.cat);
  const bCat = catLabel(b.cat);
  const aInstall = installMethod(a.install);
  const bInstall = installMethod(b.install);
  const sharedTags = (a.tags ?? []).filter((t) => (b.tags ?? []).includes(t));

  const rows: CompareRow[] = [
    { label: "Category", a: aCat, b: bCat, both: a.cat === b.cat ? aCat : undefined },
    {
      label: "Difficulty",
      a: `${a.difficulty} (${DIFF_WEIGHT[a.difficulty] ?? 1}/2)`,
      b: `${b.difficulty} (${DIFF_WEIGHT[b.difficulty] ?? 1}/2)`,
      both: a.difficulty === b.difficulty ? a.difficulty : undefined,
    },
    {
      label: "Install method",
      a: aInstall,
      b: bInstall,
      both: aInstall === bInstall ? `${aInstall} for both` : undefined,
    },
    {
      label: "Example commands",
      a: `${a.commands.length}`,
      b: `${b.commands.length}`,
      both: a.commands.length === b.commands.length ? `${a.commands.length} each` : undefined,
    },
    {
      label: "Strengths",
      a: (a.tags ?? []).slice(0, 4).join(", "),
      b: (b.tags ?? []).slice(0, 4).join(", "),
      both: sharedTags.length > 0 ? sharedTags.slice(0, 4).join(", ") : undefined,
    },
  ];
  return rows;
}

export function compareVerdict(a: EnrichedTool, b: EnrichedTool): string {
  const aCat = catLabel(a.cat);
  const bCat = catLabel(b.cat);
  if (aCat === bCat) {
    return `Both live in "${aCat}" — they often appear side by side on the same engagement. ${
      a.name
    } favors ${purposeOf(a)}, while ${b.name} leans toward ${purposeOf(b)} — many testers keep both and pick per job.`;
  }
  return `${a.name} lives in ${aCat} (best for ${purposeOf(a)}); ${b.name} covers ${bCat} (best for ${purposeOf(b)}). They're complementary rather than competitors — a real workflow often uses both.`;
}

function purposeOf(t: EnrichedTool): string {
  const tags = t.tags ?? [];
  if (tags.includes("bruteforce") || tags.includes("cracking")) return "brute force and cracking";
  if (tags.includes("wifi") || tags.includes("wireless")) return "wireless and Wi-Fi work";
  if (tags.includes("scanning") || tags.includes("ports")) return "scanning";
  if (tags.includes("web")) return "the web layer";
  if (tags.includes("enumeration") || tags.includes("osint")) return "enumeration and OSINT";
  if (tags.includes("gui")) return "point-and-click ease";
  if (tags.includes("automation") || tags.includes("framework")) return "automation at scale";
  if (tags.includes("dns")) return "DNS work";
  if (tags.includes("sniffing") || tags.includes("capture")) return "traffic capture";
  return t.summary.split(".")[0].toLowerCase();
}

export function catLabel(cat: string): string {
  const labels: Record<string, string> = {
    recon: "Information Gathering",
    vuln: "Vulnerability Analysis",
    web: "Web Application Analysis",
    password: "Password Attacks",
    wireless: "Wireless Attacks",
    exploit: "Exploitation Tools",
    sniff: "Sniffing & Spoofing",
    post: "Post Exploitation",
    forensics: "Digital Forensics",
    reporting: "Reporting Tools",
    stress: "Stress Testing",
    social: "Social Engineering",
    reverse: "Reverse Engineering",
    hardware: "Hardware Hacking",
    utils: "Utilities",
  };
  return labels[cat] ?? cat;
}