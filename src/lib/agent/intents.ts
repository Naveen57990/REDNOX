export type Intent =
  | { action: "openPage"; page: keyof typeof PAGE_ROUTES }
  | { action: "openTool"; name: string }
  | { action: "explainTool"; name: string }
  | { action: "searchTools"; q: string }
  | { action: "popularTools" }
  | { action: "randomTool" }
  | { action: "openGuide"; name: string }
  | { action: "searchGuides"; q: string }
  | { action: "openAttack"; name: string }
  | { action: "listAttacks"; category?: string }
  | { action: "attackOverview" }
  | { action: "runTerminal"; cmd: string }
  | { action: "roadmap"; tier?: string }
  | { action: "commands"; q: string }
  | { action: "wordlist" }
  | { action: "help" }
  | { action: "identity" };

export const PAGE_ROUTES: Record<
  string,
  { href: string; label: string }
> = {
  tools: { href: "/tools", label: "Tools database" },
  guides: { href: "/guides", label: "Master guides" },
  attacks: { href: "/attacks", label: "Attack playbooks" },
  terminal: { href: "/terminal", label: "Terminal sandbox" },
  explorer: { href: "/explorer", label: "Tool explorer" },
  learn: { href: "/learn", label: "Kali learn" },
  lab: { href: "/lab", label: "Lab" },
  roadmap: { href: "/roadmap", label: "Roadmap" },
  wordlist: { href: "/wordlist", label: "Wordlist lab" },
  utilities: { href: "/utilities", label: "Utilities" },
  dashboard: { href: "/dashboard", label: "Dashboard" },
  home: { href: "/", label: "Home" },
};

const atkCategoryWords: Record<string, string> = {
  phish: "social",
  social: "social",
  smish: "social",
  qr: "social",
  mobile: "mobile",
  apk: "mobile",
  android: "mobile",
  phone: "mobile",
  network: "network",
  wifi: "network",
  wi_fi: "network",
  "wi-fi": "network",
  wpa: "network",
  handshake: "network",
  "evil twin": "network",
  web: "web",
  sql: "web",
  injection: "web",
  xss: "web",
  credential: "web",
  stuffing: "web",
  system: "system",
  ssh: "system",
  rdp: "system",
  brute: "system",
  remote: "system",
  physical: "physical",
  badusb: "physical",
  usb: "physical",
  macro: "physical",
  "sim swap": "system",
};

