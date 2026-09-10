export type CaseTier = "Easy" | "Medium" | "Hard";

export interface ChallengeCase {
  id: string;
  tier: CaseTier;
  text: string;
  options: string[];
  answer: number;
  explain: string;
}

export const CHALLENGE_CASES: ChallengeCase[] = [
  {
    id: "case-phish",
    tier: "Easy",
    text:
      "You receive an urgent email claiming your account was locked, with a login button that leads to a lookalike portal. Your credentials are captured the moment you type them. What category of attack is this?",
    options: [
      "SQL injection",
      "Phishing / social engineering",
      "Denial of service",
      "Wireless deauth",
    ],
    answer: 1,
    explain:
      "Phishing targets the person — urgency and a fake login page harvest credentials, like the playbooks in the Social Engineering category.",
  },
  {
    id: "case-scan",
    tier: "Easy",
    text:
      "Before attacking anything, a tester maps which hosts are alive and which ports are open, noting service versions. Which tool is purpose-built for the first step?",
    options: ["hashcat", "nmap", "wpscan", "bettercap"],
    answer: 1,
    explain:
      "Nmap is the de-facto network scanner — host discovery, port scans and service/version detection in one tool.",
  },
  {
    id: "case-dirb",
    tier: "Medium",
    text:
      "The homepage looks clean, but you suspect hidden admin paths and backup files are reachable. You want to brute-force the server's directory structure. What's the right tool + approach?",
    options: [
      "gobuster dir with a wordlist",
      "hashcat with a rule set",
      "wireshark capture filtering",
      "airodump-ng channel scan",
    ],
    answer: 0,
    explain:
      "Directory/file busting — gobuster (or dirb/ffuf) fuzzes paths over HTTP using a wordlist. hashcat cracks hashes, not directories.",
  },
  {
    id: "case-hydra",
    tier: "Medium",
    text:
      "An SSH server accepts only weak passwords and the user list is already known from a previous enum. Fastest way to test for a weak login?",
    options: [
      "Hydra brute force against ssh://",
      "Nmap service scan with -sV",
      "Tcpdump on the loopback",
      "searchsploit for the SSH version",
    ],
    answer: 0,
    explain:
      "With known usernames, hydra tests password candidates directly against the SSH service — the classic 'login crusher' workflow.",
  },
  {
    id: "case-sqli",
    tier: "Hard",
    text:
      "A login page mirrors your input into the SQL query unsafely. You confirm the error but don't want to hand-craft every clause. What automates the whole database dump?",
    options: [
      "sqlmap with --dbs and --tables",
      "nikto -h for misconfigs",
      "curl with a crafted cookie jar",
      "theHarvester -d for OSINT",
    ],
    answer: 0,
    explain:
      "sqlmap detects and exploits SQL injection automatically — discover DBs with --dbs, list tables with --tables, and dump with --dump.",
  },
  {
    id: "case-wifi",
    tier: "Hard",
    text:
      "You captured a four-way handshake from a WPA2 network. Offline, you want to try a massive password list against the captured handshake. Which tool processes the .cap file?",
    options: [
      "aircrack-ng on the handshake file",
      "nmap -sC default scripts",
      "gobuster DNS mode",
      "wpscan --enumerate u",
    ],
    answer: 0,
    explain:
      "aircrack-ng (or hashcat with the hccapx) runs the password dictionary against the captured handshake offline — no network needed.",
  },
  {
    id: "case-mitm",
    tier: "Hard",
    text:
      "On a shared network, you want to silently intercept traffic between a victim and the gateway. ARP poisoning puts you in the middle. Which toolset is made for this?",
    options: [
      "bettercap (or arpspoof + tcpdump)",
      "masscan rate-limited scan",
      "enum4linux SMB enumeration",
      "metasploit msfvenom payload",
    ],
    answer: 0,
    explain:
      "ARP spoofing routes the victim's traffic through you, letting you capture it with tcpdump/wireshark — the layered MITM rig from Basic Recon-Networking.",
  },
  {
    id: "case-privesc",
    tier: "Medium",
    text:
      "You've gained a shell as a low-privilege user and need to become root. You want a checklist of SUID binaries, misconfigured services and writable files. Which tool is the standard first pass?",
    options: ["linpeas", "burpsuite", "bettercap", "zed attack proxy"],
    answer: 0,
    explain:
      "LinPEAS (from the Post Exploitation wall) scans a box for privilege-escalation vectors — SUID, capabilities, services, cron jobs and more.",
  },
  {
    id: "case-wordlist",
    tier: "Easy",
    text:
      "You need to generate a custom password list based on a target's name and preferences for a focused attack. Which lab helper builds that list?",
    options: ["Wordlist generator", "Nmap NSE scripts", "Tshark capture", "msfvenom payload"],
    answer: 0,
    explain:
      "The app's wordlist lab builds name-plus-variations password lists — exactly the seeded input for hydra-style attacks.",
  },
  {
    id: "case-hash",
    tier: "Medium",
    text:
      "You found a file of MD5 hashes. Before cracking, you want to confirm each hash's format quickly. Which small tool identifies hash types?",
    options: ["hashid", "whois", "netdiscover", "autopsy"],
    answer: 0,
    explain:
      "hashid inspects a hash and guesses its algorithm (MD5, SHA1, bcrypt…) — then you hand the right one to hashcat/john.",
  },
  {
    id: "case-forensics",
    tier: "Hard",
    text:
      "After an incident, you must analyze a raw disk image for deleted files and embedded data. Which tool is designed to carve recovered artifacts from images?",
    options: [
      "Autopsy / forensic image analysis",
      "aircrack-ng handshake crack",
      "hydra login brute force",
      "subfinder subdomain enum",
    ],
    answer: 0,
    explain:
      "Digital forensics (Autopsy, binwalk, volatility) reconstructs files and memory from images — the opposite of offensive scanning.",
  },
  {
    id: "case-oauth",
    tier: "Hard",
    text:
      "A malicious app asks for 'offline access' to a victim's account and is registered by an attacker. The user just wants a quiz and unknowingly grants full access. What's the practical defense?",
    options: [
      "Reject overly-broad scopes & require review",
      "Turn off wifi encryption",
      "Use hydra to change the app password",
      "Block all DNS resolution",
    ],
    answer: 0,
    explain:
      "Scope review is the fix — 'offline access' tokens persist after logout, so apps must justify what they truly need.",
  },
  {
    id: "case-path",
    tier: "Easy",
    text:
      "A support person asks you to find where a command's binary actually lives on disk. Which command answers that?",
    options: ["which", "crack", "adduser", "ipconfig"],
    answer: 0,
    explain:
      "`which nmap` shows the resolved path of the executable in PATH.",
  },
  {
    id: "case-package",
    tier: "Easy",
    text:
      "You just installed a tool pack and want to confirm it's actually on disk with its files. Which command shows installed-package details?",
    options: ["dpkg -l", "whoami", "traceroute", "sleep"],
    answer: 0,
    explain:
      "`dpkg -l` lists installed packages; `dpkg -s` shows details — the standard package verification path.",
  },
];