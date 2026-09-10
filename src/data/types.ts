export interface KaliTool {
  slug: string;
  name: string;
  cat: string;
  summary: string;
  install: string;
  commands: string[];
  tags: string[];
}

/** A command plus a plain-English explanation of what it does and why you'd run it. */
export interface CommandSpec {
  cmd: string;
  explain: string;
}

/**
 * A deep-dive "become a master" guide for a popular tool.
 * `intro` is markdown covering what/why/when, install and a sanity check.
 * Each section is a further chunk of markdown with its own heading.
 */
export interface MasterGuideSection {
  title: string;
  md: string;
}

export interface MasterGuide {
  slug: string;
  /** Short descriptor shown next to the tool name, e.g. "port scanner". */
  tagline: string;
  intro: string;
  sections: MasterGuideSection[];
}

export interface ToolCategory {
  id: string;
  label: string;
  icon: string;
  blurb: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  { id: "recon", label: "Information Gathering", icon: "🔎", blurb: "Discover hosts, domains, services and people." },
  { id: "vuln", label: "Vulnerability Analysis", icon: "🧨", blurb: "Scan for weaknesses, CVEs and misconfigurations." },
  { id: "web", label: "Web Application Analysis", icon: "🌐", blurb: "Attack and audit the web layer: SQLi, XSS, LFI and more." },
  { id: "password", label: "Password Attacks", icon: "🔑", blurb: "Crack hashes, brute-force logins, generate wordlists." },
  { id: "wireless", label: "Wireless Attacks", icon: "📡", blurb: "Audit Wi-Fi networks: capture, deauth, crack WPA." },
  { id: "exploit", label: "Exploitation Tools", icon: "💥", blurb: "Weaponize vulnerabilities with payloads and frameworks." },
  { id: "sniff", label: "Sniffing & Spoofing", icon: "🕵️", blurb: "Capture traffic, poison ARP/DNS, run MITM rigs." },
  { id: "post", label: "Post Exploitation", icon: "🦠", blurb: "Privilege escalation, pivoting, credential hunting." },
  { id: "forensics", label: "Digital Forensics", icon: "🧬", blurb: "Acquire images, carve files, analyze memory and drives." },
  { id: "reporting", label: "Reporting Tools", icon: "📝", blurb: "Turn findings into documents, metrics and visuals." },
  { id: "stress", label: "Stress Testing", icon: "🏋️", blurb: "Load-test and measure denial-of-service resilience." },
  { id: "social", label: "Social Engineering", icon: "🎭", blurb: "Phishing kits and credential-harvesting frameworks." },
  { id: "reverse", label: "Reverse Engineering", icon: "🧩", blurb: "Dissect binaries, APKs, firmware and malware." },
  { id: "hardware", label: "Hardware Hacking", icon: "🔌", blurb: "Interface with embedded devices, chips and radios." },
  { id: "utils", label: "Utilities", icon: "🧰", blurb: "General command-line power tools every tester uses." },
];

export const REAL_TOOL_COUNT = 637;