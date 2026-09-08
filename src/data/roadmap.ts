export interface RoadmapSkill {
  name: string;
  description: string;
}

export interface RoadmapPhase {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  duration: string;
  xp: number;
  tools: string[];
  skills: RoadmapSkill[];
  challenge: string;
}

export const ROADMAP: RoadmapPhase[] = [
  {
    slug: "foundations",
    number: 1,
    title: "Security Foundations",
    tagline: "Think like a defender and an attacker. Know your ethics.",
    duration: "2 weeks",
    xp: 100,
    tools: [],
    skills: [
      { name: "CIA triad", description: "Confidentiality, integrity, availability — the core model." },
      { name: "Threat models", description: "Who wants your data and what paths can they take?" },
      { name: "Attack types", description: "Network, web, social, physical — a taxonomy of attacks." },
      { name: "Ethics & legality", description: "Authorization, scope, and responsible disclosure." },
    ],
    challenge: "Find your browser's security settings and explain how each one maps to CIA.",
  },
  {
    slug: "linux-essentials",
    number: 2,
    title: "Linux & the CLI",
    tagline: "Kali is Linux. Live in the terminal.",
    duration: "3 weeks",
    xp: 200,
    tools: ["bash", "grep", "find", "awk", "sed"],
    skills: [
      { name: "Shell navigation", description: "cd, ls, pwd, file layout (FHS)." },
      { name: "Text processing", description: "grep, awk, sed, cut — parse anything." },
      { name: "Permissions", description: "chmod, chown, users, groups, sudo." },
      { name: "Processes & services", description: "ps, top, systemctl, kill." },
      { name: "Scripting", description: "Bash one-liners and loops for recon." },
    ],
    challenge: "Use our Terminal Sandbox to read /etc/passwd and parse it with grep and awk.",
  },
  {
    slug: "networking",
    number: 3,
    title: "Networking essentials",
    tagline: "Know how data gets from A to B — and where it's exposed.",
    duration: "3 weeks",
    xp: 250,
    tools: ["ip", "nmap", "tcpdump", "wireshark"],
    skills: [
      { name: "OSI / TCP-IP", description: "Layers, encapsulation, key protocols." },
      { name: "IPv4 & subnetting", description: "Calculate subnets from memory." },
      { name: "Core protocols", description: "TCP, UDP, HTTP/S, DNS, DHCP, TLS." },
      { name: "Packet analysis", description: "tcpdump and Wireshark basics." },
    ],
    challenge: "Trace a full HTTP request through each OSI layer and list the headers added.",
  },
  {
    slug: "recon",
    number: 4,
    title: "Information Gathering",
    tagline: "Passive OSINT rides on public data. No touching required.",
    duration: "2 weeks",
    xp: 200,
    tools: ["theHarvester", "whois", "dig", "dnsrecon", "searchsploit"],
    skills: [
      { name: "Passive recon", description: "OSINT, WHOIS, subdomain discovery." },
      { name: "DNS enumeration", description: "dig, nslookup, dnsrecon, zone transfers." },
      { name: "Google dorking", description: "site:, filetype:, inurl: operators." },
      { name: "Shodan & Censys", description: "Internet-wide device search." },
    ],
    challenge: "Run a passive recon exercise on your own domain only. Document the footprint.",
  },
  {
    slug: "scanning-enumeration",
    number: 5,
    title: "Scanning & Enumeration",
    tagline: "Ports, services, versions — every open door gets counted.",
    duration: "3 weeks",
    xp: 300,
    tools: ["nmap", "masscan", "netcat", "enum4linux", "gobuster"],
    skills: [
      { name: "Port scanning", description: "TCP/UDP, SYN, stealth, NSE scripts." },
      { name: "Banner grabbing", description: "nc, version fingerprinting." },
      { name: "Service enumeration", description: "SMB, SSH, HTTP, SNMP." },
      { name: "Web enumeration", description: "gobuster, ffuf, robots, sitemap." },
    ],
    challenge: "Scan a local practice VM (Metasploitable) and map every open service to its reason.",
  },
  {
    slug: "vulnerability-analysis",
    number: 6,
    title: "Vulnerability Analysis",
    tagline: "Match services to known flaws. Research beats brute force.",
    duration: "3 weeks",
    xp: 300,
    tools: ["searchsploit", "nmap NSE vuln", "metasploit", "nikto", "nessus"],
    skills: [
      { name: "CVE / CWE model", description: "Find, read, and rank vulnerability entries." },
      { name: "ExploitDB & searchsploit", description: "Locate working proof-of-concepts." },
      { name: "CVSS scoring", description: "Rate severity like the pros." },
      { name: "NSE & scanners", description: "Automated weakness checks done right." },
    ],
    challenge: "Take 3 CVEs for an old nginx build and write which CWE / CVSS each maps to.",
  },
  {
    slug: "exploitation",
    number: 7,
    title: "Exploitation Basics",
    tagline: "Turn a flaw into access — in a lab, never live targets.",
    duration: "4 weeks",
    xp: 400,
    tools: ["msfconsole", "msfvenom", "metasploit", "burpsuite", "sqlmap"],
    skills: [
      { name: "Recon-to-exploit flow", description: "Tie every phase together on a lab VM." },
      { name: "Metasploit framework", description: "Meterpreter sessions, payloads, post." },
      { name: "Reverse shells", description: "Bind vs reverse, stagers, handlers." },
      { name: "Privilege escalation", description: "SUID, sudo misconfig, kernel flaws (lab only)." },
    ],
    challenge: "Exploit a Metasploitable VM end-to-end, then write a walkthrough document.",
  },
  {
    slug: "password-attacks",
    number: 8,
    title: "Password Attacks",
    tagline: "Weak hashes fall fast. Crack smart, not brute.",
    duration: "3 weeks",
    xp: 300,
    tools: ["hashcat", "john", "hydra", "cewl", "crunch"],
    skills: [
      { name: "Password theory", description: "Entropy, reuse, dark-web credential pools." },
      { name: "Hash identification", description: "Identify and verify hashes before cracking." },
      { name: "Offline cracking", description: "hashcat / john with GPU & rules." },
      { name: "Wordlist generation", description: "cewl, crunch, and our Wordlist Generator." },
    ],
    challenge: "Crack a lab hash from the rockyou wordlist, then crack the same hash with 2 mutation rules.",
  },
  {
    slug: "web-security",
    number: 9,
    title: "Web Application Security",
    tagline: "OWASP Top 10 — learn the classes, then the craft.",
    duration: "4 weeks",
    xp: 400,
    tools: ["burpsuite", "owasp-zap", "sqlmap", "nikto", "commix"],
    skills: [
      { name: "HTTP deep dive", description: "Methods, headers, cookies, sessions." },
      { name: "OWASP Top 10", description: "Injection, XSS, CSRF, SSRF, auth flaws…" },
      { name: "Burp / ZAP", description: "Intercept, fuzz, and inspect traffic." },
      { name: "Common exploits", description: "SQLi, XSS, IDOR, file uploads (lab only)." },
    ],
    challenge: "Complete a DVWA (lab) walkthrough for each OWASP Top 10 class in a report.",
  },
  {
    slug: "post-exploitation",
    number: 10,
    title: "Post-Exploitation & Reporting",
    tagline: "Lateral move, persist, clean up, and write it up. The real job.",
    duration: "4 weeks",
    xp: 400,
    tools: ["metasploit", "mimikatz", "linpeas", "maldetect", "exiftool"],
    skills: [
      { name: "Lateral movement", description: "Pivoting, pass-the-hash, credential hunting." },
      { name: "Persistence", description: "Services, cron, startup hooks (lab only)." },
      { name: "Log management", description: "Cover your tracks responsibly in labs." },
      { name: "Report writing", description: "Exec summary, findings, evidence, remediation." },
    ],
    challenge: "Write a full penetration test report for your lab engagement — findings, CVSS, remediation.",
  },
];

export const TOTAL_XP = ROADMAP.reduce((sum, p) => sum + p.xp, 0);
export const TOTAL_WEEKS = 4 * 4 + 2 + 3 + 3 + 3 + 4 + 3 + 4;