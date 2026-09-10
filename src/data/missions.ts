export type MissionDifficulty = "Easy" | "Medium" | "Advanced";

export interface MissionStep {
  label: string;
  cmd: string;
  startsWith?: string[];
  includes?: string[];
}

export interface Mission {
  slug: string;
  title: string;
  icon: string;
  difficulty: MissionDifficulty;
  category: string;
  tagline: string;
  objective: string;
  rewardXp?: number;
  install?: string;
  steps: MissionStep[];
}

export const MISSION_XP: Record<MissionDifficulty, number> = {
  Easy: 15,
  Medium: 25,
  Advanced: 40,
};

export const MISSIONS: Mission[] = [
  {
    slug: "m-nmap",
    title: "Port scout",
    icon: "📡",
    difficulty: "Easy",
    category: "Recon",
    tagline: "A web server is live on target.co. Enumerate it the way every engagement starts.",
    objective: "Map open ports and services on target.co with Nmap.",
    install: "nmap",
    steps: [
      { label: "Version-scan the web server", cmd: "nmap -sV target.co", startsWith: ["nmap"], includes: ["target.co"] },
      { label: "Scan every port top-to-bottom", cmd: "nmap -p- target.co", startsWith: ["nmap", "sudo nmap"], includes: ["target.co", "-p-"] },
    ],
  },
  {
    slug: "m-curl",
    title: "First contact",
    icon: "🔗",
    difficulty: "Easy",
    category: "Web",
    tagline: "Before scanning deep, look at what the site itself tells you.",
    objective: "Fetch the homepage and probe the login page with curl.",
    steps: [
      { label: "Grab the target homepage", cmd: "curl -s http://target.co", startsWith: ["curl"], includes: ["target.co"] },
      { label: "Check the HTTP status of /login.php", cmd: "curl -s -o /dev/null -w '%{http_code}' http://target.co/login.php", startsWith: ["curl"], includes: ["login.php"] },
    ],
  },
  {
    slug: "m-nikto",
    title: "Weakness scanner",
    icon: "🧨",
    difficulty: "Easy",
    category: "Web",
    tagline: "A fast web server scan finds the low-hanging fruit.",
    objective: "Run Nikto against target.co and find common misconfigs.",
    install: "nikto",
    steps: [
      { label: "Scan target.co with Nikto", cmd: "nikto -h http://target.co", startsWith: ["nikto"], includes: ["target.co"] },
    ],
  },
  {
    slug: "m-nc",
    title: "Banner grab",
    icon: "🕹️",
    difficulty: "Easy",
    category: "Network",
    tagline: "Banners leak software versions. Talk to the raw service.",
    objective: "Connect to a port on target.co with netcat and read its banner.",
    install: "netcat-openbsd",
    steps: [
      { label: "Talk to the HTTP port directly", cmd: "nc target.co 80", startsWith: ["nc"], includes: ["target.co", "80"] },
    ],
  },
  {
    slug: "m-dirb",
    title: "Hidden paths",
    icon: "🗂️",
    difficulty: "Medium",
    category: "Web",
    tagline: "Directories live where no link points. Brute-force the site map.",
    objective: "Discover hidden directories on target.co with dirb.",
    install: "dirb",
    steps: [
      { label: "Directory-bust target.co", cmd: "dirb http://target.co /usr/share/wordlists/dirb-common.txt", startsWith: ["dirb"], includes: ["target.co"] },
    ],
  },
  {
    slug: "m-gobuster",
    title: "Directory rush",
    icon: "⚡",
    difficulty: "Medium",
    category: "Web",
    tagline: "dirb is fine, but when you need speed, gobuster wins.",
    objective: "Fuzz directories on target.co with gobuster's wordlist.",
    install: "gobuster",
    steps: [
      { label: "gobuster dir against target.co", cmd: "gobuster dir -u http://target.co -w /usr/share/wordlists/dirb-common.txt", startsWith: ["gobuster"], includes: ["target.co", "dirb-common.txt"] },
    ],
  },
  {
    slug: "m-hydra",
    title: "Login crusher",
    icon: "🔑",
    difficulty: "Medium",
    category: "System",
    tagline: "Weak credentials on exposed SSH are a one-command takeover.",
    objective: "Brute-force the SSH login on target.co with hydra.",
    install: "hydra",
    steps: [
      { label: "Crack SSH users on target.co", cmd: "hydra -L /usr/share/wordlists/usernames.txt -P /usr/share/wordlists/rockyou.txt ssh://target.co", startsWith: ["hydra"], includes: ["target.co", "usernames.txt"] },
      { label: "Confirm with a single fast guess", cmd: "hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://target.co", startsWith: ["hydra"], includes: ["target.co", "admin"] },
    ],
  },
  {
    slug: "m-hashcat",
    title: "Hash breaker",
    icon: "💥",
    difficulty: "Medium",
    category: "Password",
    tagline: "Stolen password hashes are only useful if you can crack them.",
    objective: "Recover the MD5 passwords from the lab hash file.",
    install: "hashcat",
    steps: [
      { label: "Crack hashes.md5 with wordlist + rules", cmd: "hashcat -m 0 -a 0 /home/kali/hashes.md5 /usr/share/wordlists/rockyou.txt", startsWith: ["hashcat"], includes: ["hashes.md5", "rockyou.txt"] },
      { label: "Show the recovered passwords", cmd: "hashcat --show /home/kali/hashes.md5", startsWith: ["hashcat"], includes: ["hashes.md5", "--show"] },
    ],
  },
  {
    slug: "m-theharvester",
    title: "OSINT sweep",
    icon: "🧭",
    difficulty: "Medium",
    category: "Recon",
    tagline: "The same OSINT a real attacker uses before touching the network.",
    objective: "Gather emails and subdomains for target.co with theHarvester.",
    install: "theharvester",
    steps: [
      { label: "Harvest from all public sources", cmd: "theHarvester -d target.co -b all", startsWith: ["theHarvester"], includes: ["target.co"] },
    ],
  },
  {
    slug: "hard-sqlmap",
    title: "Database drain",
    icon: "🗄️",
    difficulty: "Advanced",
    category: "Web",
    tagline: "A parameter that trusts its input. Automate the whole exploit.",
    objective: "Dump the databases and tables exposed by the SQL injection.",
    install: "sqlmap",
    steps: [
      { label: "Discover the databases", cmd: "sqlmap -u http://target.co/login.php?id=1 --dbs --batch", startsWith: ["sqlmap"], includes: ["target.co", "--dbs"] },
      { label: "List tables in targetdb", cmd: "sqlmap -u http://target.co/products.php?id=5 -D targetdb --tables --batch", startsWith: ["sqlmap"], includes: ["targetdb", "--tables"] },
    ],
  },
  {
    slug: "hard-wpscan",
    title: "WordPress intruder",
    icon: "🎭",
    difficulty: "Advanced",
    category: "Web",
    tagline: "CMS misconfigs are gold. Enumerate users and weak plugins.",
    objective: "Enumerate WordPress users on target.co with WPScan.",
    install: "wpscan",
    steps: [
      { label: "Enumerate users & plugins", cmd: "wpscan --url http://target.co --enumerate u", startsWith: ["wpscan"], includes: ["target.co", "--enumerate"] },
    ],
  },
];

export function getMission(slug: string): Mission | undefined {
  return MISSIONS.find((m) => m.slug === slug);
}

export function installStep(mission: Mission): MissionStep {
  return {
    label: `Install ${mission.install} in the lab sandbox`,
    cmd: `sudo apt install -y ${mission.install}`,
    startsWith: ["sudo apt", "apt"],
    includes: ["install", mission.install ?? "package"],
  };
}