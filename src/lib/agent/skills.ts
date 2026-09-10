import type { Intent } from "./intents";
import { PAGE_ROUTES } from "./intents";

export interface TaskItem {
  label: string;
  href?: string;
  desc?: string;
}

export interface TaskResult {
  resolved: boolean;
  title: string;
  summary: string;
  items?: TaskItem[];
  code?: string[];
  nav?: string;
  terminalCmd?: string;
  note?: string;
}

const cap = (s: string) => s.length <= 64 ? s : `${s.slice(0, 61)}...`;

const BLOCKED_CMD = [
  /^\s*rm\s+-?rf\s*\//, /mkfs/, /fdisk/, /dd\s+if=/, />\s*\/dev\/(sd|hd)/,
  /curl[^\n]*\|\s*(ba|sh|bash|zsh)/, /wget[^\n]*\|\s*(ba|sh|bash|zsh)/,
  /sudo\s+rm\s/, /:\(\)/, /echo[^\n]*>\s*\/etc\//, /chmod\s+777\s+\/usr/,
];

function toolNotFound(name: string): TaskResult {
  return {
    resolved: false,
    title: `No tool named “${cap(name)}”`,
    summary: `I couldn't match “${cap(name)}” to a tool in the database. Try a tool page, or search for what it does and I'll return matches.`,
  };
}

function attackNotFound(name: string): TaskResult {
  return {
    resolved: false,
    title: `No attack playbook named “${cap(name)}”`,
    summary: `I couldn't match “${cap(name)}” to a playbook. You can ask me to list attacks by category (social, mobile, network, web, system, physical).`,
  };
}

function guideNotFound(name: string): TaskResult {
  return {
    resolved: false,
    title: `No master guide for “${cap(name)}”`,
    summary: `I couldn't match “${cap(name)}” to a master guide. Ask me to search guides, e.g. “search guides sqlmap”.`,
  };
}

