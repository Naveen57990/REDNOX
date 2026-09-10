import { VirtualFS } from "./fs";

export interface PkgDef {
  name: string;
  version: string;
  desc: string;
  section: string;
  size: string;
  installedSize: string;
  bins: string[];
  deps?: string[];
}

export const CATALOG: PkgDef[] = [
  { name: "nmap", version: "7.94", desc: "Network exploration tool and security / port scanner", section: "net", size: "2,411 kB", installedSize: "21.4 MB", bins: ["nmap"] },
  { name: "masscan", version: "1.3.2", desc: "Mass IP port scanner, TCP port scanner", section: "net", size: "412 kB", installedSize: "1.8 MB", bins: ["masscan"] },
  { name: "sqlmap", version: "1.7.2", desc: "Automatic SQL injection and database takeover tool", section: "web", size: "3,920 kB", installedSize: "16.0 MB", bins: ["sqlmap"] },
  { name: "hydra", version: "9.5", desc: "Very fast network logon cracker", section: "crack", size: "891 kB", installedSize: "4.2 MB", bins: ["hydra"] },
  { name: "john", version: "1.9.0-jumbo-1", desc: "John the Ripper password cracker", section: "crack", size: "6,442 kB", installedSize: "25.6 MB", bins: ["john", "unshadow"] },
  { name: "hashcat", version: "6.2.6", desc: "Advanced GPU-based password recovery", section: "crack", size: "5,121 kB", installedSize: "31.9 MB", bins: ["hashcat"] },
  { name: "hashid", version: "1.2.0", desc: "Identify the type of a given hash", section: "crack", size: "14 kB", installedSize: "48 kB", bins: ["hashid"] },
  { name: "aircrack-ng", version: "1.7", desc: "Wireless network security assessment suite", section: "wireless", size: "1,922 kB", installedSize: "9.1 MB", bins: ["aircrack-ng", "airodump-ng", "aireplay-ng", "airmon-ng"] },
  { name: "wpscan", version: "3.8.25", desc: "WordPress vulnerability scanner", section: "web", size: "8,120 kB", installedSize: "38.4 MB", bins: ["wpscan"] },
  { name: "nikto", version: "2.5.0", desc: "Web server scanner", section: "web", size: "1,044 kB", installedSize: "11.2 MB", bins: ["nikto"] },
  { name: "gobuster", version: "3.6.0", desc: "Directory/file and DNS busting tool", section: "web", size: "12,402 kB", installedSize: "28.7 MB", bins: ["gobuster"] },
  { name: "ffuf", version: "2.1.0", desc: "Fast web fuzzer", section: "web", size: "4,886 kB", installedSize: "14.3 MB", bins: ["ffuf"] },
  { name: "dirb", version: "2.22", desc: "Web content scanner", section: "web", size: "1,202 kB", installedSize: "5.9 MB", bins: ["dirb"] },
  { name: "dirsearch", version: "0.4.3", desc: "Advanced web path brute-forcer", section: "web", size: "1,662 kB", installedSize: "12.0 MB", bins: ["dirsearch"] },
  { name: "dnsrecon", version: "1.1.0", desc: "DNS enumeration script", section: "recon", size: "291 kB", installedSize: "2.3 MB", bins: ["dnsrecon"] },
  { name: "dnsutils", version: "9.18.24", desc: "DNS client utilities (dig, nslookup)", section: "net", size: "731 kB", installedSize: "3.4 MB", bins: ["dig", "nslookup"] },
  { name: "netcat-openbsd", version: "1.226-1", desc: "TCP/IP swiss army knife", section: "net", size: "118 kB", installedSize: "820 kB", bins: ["nc", "netcat"] },
  { name: "ncat", version: "7.94", desc: "Nmap netcat implementation", section: "net", size: "310 kB", installedSize: "1.1 MB", bins: ["ncat"] },
  { name: "socat", version: "1.7.4.4-2", desc: "Multipurpose relay for bidirectional data transfer", section: "net", size: "392 kB", installedSize: "1.6 MB", bins: ["socat"] },
  { name: "tcpdump", version: "4.99.4-1", desc: "Command-line packet analyzer", section: "net", size: "775 kB", installedSize: "6.1 MB", bins: ["tcpdump"] },
  { name: "tshark", version: "4.0.13", desc: "Dump and analyze network traffic (Wireshark CLI)", section: "net", size: "2,933 kB", installedSize: "17.4 MB", bins: ["tshark"] },
  { name: "traceroute", version: "2.1.5", desc: "Traces the route packets take to a network host", section: "net", size: "78 kB", installedSize: "340 kB", bins: ["traceroute"] },
  { name: "whois", version: "5.5.22", desc: "Intelligent WHOIS client", section: "recon", size: "61 kB", installedSize: "290 kB", bins: ["whois"] },
  { name: "whatweb", version: "0.5.5", desc: "Next generation web scanner", section: "recon", size: "1,442 kB", installedSize: "9.6 MB", bins: ["whatweb"] },
  { name: "theharvester", version: "4.6.0", desc: "E-mail, subdomain and names harvesters", section: "recon", size: "4,310 kB", installedSize: "21.8 MB", bins: ["theHarvester"] },
  { name: "sublist3r", version: "1.1.0", desc: "Fast subdomains enumeration tool", section: "recon", size: "2,550 kB", installedSize: "12.4 MB", bins: ["sublist3r"] },
  { name: "amass", version: "4.2.0", desc: "In-depth attack surface mapping", section: "recon", size: "18,204 kB", installedSize: "52.3 MB", bins: ["amass"] },
  { name: "enum4linux", version: "0.9.1", desc: "Windows/Samba enumeration tool", section: "recon", size: "66 kB", installedSize: "310 kB", bins: ["enum4linux"] },
  { name: "smbclient", version: "4.19.5+dfsg", desc: "Command-line SMB/CIFS client", section: "exploit", size: "923 kB", installedSize: "6.3 MB", bins: ["smbclient"] },
  { name: "metasploit-framework", version: "6.3.33", desc: "Exploitation framework (msfconsole, msfvenom)", section: "exploit", size: "108,392 kB", installedSize: "545 MB", bins: ["msfconsole", "msfvenom"], deps: ["nmap"] },
  { name: "searchsploit", version: "2.6.1", desc: "Exploit-DB command line search tool", section: "exploit", size: "1,220 kB", installedSize: "89.1 MB", bins: ["searchsploit"] },
  { name: "curl", version: "8.6.0", desc: "Command line tool for transferring data over HTTP(S)", section: "net", size: "451 kB", installedSize: "2.2 MB", bins: ["curl"] },
  { name: "wget", version: "1.21.4", desc: "Non-interactive network downloader", section: "net", size: "568 kB", installedSize: "2.7 MB", bins: ["wget"] },
  { name: "git", version: "2.43.0", desc: "Fast, scalable, distributed version control system", section: "devel", size: "9,120 kB", installedSize: "48.3 MB", bins: ["git"] },
  { name: "python3", version: "3.11.5-1", desc: "Interactive high-level object-oriented language", section: "devel", size: "202 kB", installedSize: "2.0 MB", bins: ["python3"], deps: ["pip"] },
  { name: "python3-pip", version: "23.2.1", desc: "Python package installer", section: "devel", size: "1,904 kB", installedSize: "8.7 MB", bins: ["pip", "pip3"] },
  { name: "openssh-client", version: "9.6p1", desc: "Secure shell (SSH) client, for secure access to remote machines", section: "net", size: "1,896 kB", installedSize: "11.8 MB", bins: ["ssh", "scp", "sftp"] },
];

export const PRELOADED = [
  "nmap",
  "curl",
  "wget",
  "git",
  "python3",
  "python3-pip",
  "openssh-client",
];

const byName = new Map<string, PkgDef>();
const byBin = new Map<string, PkgDef>();
for (const p of CATALOG) {
  byName.set(p.name, p);
  for (const b of p.bins) byBin.set(b, p);
}

export function findPkg(name: string): PkgDef | undefined {
  const n = name.toLowerCase();
  return byName.get(n) ?? byName.get(n.replace(/^lib/, "").replace(/-dev$/, ""));
}

export function pkgByBin(bin: string): PkgDef | undefined {
  return byBin.get(bin.toLowerCase());
}

export function installedPkgs(fs: VirtualFS): PkgDef[] {
  return CATALOG.filter((p) => p.bins.every((b) => fs.hasBin(b)));
}

export function pkgInstalled(p: PkgDef, fs: VirtualFS): boolean {
  return p.bins.every((b) => fs.hasBin(b));
}

export function missingDeps(p: PkgDef, fs: VirtualFS): string[] {
  return (p.deps ?? []).filter((d) => {
    const dep = byName.get(d);
    return !dep || !dep.bins.every((b) => fs.hasBin(b));
  });
}