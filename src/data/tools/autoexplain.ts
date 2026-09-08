import type { KaliTool } from "../types";

const CATEGORY_SIMPLE: Record<string, string> = {
  recon: "information gathering",
  vuln: "vulnerability finding",
  web: "web application testing",
  password: "password attacks",
  wireless: "wireless network testing",
  exploit: "exploitation",
  sniff: "network sniffing and spoofing",
  post: "post-exploitation",
  forensics: "digital forensics",
  reporting: "reporting and documentation",
  stress: "stress testing",
  social: "social engineering",
  reverse: "reverse engineering",
  hardware: "hardware hacking",
  utils: "general command-line work",
};

const CATEGORY_VERB: Record<string, string> = {
  recon: "scan, map, and gather details about",
  vuln: "find weaknesses in",
  web: "test the security of",
  password: "crack or guess passwords for",
  wireless: "audit the wireless security of",
  exploit: "take control of",
  sniff: "capture and inspect traffic to and from",
  post: "dig deeper into",
  forensics: "analyze evidence related to",
  reporting: "turn findings about",
  stress: "measure the resilience of",
  social: "test awareness against",
  reverse: "dissect and understand",
  hardware: "interface with and probe",
  utils: "work with",
};

/** Plain-English "what is this and why would I use it" for tools without a hand-written guide. */
export function autoPlainExplain(tool: KaliTool): string {
  const cat = CATEGORY_SIMPLE[tool.cat] ?? "security testing";
  const verb = CATEGORY_VERB[tool.cat] ?? "test";

  let rest = tool.summary.trim();
  const lead = tool.name.toLowerCase();
  if (rest.toLowerCase().startsWith(lead)) {
    rest = rest.slice(lead.length).replace(/^[\s.:,—-]+/, "");
  }
  const firstSentence = rest.split(".")[0].trim().replace(/\.+$/, "");
  const cap =
    firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);

  return `Put simply, ${tool.name} is a tool for ${cat}. ${cap}. In plain terms: you run it to ${verb} a target (a website, server, device, or file) and read its output to understand what is there and where the weak spots are. Always run it inside your own lab, a CTF environment, or against systems you have written permission to test.`;
}

/** Plain-English "what does THIS command do" generated from flags heuristics. */
export function autoCommandExplain(tool: KaliTool, cmd: string): string {
  const name = tool.name;
  const lc = cmd.toLowerCase();

  if (lc.includes("--help") || lc.includes(" -h") || lc.trim() === "help") {
    return `Opens ${name}'s built-in help screen so you can see every option it supports, right from your own terminal. Great first step when facing an unfamiliar tool.`;
  }
  if (lc.includes("--version") || lc.includes(" -V ") || lc.trim().endsWith("-v") ) {
    return `Prints the installed version of ${name}. Handy for checking whether a known fixed or vulnerable release is in use.`;
  }
  if (lc.includes("|")) {
    return `Sends the output of another command into ${name} through a pipe, so ${name} has something to work on. This is the foundation of chaining tools together.`;
  }
  const wordlist =
    lc.includes(" -w ") ||
    lc.includes("--wordlist") ||
    lc.includes("/usr/share/wordlists");
  if (wordlist) {
    return `Runs ${name} against a wordlist file so it can try hundreds of thousands of candidates automatically, one after another.`;
  }
  if (lc.includes(" -p ") || lc.includes("--port")) {
    return `Narrows the job down to a specific port or port range instead of scanning everything, which keeps results focused and fast.`;
  }
  if (lc.includes(" -u ") || lc.includes("--url") || lc.startsWith("http")) {
    return `Points ${name} at a specific target URL or address so it knows exactly where to work.`;
  }
  if (lc.includes(" -o ")) {
    return `Saves the results into a file instead of just printing them, so you can review or share them later.`;
  }
  if (lc.includes(" -i ")) {
    return `Tells ${name} which network interface (like eth0 or wlan0) to use, which matters when a machine has several connections.`;
  }
  if (lc.includes(" -t ")) {
    return `Controls how fast or how many parallel workers ${name} uses. Higher means quicker but noisier.`;
  }
  if (lc.includes(" -d ") && lc.includes(" -b ")) {
    return `An all-in-one run: it gathers data about the target and brute-forces additional names or entries.`;
  }
  return `Runs ${name} in one of its standard configurations so you can see it work step by step — a safe starting point that prints clear output you can read and verify.`;
}