export async function runSkill(intent: Intent): Promise<TaskResult> {
  switch (intent.action) {
    case "openPage": {
      return {
        resolved: true,
        title: `Opening ${PAGE_ROUTES[intent.page].label}`,
        summary: `Navigating to the ${PAGE_ROUTES[intent.page].label} section now.`,
        nav: PAGE_ROUTES[intent.page].href,
      };
    }

    case "openTool": {
      const { getToolBySlug } = await import("@/data/tools");
      const resolved = getToolBySlug(intent.name) ?? await resolveToolByName(intent.name);
      if (!resolved) return toolNotFound(intent.name);
      return {
        resolved: true,
        title: `Opening ${resolved.name}`,
        summary: resolved.summary,
        nav: `/tools/${resolved.slug}`,
        note: resolved.install ? `Lab install: ${resolved.install}` : undefined,
      };
    }

    case "explainTool": {
      const { getToolBySlug } = await import("@/data/tools");
      const resolved = getToolBySlug(intent.name) ?? await resolveToolByName(intent.name);
      if (!resolved) return toolNotFound(intent.name);
      const explains = Array.isArray(resolved.commandExplains)
        ? resolved.commandExplains.slice(0, 4)
        : undefined;
      return {
        resolved: true,
        title: resolved.name,
        summary: resolved.summary,
        items: explains?.map((e) => ({ label: e.cmd, href: `/tools/${resolved.slug}`, desc: e.explain })),
        code: resolved.commands ? resolved.commands.slice(0, 3) : undefined,
        note: resolved.install ? `Lab install: ${resolved.install} — open the tool page for the full detail.` : undefined,
      };
    }

    case "searchTools": {
      const { searchTools } = await import("@/data/tools");
      const results = await deepSearch(searchTools, intent.q);
      if (results.length === 0)
        return {
          resolved: false,
          title: `No tools matching “${cap(intent.q)}”`,
          summary: `Nothing in the DB matched that search. Try different wording, e.g. “search tools for wifi” or an attack category.`,
        };
      return {
        resolved: true,
        title: `${results.length} tool${results.length === 1 ? "" : "s"} matching “${cap(intent.q)}”`,
        summary: results.length === 1
          ? results[0].summary
          : `Here are the closest matches, ranked by relevance. Open one to see install + usage.`,
        items: results.slice(0, 6).map((t) => ({
          label: t.name,
          href: `/tools/${t.slug}`,
          desc: t.summary,
        })),
      };
    }

    case "popularTools": {
      const { getPopularTools } = await import("@/data/tools");
      const top = getPopularTools(8);
      return {
        resolved: true,
        title: "Popular tools",
        summary: `The ${top.length} most-used tools in the database.`,
        items: top.map((t) => ({ label: t.name, href: `/tools/${t.slug}`, desc: t.summary })),
      };
    }

    case "randomTool": {
      const { TOOLS } = await import("@/data/tools");
      const t = TOOLS[Math.floor(Math.random() * TOOLS.length)];
      return {
        resolved: true,
        title: `Random pick: ${t.name}`,
        summary: t.summary,
        items: [{ label: `Open ${t.name} →`, href: `/tools/${t.slug}` }],
        note: t.install ? `Lab install: ${t.install}` : undefined,
      };
    }

    case "openGuide": {
      const { getMasterGuide, MASTER_GUIDES } = await import("@/data/tools");
      const g =
        getMasterGuide(intent.name) ??
        MASTER_GUIDES.find((m) => m.slug.includes(intent.name) || intent.name.includes(m.slug));
      if (!g) return guideNotFound(intent.name);
      return {
        resolved: true,
        title: `Opening ${g.tagline} guide`,
        summary: g.intro,
        nav: `/guides/${g.slug}`,
      };
    }

    case "searchGuides": {
      const { MASTER_GUIDES } = await import("@/data/tools");
      const q = intent.q.toLowerCase();
      const matches = MASTER_GUIDES.filter(
        (g) => g.slug.includes(q) || g.tagline.toLowerCase().includes(q) || g.intro.toLowerCase().includes(q),
      );
      if (matches.length === 0)
        return {
          resolved: false,
          title: `No master guides matching “${cap(intent.q)}”`,
          summary: `Nothing matched. Master guides cover the most popular tools — ask for one by name.`,
        };
      return {
        resolved: true,
        title: `${matches.length} master guide${matches.length === 1 ? "" : "s"} on “${cap(intent.q)}”`,
        summary: "Guides walk through real usage end-to-end.",
        items: matches.slice(0, 6).map((g) => ({ label: g.tagline, href: `/guides/${g.slug}`, desc: g.intro })),
      };
    }

    case "openAttack": {
      const { getAttackPlaybook, ATTACK_PLAYBOOKS } = await import("@/data/attacks");
      const p =
        getAttackPlaybook(intent.name) ??
        ATTACK_PLAYBOOKS.find((a) => a.slug.includes(intent.name) || a.title.toLowerCase().includes(intent.name));
      if (!p) return attackNotFound(intent.name);
      return {
        resolved: true,
        title: `Opening attack playbook: ${p.title}`,
        summary: p.summary,
        items: [{ label: `${p.tools.length} tools · ${p.steps.length} phases`, href: `/attacks/${p.slug}` }],
        nav: `/attacks/${p.slug}`,
      };
    }

    case "attackOverview": {
      const { ATTACK_CATEGORIES, ATTACK_PLAYBOOKS } = await import("@/data/attacks");
      return {
        resolved: true,
        title: "Attack playbooks",
        summary: `${ATTACK_PLAYBOOKS.length} defensive-recon playbooks across ${ATTACK_CATEGORIES.length} categories. Ask me for one category and I'll list its playbooks.`,
        items: ATTACK_CATEGORIES.map((c) => ({
          label: c.label,
          href: `/attacks?cat=${c.id}`,
          desc: c.description,
        })),
      };
    }

    case "listAttacks": {
      const { ATTACK_PLAYBOOKS, ATTACK_CATEGORIES } = await import("@/data/attacks");
      const cat = intent.category ? ATTACK_CATEGORIES.find((c) => c.id === intent.category) : undefined;
      const list = intent.category
        ? ATTACK_PLAYBOOKS.filter((a) => a.category === intent.category)
        : ATTACK_PLAYBOOKS;
      return {
        resolved: true,
        title: cat ? `${cat.label} playbooks` : "All attack playbooks",
        summary: cat
          ? cat.description
          : `${list.length} playbooks — pick a category to narrow it down.`,
        items: list.slice(0, 8).map((a) => ({
          label: a.title,
          href: `/attacks/${a.slug}`,
          desc: a.summary,
        })),
      };
    }

    case "runTerminal": {
      const cmd = intent.cmd.trim();
      if (!cmd) {
        return {
          resolved: false,
          title: "Empty command",
          summary: "Tell me the command to run, e.g. “run in the terminal: nmap -sV target.co”.",
        };
      }
      if (cmd.length > 120) {
        return {
          resolved: false,
          title: "Command too long",
          summary: "Keep the sandbox command under 120 characters so I can pipe it into the terminal.",
        };
      }
      const blocked = BLOCKED_CMD.some((re) => re.test(cmd));
      if (blocked) {
        return {
          resolved: false,
          title: "Command blocked",
          summary: "That command is destructive and I won't run it, even in the sandbox. Ask for something like `nmap -sV target.co`.",
        };
      }
      return {
        resolved: true,
        title: `Running: ${cmd}`,
        summary: "I'm opening the terminal sandbox and will type that for you now. It runs against the lab (target.co, db01.internal) only.",
        nav: "/terminal",
        terminalCmd: cmd,
        note: "Only safe lab commands run here — the sandbox blocks real system changes.",
      };
    }

    case "roadmap": {
      const { ROADMAP_SECTIONS } = await import("@/data/cyberlab/roadmap");
      const tier = intent.tier?.toLowerCase();
      const sec = tier
        ? ROADMAP_SECTIONS.find((s) => s.tier.toLowerCase().includes(tier))
        : ROADMAP_SECTIONS[0];
      if (!sec)
        return {
          resolved: false,
          title: `No “${intent.tier}” tier in the roadmap`,
          summary: "The roadmap has three tiers: Beginner, Intermediate, Advanced. Ask e.g. “roadmap intermediate”.",
        };
      return {
        resolved: true,
        title: `${sec.tier} roadmap`,
        summary: `${sec.topics.length} topics in the ${sec.tier} tier — pick a topic to jump into it.`,
        items: sec.topics.slice(0, 8).map((topic) => ({
          label: `${topic.title} — ${topic.difficulty}`,
          href: "/roadmap",
          desc: topic.description,
        })),
        nav: "/roadmap",
      };
    }

    case "commands": {
      const { COMMANDS } = await import("@/data/commands");
      const q = intent.q.toLowerCase();
      const list = q
        ? COMMANDS.filter(
            (c) => c.name.includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
          ).slice(0, 6)
        : COMMANDS.slice(0, 8);
      const first = list[0];
      return {
        resolved: list.length > 0,
        title: q ? `Commands for “${cap(q)}”` : "Command reference",
        summary: list.length
          ? `${list.length} command${list.length === 1 ? "" : "s"} found.`
          : `No commands matched “${cap(q)}”. Try a name like nmap, curl, or find.`,
        items: list.map((c) => ({
          label: c.name,
          href: "/terminal",
          desc: c.description,
        })),
        code: first ? first.syntax.slice(0, 2).map((s) => s.startsWith("$") ? s : `$ ${s}`) : undefined,
      };
    }

    case "wordlist": {
      return {
        resolved: true,
        title: "Wordlist lab",
        summary: "The wordlist generator builds password lists for learning how weak passwords fail — head over and run it.",
        items: [{ label: "Open wordlist lab →", href: "/wordlist" }],
        nav: "/wordlist",
      };
    }

    case "help": {
      return {
        resolved: true,
        title: "What I can do",
        summary:
          "I'm a floating agent — I answer questions and perform tasks inside this app. Try these:",
        items: [
          { label: "Open tools, guides, attacks, roadmap, terminal", desc: "e.g. “open the tools page”" },
          { label: "Open or explain a tool", desc: "e.g. “open tool nmap” or “what is sqlmap”" },
          { label: "Search the tool database", desc: "e.g. “search tools for wifi cracking”" },
          { label: "List attack playbooks", desc: "e.g. “list attacks for sql injection”" },
          { label: "Run a command in the sandbox", desc: "e.g. “run in the terminal: nmap -sV target.co”" },
          { label: "Ask anything", desc: "I'll answer from the app knowledge if no provider is set, or stream from your AI provider." },
        ],
        note: "Project this whole AI conversation to the /assistant page: open it from the navbar.",
      };
    }

    case "identity": {
      return {
        resolved: true,
        title: "I'm NOX",
        summary:
          "Your on-screen agent for this cyber lab — I float everywhere, answer questions, and can perform tasks like opening tools, searching the database, running sandbox commands, and pulling up playbooks.",
        items: [{ label: "Show what I can do", desc: "Ask “what can you do”", href: undefined }],
      };
    }

    default:
      return {
        resolved: false,
        title: "Unsure",
        summary: "I didn't parse that as a task. Ask me directly: open a tool, search tools, list attacks, or run a sandbox command.",
      };
  }
}