export function matchIntent(input: string): Intent | null {
  const text = input.trim().replace(/\s+/g, " ").toLowerCase().replace(/[.?!,]+$/, "");
  if (!text) return null;

  if (/\b(who are you|your name|what are you|introduce yourself)\b/.test(text))
    return { action: "identity" };

  if (/^(what can you do|help me|^help$|commands? for the agent|show your skills)/.test(text))
    return { action: "help" };

  if (/^(hi|hey|hello|yo|sup|good (morning|afternoon|evening))\b/.test(text))
    return { action: "identity" };

  const runM = text.match(/^(?:run|execute|try|type|test)\s*[:]?\s*(?:in\s+(?:the\s+)?(?:terminal|sandbox)\s*[:]?\s+)?(?:this\s+command\s*[:]?\s+)?([^\s].{1,119})$/);
  if (runM) {
    const cmd = runM[1].trim().replace(/^['"\`]|['"\`]$/g, "");
    if (!/^(go to|the |in |for |any |an |a )/.test(cmd) && !cmd.includes("terminal sandbox"))
      return { action: "runTerminal", cmd };
  }

  const termM = text.match(/(?:in|on|using)\s+(?:the\s+)?(?:terminal|sandbox)\s+(?:run\s+|execute\s+)?(.{2,80})$/);
  if (termM && !termM[1].includes("terminal sandbox"))
    return { action: "runTerminal", cmd: termM[1].trim() };

  if (/(?:list|show|what are|give me)\s+(?:the\s+)?(?:attack playbooks|attacks|playbooks)/.test(text)) {
    const catWord = Object.keys(atkCategoryWords).find((w) => text.includes(w));
    return catWord ? { action: "listAttacks", category: atkCategoryWords[catWord] } : { action: "attackOverview" };
  }
  const attackCat = text.match(/(?:attacks?|playbooks?)\s+(?:for|about)\s+(.{2,40})/);
  if (attackCat) {
    const catWord = Object.keys(atkCategoryWords).find((w) => attackCat[1].includes(w));
    return { action: "listAttacks", category: catWord ? atkCategoryWords[catWord] : undefined };
  }

  const pageM = text.match(/^(?:open|go(?: to)?|show|visit|launch|navigate(?: to)?|take me(?: to)?|get me(?: to)?|start(?: up)?|open up|open the)\s+(?:the\s+|to\s+)?(?:page\s+|section\s+)?([a-z-]+)\s*(?:page|section|database|playbook|lab|sandbox)?$/) ??
    text.match(/^([a-z-]+)\s*(?:page|section)?\s*(?:database|playbook|lab|sandbox)$/);
  if (pageM) {
    const key = pageM[1].replace(/^home$/, "home");
    if (key in PAGE_ROUTES) return { action: "openPage", page: key as keyof typeof PAGE_ROUTES };
  }
  if (/^(?:show me|list|open|go to)\s+(?:all\s+)?(?:the\s+)?(tools|tools database|guides|attacks|attack playbooks|playbooks|terminal|explorer|learn|lab|roadmap|wordlist|utilities|dashboard|home)$/.test(text))
    return { action: "openPage", page: pageNameFromText(text) };

  const toolsFor = text.match(/^(?:search|find|look up|list|show)\s*(?:the\s+)?tools?\s*(?:for|in|about|matching)?\s*[:]?\s*(.{2,60})$/);
  if (toolsFor) return { action: "searchTools", q: toolsFor[1].trim() };
  const findX = text.match(/^(?:find|search|look for|show me tools?(?: for)?)\s+(.{2,60})$/);
  if (findX) return { action: "searchTools", q: findX[1].trim() };
  const catTools = text.match(/^tools?\s*(?:for|in)\s+(.{2,40})$/i);
  if (catTools) return { action: "searchTools", q: catTools[1].trim() };

  if (/\b(today['’]?s)?(?:top|popular|best|featured)\s+tools?\b/.test(text))
    return { action: "popularTools" };
  if (/\brandom tool\b|surprise me|give me a tool/.test(text))
    return { action: "randomTool" };

  const openTool = text.match(/^(?:open|go to|launch|show me|open the|open the tool)\s+(?:the\s+)?(?:tool\s+)?([a-z0-9._-]{2,40})$/);
  if (openTool) return { action: "openTool", name: openTool[1].trim() };
  const toolPage = text.match(/^(?:open|go to|find|show)\s+([a-z0-9._-]{2,40})\s+(?:the\s+)?(?:tool|page)$/);
  if (toolPage) return { action: "openTool", name: toolPage[1].trim() };
  const whatIs = text.match(/^(?:what is|what's|what are|explain|tell me about|about|define)\s+(?:the\s+)?(?:tool\s+)?([a-z0-9._-]{2,40})$/);
  if (whatIs) return { action: "explainTool", name: whatIs[1].trim() };

  const guide = text.match(/^(?:open|go to|show)\s+(?:the\s+)?(?:guide|master guide)\s+(?:for|of|on)?\s*([a-z0-9._-]{2,40})$/);
  if (guide) return { action: "openGuide", name: guide[1].trim() };
  const guidesSearch = text.match(/(?:search|find|show)\s+(?:master\s+)?guides?\s*(?:about|for|matching)?\s*[:]?\s*(.{2,60})$/);
  if (guidesSearch) return { action: "searchGuides", q: guidesSearch[1].trim() };

  const attackByName = text.match(/^(?:open|show|explain|go to)\s+(?:the\s+)?(?:attack|playbook)\s+(?:for|of|on)?\s*([a-z0-9._-]{3,40})$/);
  if (attackByName) return { action: "openAttack", name: attackByName[1].trim() };

  if (/attacks?|playbooks?/.test(text)) return { action: "attackOverview" };

  const roadmapM = text.match(/roadmap(?:\s+(beginner|intermediate|advanced))?/);
  if (roadmapM) return { action: "roadmap", tier: roadmapM[1] };

  const cmdQ = text.match(/(?:linux\s+)?(?:commands?|cli)\s*(?:for|about|on)?\s*[:]?\s*(.{2,50})$/);
  if (cmdQ && /command|cli|terminal basics/.test(text))
    return { action: "commands", q: cmdQ[1].trim() };
  if (/^commands?$|command list|linux commands/.test(text))
    return { action: "commands", q: "" };

  if (/\bwordlist\b/.test(text)) return { action: "wordlist" };

  return null;
}

function pageNameFromText(text: string): keyof typeof PAGE_ROUTES {
  const t = text.toLowerCase();
  for (const key of Object.keys(PAGE_ROUTES)) {
    const label = PAGE_ROUTES[key].label.toLowerCase();
    if (t.includes(label) || (key !== "home" && t.includes(`${key === "attacks" ? "attack" : key} `)) || t.trim() === key)
      return key as keyof typeof PAGE_ROUTES;
  }
  if (/playbooks?/.test(t)) return "attacks";
  return "tools";
}