async function resolveToolByName(name: string) {
  const { getToolBySlug, searchTools } = await import("@/data/tools");
  const direct = getToolBySlug(name);
  if (direct) return direct;
  const byName = searchTools(name).find((t) => t.name.toLowerCase() === name.toLowerCase());
  if (byName) return byName;
  return undefined;
}

async function deepSearch(
  base: (q: string) => { slug: string; name: string; summary: string; tags: string[]; cat: string }[],
  query: string,
) {
  const exact = base(query);
  if (exact.length > 0 || !/\s/.test(query.trim())) return exact;
  const stop = new Set(["for", "of", "the", "a", "an", "to", "in", "on", "with", "and", "my", "how", "do", "i", "can"]);
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9._-]+/)
    .filter((t) => t.length >= 2 && !stop.has(t));
  if (tokens.length === 0) return [];
  const scored = new Map<string, { tool: typeof exact[number]; hits: number }>();
  for (const token of tokens) {
    for (const t of base(token)) {
      const hit = scored.get(t.slug);
      if (hit) hit.hits += 1;
      else scored.set(t.slug, { tool: t, hits: 1 });
    }
  }
  return [...scored.values()]
    .map((s) => ({ ...s.tool, hits: s.hits }))
    .sort((a, b) => b.hits - a.hits);
}