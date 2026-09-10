import type { Line, LineKind } from "./types";
import { VirtualFS } from "./fs";
import { pkgByBin, pkgInstalled, PRELOADED, type PkgDef } from "./packages";

function L(t: string, c?: LineKind): Line {
  return { t, c };
}

const ok = (t: string) => L(t, "ok");
const dim = (t: string) => L(t, "dim");
const warn = (t: string) => L(t, "warn");
const err = (t: string) => L(t, "err");
const cyan = (t: string) => L(t, "cyan");
const title = (t: string) => L(t, "title");
const DL = { t: "", c: "dim" } as Line;

const LAB_HOSTS: Record<string, { ip: string }> = {
  "target.co": { ip: "10.0.0.12" },
  "10.0.0.12": { ip: "10.0.0.12" },
  "db01.internal": { ip: "10.0.0.5" },
  "10.0.0.5": { ip: "10.0.0.5" },
  localhost: { ip: "127.0.0.1" },
  "127.0.0.1": { ip: "127.0.0.1" },
};

function labHost(name: string): { ip: string } | undefined {
  return LAB_HOSTS[name];
}

function blockedExternal(cmd: string): Line[] {
  return [
    warn(`Sandbox: ${cmd} against a live/external target is blocked by design.`),
    dim("Only the simulated lab is reachable from here:"),
    ok("  target.co (10.0.0.12) · db01.internal (10.0.0.5) · localhost"),
    dim("Real targets must be systems you own or are authorized to test."),
  ];
}

function notInstalled(pkg: PkgDef): Line[] {
  const depHint =
    (pkg.deps ?? []).length > 0 ? ` (pulls in: ${pkg.deps?.join(", ")})` : "";
  return [
    err(`${pkg.name} is not installed in this sandbox.`),
    ok(`Install it first:  sudo apt install ${pkg.name}${depHint}`),
    dim("Installs are virtual — they only change this simulated environment."),
  ];
}

function usage(body: Line[]): Line[] {
  return [dim("Usage:"), ...body];
}

function urlHost(url: string): string {
  try {
    const u = new URL(url.includes("://") ? url : `http://${url}`);
    return u.hostname;
  } catch {
    return url;
  }
}

function labUrlOk(url: string): boolean {
  const h = urlHost(url);
  return !!labHost(h);
}

function segLabel(url: string): string {
  const h = urlHost(url);
  return h in LAB_HOSTS && h !== "10.0.0.12" && h !== "10.0.0.5" && h !== "127.0.0.1"
    ? h
    : h === "10.0.0.12"
      ? "target.co"
      : h === "10.0.0.5"
        ? "db01.internal"
        : h === "127.0.0.1"
          ? "localhost"
          : h;
}

function nmapRun(which: string, host: string, args: string[]): Line[] {
  const h = labHost(host);
  if (!h) return blockedExternal(which);
  const vuln = args.indexOf("--script") >= 0 && (args[args.indexOf("--script") + 1] ?? "").includes("vuln");
  const osprobe = args.includes("-A") || args.includes("-O") || args.includes("--osscan-guess");
  const hostLabel = host === "10.0.0.12" ? "target.co" : host === "10.0.0.5" ? "db01.internal" : host === "127.0.0.1" ? "localhost" : host;
  const out: Line[] = [
    dim(`Starting ${which === "masscan" ? "masscan 1.3.2" : "Nmap 7.94"} — (simulated lab scan)`),
    L(`Nmap scan report for ${hostLabel} (${h.ip})${which === "masscan" ? "" : ""}`),
    dim("Host is up (0.0012s latency)."),
  ];
  if (which === "masscan") {
    out.push(
      dim("Discovered open port 22/tcp on " + h.ip),
      dim("Discovered open port 80/tcp on " + h.ip),
      dim(`masscan done: 1 IP address scanned in 0.41 seconds`),
    );
    return out;
  }
  out.push(
    L("PORT    STATE SERVICE VERSION"),
    ok("22/tcp  open  ssh     OpenSSH 9.2p1 Debian"),
    ok("80/tcp  open  http    nginx 1.24.0"),
    ok("443/tcp open  ssl/http nginx 1.24.0"),
    dim("|_http-title: Target Corp Login"),
    dim("|_http-server-header: nginx/1.24.0"),
  );
  if (vuln)
    out.push(
      warn("| http-enum:"),
      dim("|   /login.php: Possible admin folder (200)"),
      dim("|   /wp-login.php: WordPress login (200)"),
      dim("|   /backup.zip: suspicious (200)"),
    );
  if (osprobe)
    out.push(dim("|_OS: Linux 5.x-6.x (97% match: Ubuntu/Kali)"), dim("MAC Address: 08:00:27:2B:3F:91 (Oracle VirtualBox)"));
  out.push(dim(`Nmap done: 1 IP address (1 host up) scanned in ${(1 + Math.random()).toFixed(2)} seconds`));
  return out;
}

function sqlmapRun(args: string[]): Line[] {
  const url = args[args.indexOf("-u") + 1] ?? "";
  const useDbs = args.includes("--dbs");
  const useTables = args.includes("--tables") || args.includes("--dump");
  if (args.includes("--help") || !url) {
    return usage([
      ok("  sqlmap -u http://target.co/login.php?id=1 --dbs --batch"),
      ok("  sqlmap -u http://target.co/products.php?id=5 -D targetdb --tables --batch"),
      ok("  sqlmap -u http://db01.internal:8080/api/users?id=1 --dump --batch"),
      dim("Lab hint: target.co runs a vulnerable PHP app on /login.php and /products.php."),
      dim("db01.internal exposes a small API on :8080."),
    ]);
  }
  if (!labUrlOk(url)) return blockedExternal("sqlmap");
  const hostLabel = segLabel(url);
  const param = /[?&]([\w]+)=/.exec(url)?.[1] ?? "id";
  const out: Line[] = [
    dim("        ___"),
    dim("       __H__"),
    dim(" ___ ___[.]_____ ___ ___  {1.7.2#stable}"),
    dim("|_ -| . [,]     | .'| . |"),
    dim("|___|_  [(]_|_|_|__,|  _|"),
    dim("      |_|V..       |_|   https://sqlmap.org"),
    dim("[*] starting @ 17:0" + (1 + Math.floor(Math.random() * 6)) + "/2026-09-08"),
    warn("[!] legal disclaimer: attacking non-authorized systems is illegal. (simulation)"),
    ok("[*] testing connection to the target URL"),
    dim("[*] checking if the target is protected by a WAF"),
    dim("[*] testing if the target URL content is stable"),
    ok("[+] target URL content is stable"),
    warn(`[*] testing for SQL injection on GET parameter '${param}'`),
    ok(`[+] GET parameter '${param}' is vulnerable. Do you want to keep testing the others (if any)? [y/N]`),
    warn(") looks like the back-end DBMS is 'MySQL'. Do you want to skip test payloads specific for other DBMSes? [Y/n]"),
    ok("[+] injection point confirmed: boolean-based blind"),
    dim(`[*] ${hostLabel} is vulnerable on '${param}' — RDBMS: MySQL`),
  ];
  if (useDbs) {
    out.push(
      dim("[*] fetching database names"),
      dim(`[INFO] the back-end DBMS is MySQL`),
      ok("available databases [3]:"),
      ok("[*] information_schema"),
      ok("[*] targetdb"),
      ok("[*] wordpress"),
    );
  } else if (useTables) {
    out.push(
      dim("[*] fetching tables for database: 'targetdb'"),
      ok("Database: targetdb"),
      dim("[4 tables]"),
      cyan("+--------------------+"),
      cyan("| users              |"),
      cyan("| sessions           |"),
      cyan("| orders             |"),
      cyan("| products           |"),
      cyan("+--------------------+"),
      dim("[*] dumping table 'users'"),
      ok("usr_alice:md5:hashing123 | usr_bob:md5:Hunter2! | admin:plain:admin123"),
    );
  }
  out.push(dim("Next: add --dbs · --dump · --batch to go further."));
  return out;
}

function hydraRun(args: string[]): Line[] {
  const svcMatch = /(ssh|ftp|http-post-form|smb):\/\/([\w.-]+)/.exec(args.join(" "));
  const svc = svcMatch?.[1] ?? "ssh";
  const host = svcMatch?.[2] ?? "target.co";
  if (args.includes("--help")) {
    return usage([
      ok("  hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://target.co"),
      ok("  hydra -L usernames.txt -P /usr/share/wordlists/rockyou.txt ssh://target.co"),
      ok('  hydra -l admin -P rockyou.txt http-post-form "/login.php:u=^USER^&p=^PASS^:Invalid credentials"'),
      ok("  hydra -l root -P /usr/share/wordlists/rockyou.txt ftp://db01.internal"),
      dim("Lab hint: target.co ssh + login.php accept admin/admin123."),
    ]);
  }
  const h = labHost(host);
  if (!h) return blockedExternal("hydra");
  const user = args[args.indexOf("-l") + 1] ?? "admin";
  const out: Line[] = [
    dim("Hydra v9.5 (c) 2026 by van Hauser/THC & David Maciejak"),
    dim(`[DATA] attacking ${svc}://${host} - 1 server, 11 login tries (libssh) (l/p = 1/11)`),
    dim(`[${svc}] ${svc}://${host}:${svc === "ssh" ? 22 : 21}: 1 of 11 try: admin:letmein -> REJECT`),
    dim(`[${svc}] ${svc}://${host}:${svc === "ssh" ? 22 : 21}: 2 of 11 try: admin:password -> REJECT`),
    dim(`[${svc}] ${svc}://${host}:${svc === "ssh" ? 22 : 21}: 3 of 11 try: admin:admin123 -> PASS`),
    ok(`[${svc}] host: ${host}   login: ${user}   password: admin123`),
    ok("[DATA] 1 valid password found"),
    dim("Simulated finding — never reuse weak creds on real systems."),
  ];
  return out;
}

function hashcatRun(args: string[]): Line[] {
  if (args.includes("--help")) {
    return usage([
      ok("  hashcat -m 0 -a 0 /home/kali/hashes.md5 /usr/share/wordlists/rockyou.txt"),
      ok("  hashcat --show /home/kali/hashes.md5"),
      dim("Lab hint: /home/kali/hashes.md5 contains 3 MD5 hashes; rockyou covers them."),
      dim("Hash modes: 0=MD5 · 1000=NTLM · 100=sha1 · 22000=WPA-PBKDF2 (handshake)"),
    ]);
  }
  const mIdx = args.indexOf("-m");
  const mode = mIdx >= 0 ? args[mIdx + 1] : "0";
  const file = args.find((a) => a.includes(".md5") || a.includes("hash")) ?? "/home/kali/hashes.md5";
  return [
    dim("hashcat (v6.2.6) starting in benchmark mode"),
    dim(`OpenCL platform: CPU-only (simulated), Device: #1: "Virtual CPU", 0 slots`),
    ok(`Hashes: ${file}`),
    dim("Initializing backend runtime…"),
    dim(`Session..........: hashcat`),
    dim(`Hash.Target......: File (${file})`),
    dim(`Hash.Mode........: ${mode} (MD5)`),
    dim(`Attack.Mode......: 0 (Straight), Rules.........: None`),
    dim(`Dictionary.......: /usr/share/wordlists/rockyou.txt`),
    ok("5f4dcc3b5aa765d61d8327deb882cf99:password"),
    ok("e10adc3949ba59abbe56e057f20f883e:123456"),
    ok("d8578edf8458ce06fbc5bb76a58c5ca4:qwerty"),
    ok("Cracked: 3/3 digests in 00:00:00.4s"),
    warn("Passwords above were cracked from a scripted lab hash file — practice only."),
  ];
}

function johnRun(args: string[]): Line[] {
  if (args.includes("--help")) {
    return usage([
      ok("  john --format=Raw-MD5 /home/kali/hashes.md5"),
      ok("  john --format=Raw-MD5 /home/kali/hashes.md5 --show"),
      dim("Lab hint: hashes.md5 holds MD5 hashes of rockyou passwords."),
    ]);
  }
  return [
    dim("Created directory: /home/kali/.john"),
    dim(`Using default input encoding: UTF-8`),
    dim(`Loaded 3 password hashes with no different salts (Raw-MD5 [MD5 128/128 AVX2 4x3])`),
    dim(`Node numbers 1-1 of 1 host, Running 4 parallel processes`),
    dim("Press 'q' or Ctrl-C to abort, almost any other key for status"),
    ok("qwerty            (?)"),
    ok("password          (admin)"),
    ok("123456            (dbo)"),
    dim("3g 0:00:00:00 DONE 2/3 (2026-09-08 17:00) 0g/s 666.6Kp/s 666.6Kc/s"),
    warn("Password candidates match the lab's rockyou.txt subset — practice only."),
  ];
}

function hashidRun(args: string[]): Line[] {
  const h = args.find((a) => !a.startsWith("-")) ?? "";
  if (!h) {
    return usage([
      ok("  hashid e10adc3949ba59abbe56e057f20f883e"),
      dim("Lab hint: /home/kali/hashes.md5 has 3 hashes to identify."),
    ]);
  }
  const out: Line[] = [dim(`Analyzing '${h}'`)];
  if (/^[0-9a-f]{32}$/i.test(h)) out.push(ok("[+] MD5"), ok("[+] MD4"), ok("[+] MD2"), ok("[+] Double MD5"));
  else out.push(ok("[+] NTLM"), ok("[+] LM"), ok("[+] MD4"));
  return out;
}

function aircrackRun(args: string[]): Line[] {
  const cap = args.find((a) => a.endsWith(".cap")) ?? "/home/kali/wifi.cap";
  if (args[0]?.startsWith("--help")) {
    return usage([
      ok("  aircrack-ng /home/kali/wifi.cap"),
      ok("  airodump-ng wlan0   →  (interactive view, shown in brief)"),
      dim("Lab hint: /home/kali/wifi.cap holds a handshake for SSID gokali-wifi."),
      dim("Wi-Fi cracking here works only against the sample capture, never live airwaves."),
    ]);
  }
  return [
    dim(`Opening ${cap}`),
    dim("Read 4 packets."),
    dim("#  BSSID              ESSID                     Encryption"),
    dim("1  00:11:22:33:44:55  gokali-wifi              WPA (1 handshake)"),
    DL,
    dim(`Aircrack-ng 1.7 — (WPA) attacking handshake in ${cap}`),
    dim("Starting attack, keys found: 0"),
    ok("KEY FOUND! [ gokali2024 ]"),
    warn("Sample capture only — cracking real handshakes on networks you don't own is illegal."),
  ];
}

function wpscanRun(args: string[]): Line[] {
  const url = args[args.indexOf("--url") + 1] ?? "http://target.co";
  if (args.includes("--help") || !args.some((a) => a.startsWith("--url"))) {
    return usage([
      ok("  wpscan --url http://target.co --enumerate u"),
      ok("  wpscan --url http://target.co --api-token <token>"),
      dim("Lab hint: target.co is WordPress 6.4.2 with an outdated plugin."),
    ]);
  }
  if (!labUrlOk(url)) return blockedExternal("wpscan");
  return [
    dim(`_______________________________________________________________`),
    dim("         __          _______   _____"),
    dim("         \\ \\        / /  __ \\ / ____|"),
    dim("          \\ \\  /\\  / /| |__) | (___    WPScan.org"),
    dim("           \\ \\/  \\/ / |  ___/ \\___ \\"),
    dim("            \\  /\\  /  | |     ____) |  WPScan v3.8.25"),
    dim("             \\/  \\/   |_|    |_____/   WordPress Security Scanner"),
    ok(`[+] URL: ${url} [${segLabel(url)}]`),
    dim("[+] Interesting header(s): Server: nginx · X-Powered-By: PHP/8.1"),
    ok("[+] WordPress version 6.4.2 identified (insecure, released 2023)"),
    warn("[!] No WAF detected"),
    warn("[!] The version is out of date, please update to the latest version"),
    dim("[+] Enumerating All Plugins"),
    warn("[i] Plugin(s) Identified: bbpress/2.6.9 (vulnerable), woocommerce/7.0"),
  ];
}

function niktoRun(args: string[]): Line[] {
  const idx = args.indexOf("-h");
  const target = (idx >= 0 ? args[idx + 1] : undefined) ?? "http://target.co";
  if (!args.some((a) => a === "-h")) {
    return usage([
      ok("  nikto -h http://target.co"),
      ok("  nikto -h http://target.co -ssl -p 443"),
      dim("Lab hint: target.co runs nginx with a few easy-to-find files."),
    ]);
  }
  if (!labUrlOk(target)) return blockedExternal("nikto");
  return [
    dim("- Nikto v2.5.0"),
    dim("---------------------------------------------------------------------------"),
    dim("+ Target IP: 10.0.0.12"),
    dim("+ Target Hostname: target.co"),
    dim("+ Target Port: 80 · Start Time: 2026-09-08 17:00:02"),
    ok("+ Server: nginx/1.24.0"),
    warn("+ /login.php: Admin login page/section found."),
    warn("+ /wp-login.php: WordPress login found (IP-based install)."),
    warn("+ /backup.zip: Backup file found."),
    dim("+ /robots.txt: 1 disallowed entry (see /robots.txt)"),
    dim("+ /config.php: PHP config file found."),
    ok("+ 1 host(s) tested in 8.14 seconds"),
    warn("Findings match the lab's scripted vulnerable app — verify everything in real life."),
  ];
}

function gobusterRun(args: string[]): Line[] {
  const uIdx = args.indexOf("-u");
  const url = uIdx >= 0 ? args[uIdx + 1] : "http://target.co";
  const wIdx = args.indexOf("-w");
  const wordlist = wIdx >= 0 ? args[wIdx + 1] : "/usr/share/wordlists/dirb-common.txt";
  if (args.includes("--help") || (uIdx < 0 && wIdx < 0)) {
    return usage([
      ok("  gobuster dir -u http://target.co -w /usr/share/wordlists/dirb-common.txt"),
      ok("  gobuster dns -d target.co -w /usr/share/wordlists/dns.txt"),
      dim("Lab hint: target.co has admin.php, login.php, wp-login.php, backup.zip."),
    ]);
  }
  if (!labUrlOk(url)) return blockedExternal("gobuster");
  return [
    dim(`===============================================================`),
    dim(`Gobuster v3.6.0 | by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)`),
    dim(`[+] Url: ${url}`),
    dim(`[+] Wordlist: ${wordlist}`),
    ok(`[+] Found: /admin.php (Status: 200) [Size: 3950]`),
    ok(`[+] Found: /login.php (Status: 200) [Size: 3212]`),
    ok(`[+] Found: /backup.zip (Status: 200) [Size: 1048576]`),
    ok(`[+] Found: /robots.txt (Status: 200) [Size: 214]`),
    warn(`[+] Found: /config.php (Status: 200) [Size: 884]`),
    dim(`[*] Progress: 4614 / 4614 (100.00%)`),
    dim(`[!] Finished`),
  ];
}

function ffufRun(args: string[]): Line[] {
  const uIdx = args.indexOf("-u");
  const url = uIdx >= 0 ? args[uIdx + 1] : "";
  if (args.includes("--help") || !url.includes("FUZZ")) {
    return usage([
      ok('  ffuf -u http://target.co/FUZZ -w /usr/share/wordlists/dirb-common.txt'),
      ok("  ffuf -u http://target.co/api/FUZZ -w /usr/share/wordlists/dirb-common.txt"),
      dim("Mark the fuzz point with the FUZZ keyword."),
    ]);
  }
  const h = urlHost(url);
  if (!labHost(h)) return blockedExternal("ffuf");
  return [
    dim(`\n:: Method           : GET`),
    dim(`:: URL              : http://${h}/FUZZ`),
    dim(`:: Wordlist         : FUZZ: /usr/share/wordlists/dirb-common.txt`),
    dim(`:: Follow redirects : false`),
    dim(`:: Progress         : [2048/4614] :: 2 req/s :: 0 errors`),
    ok(`admin.php             [Status: 200, Size: 3950, Words: 421, Lines: 88]`),
    ok(`login.php             [Status: 200, Size: 3212, Words: 340, Lines: 71]`),
    warn(`config.php            [Status: 200, Size: 884, Words: 92, Lines: 21]`),
    warn(`backup.zip            [Status: 200, Size: 1048576, Words: 8, Lines: 1]`),
    dim(`:: Progress         : [4614/4614] :: 92 req/s :: 0 errors`),
    dim(`:: Finalizing...`),
  ];
}

function dirscanRun(cmd: string, args: string[]): Line[] {
  const url = args.find((a) => a.startsWith("http")) ?? undefined;
  if (!url) {
    return usage([
      ok(`  ${cmd} http://target.co`),
      ok(`  ${cmd} http://target.co -r`),
      dim("Lab hint: target.co has admin.php, login.php, backup.zip, config.php."),
    ]);
  }
  if (!labUrlOk(url)) return blockedExternal(cmd);
  return [
    dim(`${cmd === "dirb" ? "DIRB v2.22" : ""} Starting scan at 17:00:01`),
    dim(`SCAN BASE_URL http://${segLabel(url)}/`),
    dim(`Wordlist: /usr/share/wordlists/dirb-common.txt`),
    ok(`+ http://${segLabel(url)}/admin.php (CODE:200|SIZE:3950)`),
    ok(`+ http://${segLabel(url)}/login.php (CODE:200|SIZE:3212)`),
    warn(`+ http://${segLabel(url)}/config.php (CODE:200|SIZE:884)`),
    warn(`+ http://${segLabel(url)}/backup.zip (CODE:200|SIZE:1048576)`),
    dim(`DOWNLOADED: 4614 - FOUND: 4`),
  ];
}

function dnsreconRun(args: string[]): Line[] {
  const dIdx = args.indexOf("-d");
  const domain = dIdx >= 0 ? args[dIdx + 1] : "target.co";
  if (args.includes("--help") || dIdx < 0) {
    return usage([ok("  dnsrecon -d target.co"), dim("Lab hint: target.co resolves to 10.0.0.12 in the lab's /etc/hosts.")]);
  }
  if (domain !== "target.co") return blockedExternal("dnsrecon");
  return [
    dim("[*] Running the enumeration phase: 5 queries"),
    dim("[*] Performing SOA record lookup"),
    L("name: target.co"), dim("mname: ns1.target.co"),
    L("address: 10.0.0.10"),
    ok("[+] A target.co 10.0.0.12"),
    ok("[+] A www.target.co 10.0.0.12"),
    dim("[*] 2 records found"),
  ];
}

function digRun(args: string[]): Line[] {
  const name = args.find((a) => !a.startsWith("-")) ?? "";
  const type = args[args.length - 1] === "TXT" || args[args.length - 1] === "MX" || args[args.length - 1] === "CNAME" ? args[args.length - 1] : "A";
  if (name !== "target.co" && name !== "db01.internal") {
    return [dim(`<<>> DiG 9.18.24 <<>> ${name}`), dim(";; Got answer: (blocked — only lab hosts resolve)"), dim("Use: dig target.co · dig db01.internal")];
  }
  const ip = name === "target.co" ? "10.0.0.12" : "10.0.0.5";
  return [
    dim(`; <<>> DiG 9.18.24 <<>> ${name}`),
    dim(`;; Got answer:`),
    dim(`;; ANSWER SECTION:`),
    ok(`${name}. 300 IN  ${type}  ${type === "A" ? ip : type === "MX" ? "10 mail." + name : "www." + name}`),
    dim(";; Query time: 12 msec · SERVER: 127.0.0.53#53"),
  ];
}

function whoisRun(args: string[]): Line[] {
  const t = args[0] ?? "";
  if (t !== "target.co") return blockedExternal("whois");
  return [
    dim("[whois.verisign-grs.com]"),
    ok("   Domain Name: TARGET.CO"),
    dim("   Registrar: LAB Registrar, Inc."),
    dim("   Registrant Organization: Target Corp (Simulated)"),
    dim("   Creation Date: 2018-03-15 · Registry Expiry Date: 2027-03-15"),
    warn("   WHOIS data here is fabricated lab data — real lookup APIs are not contacted."),
  ];
}

function tracerouteRun(args: string[]): Line[] {
  const t = args[0] ?? "target.co";
  const h = labHost(t);
  if (!h) return blockedExternal("traceroute");
  return [
    dim("traceroute to " + t + " (" + h.ip + "), 30 hops max"),
    ok(" 1  192.168.1.1        0.9 ms   0.8 ms   0.9 ms"),
    ok(" 2  10.0.0.1           3.4 ms   3.2 ms   3.4 ms"),
    ok(" 3  10.0.0.9           12.1 ms  11.9 ms  12.0 ms"),
    ok(" 4  " + h.ip + "        12.8 ms  12.6 ms  12.7 ms"),
    dim("4 hops, simulated lab path."),
  ];
}

function whatwebRun(args: string[]): Line[] {
  const t = args.find((a) => a.startsWith("http")) ?? "http://target.co";
  if (!labUrlOk(t)) return blockedExternal("whatweb");
  return [
    L("http://" + segLabel(t) + " [200 OK]"),
    dim("Country[VIRTUAL][LAB]"),
    dim("HTTPServer[nginx/1.24.0]"),
    ok("HTML5[doctype][header][section][nav]"),
    ok("Title['Target Corp Login']"),
    dim("X-Powered-By[PHP/8.1.2]"),
    ok("WordPress[6.4.2][wp-login.php]"),
  ];
}

function theHarvesterRun(args: string[]): Line[] {
  const dIdx = args.indexOf("-d");
  const domain = dIdx >= 0 ? args[dIdx + 1] : "target.co";
  if (dIdx < 0 || !args.includes("-b")) {
    return usage([
      ok("  theHarvester -d target.co -b all"),
      ok("  theHarvester -d target.co -b google"),
      dim("Lab hint: zero live queries — results are from the lab's seed data."),
    ]);
  }
  if (domain !== "target.co") return blockedExternal("theHarvester");
  return [
    dim("[*] Searching 3 sources: google, crt.sh, linkedin"),
    dim("[*] Emails found:"),
    ok("noreply@target.co"),
    ok("support@target.co"),
    ok("admin@target.co"),
    dim("[*] Hosts found:"),
    ok("www.target.co:10.0.0.12"),
    ok("mail.target.co:10.0.0.13"),
    dim("[*] Results: 5 (seeded lab data)"),
  ];
}

function sublist3rRun(args: string[]): Line[] {
  const dIdx = args.indexOf("-d");
  const domain = dIdx >= 0 ? args[dIdx + 1] : "target.co";
  if (dIdx < 0) return usage([ok("  sublist3r -d target.co")]);
  if (domain !== "target.co") return blockedExternal("sublist3r");
  return [
    dim("\n Sublist3r v1.1  |  By Ahmed Aboul-Ela (@aboul3la / AbdelRahmanW9)"),
    dim("[*] Using Search Engines: Bing, Google, Yahoo, Netcraft, Virustotal, ThreatCrowd, CRT.SH"),
    ok("[+] www.target.co — Found @ CRT.SH"),
    ok("[+] api.target.co — Found @ CRT.SH"),
    ok("[+] mail.target.co — Found @ CRT.SH"),
    dim("[*] Total Unique Subdomains Found: 3"),
  ];
}

function amassRun(args: string[]): Line[] {
  const dIdx = args.indexOf("-d");
  const domain = dIdx >= 0 ? args[dIdx + 1] : "target.co";
  if (dIdx < 0) return usage([ok("  amass enum -d target.co"), dim("Note: full amass takes minutes and needs API keys — the sandbox returns seeded results.")]);
  if (domain !== "target.co") return blockedExternal("amass");
  return [
    dim("OWASP Amass v4.2.0 - Attack Surface Enumeration"),
    dim("[!] The provided API key is not valid (simulated) — using seeded data instead."),
    ok("www.target.co"),
    ok("api.target.co"),
    ok("vpn.target.co"),
    dim("[*] 3 names discovered"),
  ];
}

function enum4linuxRun(args: string[]): Line[] {
  const t = args.find((a) => /^[\w.-]+$/.test(a) && !a.startsWith("-")) ?? "target.co";
  if (t === "target.co" || t === "db01.internal" || t === "10.0.0.12") {
    return [
      dim("Starting enum4linux v0.9.1 ( http://labs.portcullis.co.uk/application/enum4linux/ )"),
      dim(" ============================ Share Enumeration ============================="),
      ok("Sharename       Type      Comment"),
      ok("---------       ----      -------"),
      ok("data            Disk      project data"),
      ok("backups         Disk      nightly backups"),
      ok("print$          Disk      Printer Drivers"),
      dim("[+] Password Info for Domain: TARGET (via SAMBA) - SID S-1-5-21-123456789"),
      warn("Shares are lab fixtures — do not enumerate systems without authorization."),
    ];
  }
  return blockedExternal("enum4linux");
}

function smbclientRun(args: string[]): Line[] {
  const t = args.find((a) => a.includes("//")) ?? "//target.co";
  const host = /\/\/([^/]+)/.exec(t)?.[1] ?? "";
  const h = labHost(host);
  if (!h) return blockedExternal("smbclient");
  return [
    dim("Password for [WORKGROUP\\kali]:"),
    ok("Sharename       Type      Comment"),
    ok("---------       ----      -------"),
    ok("data            Disk      project data"),
    ok("backups         Disk      nightly backups"),
    dim("SMB1 disabled -- no workgroup available"),
    dim("Try: smbclient //target.co/data -U guest"),
  ];
}

function netcatRun(cmd: string, args: string[]): Line[] {
  const isNc = cmd === "nc" || cmd === "netcat";
  const z = args.includes("-z");
  const v = args.includes("-v");
  const port = args.find((a) => /^\d+$/.test(a)) ?? "";
  const host = args.find((a) => !a.startsWith("-") && !/^\d+$/.test(a)) ?? "target.co";
  const listen = args.includes("-l") || args.includes("-L");
  if (listen) {
    return [
      warn(`Sandbox: listening sockets (${cmd} -l) aren't opened — keep practice read-only.`),
      dim("For a listener demo, try the tcpdump / nc banner instead."),
      dim("Real reverse shells belong to authorized labs only."),
    ];
  }
  if (!z && !port) return usage([ok("  nc -zv target.co 80 · nc -zv target.co 22 · nc -zv target.co 443")]);
  const h = labHost(host);
  if (!h) return blockedExternal(cmd);
  return [
    dim(`${isNc ? "Connection to" : "Ncat:"} ${host} (${h.ip}) port ${port} [tcp/*] succeeded!`),
    ok(`PORT ${port} OPEN on ${host}${v ? " — verbose" : ""}`),
    dim("Simulated connect — no real packets left the browser."),
  ];
}

function tcpdumpRun(args: string[]): Line[] {
  const iface = args[args.indexOf("-i") + 1];
  if (!iface) return usage([ok("  tcpdump -i eth0"), ok("  tcpdump -i eth0 -n port 80")]);
  return [
    dim(`tcpdump: verbose output suppressed, use -v[v]... for full protocol decode`),
    dim(`listening on ${iface}, link-type EN10MB (Ethernet), capture size 262144 bytes`),
    ok("17:00:01.112343 IP 10.0.0.5.53612 > 10.0.0.12.80: Flags [S], seq 3735001101"),
    ok("17:00:01.114033 IP 10.0.0.12.80 > 10.0.0.5.53612: Flags [S.], seq 1738917332"),
    ok("17:00:01.114101 IP 10.0.0.5.53612 > 10.0.0.12.80: Flags [.], ack 1"),
    ok("17:00:01.114497 IP 10.0.0.5.53612 > 10.0.0.12.80: Flags [P.], seq 1:218"),
    dim("3 packets captured · 3 packets received · 0 packets dropped (simulated)"),
  ];
}

function tsharkRun(args: string[]): Line[] {
  const f = args.find((a) => a.includes("tcp") || a.includes("http") || a.includes("port"));
  return [
    dim(`tshark (Wireshark) 4.0.13 — live capture view (simulated)`),
    dim(`Capturing on 'eth0'`),
    ok(f ? `  1   0.000000 10.0.0.5 → 10.0.0.12 TCP 66 ${f}` : "  1   0.000000 10.0.0.5 → 10.0.0.12 TCP 66 53612 → 80 [SYN]"),
    ok("  2   0.001613 10.0.0.12 → 10.0.0.5 TCP 66 80 → 53612 [SYN, ACK]"),
    ok("  3   0.001681 10.0.0.5 → 10.0.0.12 TCP 54 53612 → 80 [ACK]"),
    dim("Use filters like: tshark -i eth0 -Y 'http.request'"),
  ];
}

function curlRun(args: string[]): Line[] {
  const url = args.find((a) => a.startsWith("http")) ?? "";
  const silent = args.includes("-s") || args.includes("-si");
  const wCode = args.includes("-w");
  if (!url || args.includes("--help")) {
    return usage([
      ok("  curl http://target.co"),
      ok("  curl -s -o /dev/null -w '%{http_code}' http://target.co/login.php"),
      ok("  curl -X POST -d 'u=admin&p=test' http://target.co/login.php"),
      dim("Lab hint: target.co responds over HTTP/1.1 with nginx."),
    ]);
  }
  const host = urlHost(url);
  if (!labHost(host)) return blockedExternal("curl");
  if (wCode) return [ok("200"), dim("(curl -w simulated)")];
  if (silent) return [dim("<!doctype html><html><head><title>Target Corp Login</title></head></html>")];
  return [
    dim("*   Trying 10.0.0.12:80..."),
    dim("* Connected to " + segLabel(url) + " (10.0.0.12) port 80 (#0)"),
    dim("> GET / HTTP/1.1"),
    dim("> Host: " + segLabel(url) + ""),
    dim("> User-Agent: curl/8.6.0"),
    dim("< HTTP/1.1 200 OK"),
    dim("< Server: nginx/1.24.0"),
    dim("< Content-Type: text/html; charset=UTF-8"),
    DL,
    dim("<!doctype html><html><head><title>Target Corp Login</title>"),
    dim("    <form method=POST action=\"/login.php\">"),
    dim("    <input name=u placeholder=user><input name=p type=password>"),
    dim("</html>"),
  ];
}

function wgetRun(args: string[]): Line[] {
  const url = args.find((a) => a.startsWith("http")) ?? "";
  if (!url || args.includes("--help")) {
    return usage([ok("  wget http://target.co/index.html"), dim("Lab hint: target.co serves /index.html and /robots.txt.")]);
  }
  const host = urlHost(url);
  if (!labHost(host)) return blockedExternal("wget");
  const fname = url.split("/").pop() || "index.html";
  const hostLabel = segLabel(url);
  return [
    dim(`--2026-09-08 17:00:02--  ${url}`),
    dim(`Resolving ${hostLabel} (${hostLabel})... ${host === "10.0.0.12" ? "10.0.0.12" : "10.0.0.5"}`),
    dim(`Connecting to ${hostLabel} ... connected.`),
    dim(`HTTP request sent, awaiting response... 200 OK`),
    ok("Saving to: '/home/kali/" + fname + "'"),
    ok(fname + "   100%[=====================>]  24.0K  --.-KB/s  in 0s"),
    dim("2026-09-08 17:00:02 (78.1 MB/s) - '/home/kali/" + fname + "' saved [24576]"),
  ];
}

function gitRun(args: string[]): Line[] {
  const sub = args[0] ?? "";
  if (sub === "clone") {
    const repo = args.find((a) => a.includes("@") || a.includes("://") || a.includes("github")) ?? "";
    if (!repo) return usage([ok("  git clone http://gitlab.internal/team/app.git"), dim("Lab hint: gitlab.internal is an internal lab server.")]);
    if (!repo.includes("gitlab.internal")) return blockedExternal("git");
    const name = repo.split("/").pop()?.replace(".git", "") ?? "app";
    return [
      dim(`Cloning into '${name}'...`),
      dim("POST git-upload-pack (26 bytes)"),
      ok(`remote: Enumerating objects: 412, done.`),
      ok(`remote: Counting objects: 100% (412/412), done.`),
      ok(`Unpacking objects: 100% (412/412), 1.8 MiB | done.`),
      ok(`Resolving deltas: 100% (204/204), done.`),
    ];
  }
  if (sub === "status") {
    return [
      dim("On branch main"),
      dim("Your branch is up to date with 'origin/main'."),
      warn("Changes not staged for commit:"),
      ok("        modified:   config/app.php"),
    ];
  }
  if (sub === "log") {
    return [
      dim("commit 9fceb3d7a1e2f4c0b9d80a1b2c3d4e5f6a7b8c9d"),
      dim("Author: Dev Kali <kali@gokali.local>"),
      dim("    fix: bump app version to handle lab" + (args.includes("--oneline") ? "" : "")),
      ok("9fceb3d fix: bump app version"),
      ok("7a1b2c3 feat: login page"),
      ok("0d1e2f3 init: app skeleton"),
    ];
  }
  return usage([
    ok("  git clone http://gitlab.internal/team/app.git"),
    ok("  git status · git log --oneline · git diff"),
    dim("Lab hint: clone only works against gitlab.internal."),
  ]);
}

function pythonRun(args: string[]): Line[] {
  if (args.includes("-c")) {
    const code = args[args.indexOf("-c") + 1] ?? "";
    const quoted = code.match(/"((?:[^"\\]|\\.)*)"/g)?.map((s) => s.slice(1, -1));
    return quoted?.length
      ? [L(quoted.filter((q) => !q.startsWith("%")).join(" "))]
      : [dim("(simulated) python3 executed: " + code), dim("Only literal print() is evaluated in the sandbox.")];
  }
  if (args.includes("-i") || args.length === 0) {
    return [
      ok("Python 3.11.5 (main, Aug 24 2026, 08:00:00) [GCC 12.2.0] on linux"),
      dim(`Type "help", "copyright", "credits" or "license" for more information.`),
      warn("Interactive Python isn't multiplexed in the terminal — use: python3 -c 'print(\"hello\")'"),
    ];
  }
  return [dim("python3: can't open file '" + (args.join(" ") || "") + "': No such file or directory")];
}

function sshRun(cmd: string, args: string[]): Line[] {
  const hostArg = args.find((a) => !a.startsWith("-")) ?? "";
  const host = hostArg.split("@").pop() ?? "";
  const user = hostArg.includes("@") ? hostArg.split("@")[0] : "kali";
  if (cmd === "ssh" && (args.includes("-h") || !hostArg)) {
    return usage([
      ok("  ssh kali@target.co"),
      ok("  ssh -p 22 admin@target.co"),
      dim("Lab hint: target.co accepts ssh; admin/admin123 works (but the sandbox won't open a session)."),
    ]);
  }
  const h = labHost(host);
  if (!h) return blockedExternal(cmd);
  return [
    dim(`${user}@${host}'s password: `),
    warn(`Permission denied, please try again.`),
    warn(`Permission denied (publickey,password).`),
    ok("(simulated) ssh connects to lab hosts but interactive sessions are not opened here."),
    dim("Practice: hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://target.co"),
  ];
}

function searchsploitRun(args: string[]): Line[] {
  const q = args.join(" ");
  if (!q) return usage([ok("  searchsploit wordpress 6.4"), ok("  searchsploit nginx 1.24")]);
  const rows: [string, string][] =
    q.includes("wordpress") || q.includes("wp")
      ? [
          ["WordPress Core < 6.4.3 - Arbitrary File Deletion (Metasploit)", "php/webapps/51454.rb"],
          ["WordPress Plugin WooCommerce < 7.2 - Multiple Vulnerabilities", "php/webapps/49803.txt"],
          ["WordPress < 6.4 - SQL Injection via wp-json", "php/webapps/51403.sh"],
        ]
      : q.includes("nginx")
        ? [
            ["nginx < 1.25.3 - 'ngx_http_mp4_module' Memory Corruption (DoS)", "linux/dos/50734.txt"],
            ["nginx 0.x - Multiple Vulnerabilities (BIG-IP)", "linux/remote/50231.rb"],
          ]
        : [["No exact matches in exploit-db (seeded lab index).", "Try: searchsploit wordpress · nginx"]];
  const out: Line[] = [dim("Exploit title                                                                 |  Path")];
  for (const [title, path] of rows) {
    out.push(L(`${title.padEnd(79)}|  ${path}`));
  }
  return out;
}

function msfRun(cmd: string): Line[] {
  if (cmd === "msfvenom") {
    return usage([
      ok("  msfvenom -p linux/x64/shell_reverse_tcp LHOST=tun0 LPORT=4444 -f elf -o shell.elf"),
      ok("  msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.12 LPORT=4444 -f exe -o veh.exe"),
      ok("  msfvenom -p android/meterpreter/reverse_tcp LHOST=10.0.0.12 LPORT=4444 -o app.apk"),
      dim("Note: payloads are generated in-sim (size placeholder) and never executed."),
    ]);
  }
  return [
    dim("                 _  _                    ____    _____"),
    dim(" _ __ ___   __ _(_)(_)  __ _  ___  _ __ |  _ \\  |_   _|"),
    dim("| '_ ` _ \\ / _` / / / | / _` |/ _ \\| '_ \\| |_) |   | |"),
    dim("| | | | | | (_| | | | | | (_| | (_) | |_) |  _ <    | |"),
    dim("|_| |_| |_|\\__,_|_|/ |\\__,_|\\___/| .__/|_| \\_\\   |_|"),
    dim("                    |__/           |_|"),
    ok("       =[ metasploit v6.3.33-dev                         ]"),
    ok("+ -- --=[ 2236 exploits - 1201 auxiliary - 409 post       ]"),
    ok("+ -- --=[ 966 payloads - 46 encoders - 11 nops            ]"),
    warn("Interactive msfconsole sessions aren't multiplexed in this terminal."),
    dim("Practice the concepts here; run real sessions only on authorized labs."),
  ];
}

export function runTool(cmd: string, args: string[], fs: VirtualFS): Line[] | null {
  const pkg = pkgByBin(cmd);
  const first = args[0] ?? "";

  if (pkg && (first === "--help" || first === "-h" || first === "--version" || first === "-V")) {
    if (!pkgInstalled(pkg, fs)) return notInstalled(pkg);
    if (first === "--version" || first === "-V") {
      return [ok(`${cmd} ${pkg.version}`), dim(`(sandbox build — ${pkg.name})`)];
    }
    return [
      title(`${pkg.name} ${pkg.version} — ${pkg.desc}`),
      dim("Run the tool without flags for practice examples tuned to the lab."),
      ok(`  ${cmd} --version · man ${cmd}`),
      dim("All output is simulated against the lab network (target.co / db01.internal / localhost)."),
    ];
  }

  if (pkg && !pkgInstalled(pkg, fs) && !PRELOADED.includes(pkg.name)) {
    return notInstalled(pkg);
  }

  switch (cmd) {
    case "nmap":
    case "masscan": {
      const host = args.find((a) => !a.startsWith("-")) || "target.co";
      return nmapRun(cmd, host, args);
    }
    case "sqlmap":
      return sqlmapRun(args);
    case "hydra":
      return hydraRun(args);
    case "hashcat":
      return hashcatRun(args);
    case "john": {
      if (!pkg || !pkgInstalled(pkg, fs)) return pkg ? notInstalled(pkg) : null;
      return johnRun(args);
    }
    case "hashid":
      return hashidRun(args);
    case "aircrack-ng":
      return aircrackRun(args);
    case "airodump-ng":
      return [
        dim("BSSID              CHAN  MB   ENC CIPHER AUTH  ESSID"),
        dim("00:11:22:33:44:55    1   65   WPA2 CCMP   PSK   gokali-wifi"),
        dim("00:11:22:33:44:66    6   54   WEP            ambient-octopus"),
        warn("Live radio capture isn't possible in a browser — this is a seeded view."),
      ];
    case "aireplay-ng":
      return [
        dim("No such BSSID available (0 clients)"),
        warn("Packet injection requires a local wireless card — simulated only."),
        dim("Try: aircrack-ng /home/kali/wifi.cap"),
      ];
    case "airmon-ng":
      return [dim("PHY Interface   Driver      Chipset"), dim("phy0 wlan0      mac80211     Simulated Wi-Fi (lab)"), warn("Interface is virtual — no live airwaves are touched.")];
    case "wpscan":
      return wpscanRun(args);
    case "nikto":
      return niktoRun(args);
    case "gobuster":
      return gobusterRun(args);
    case "ffuf":
      return ffufRun(args);
    case "dirb":
    case "dirsearch":
      return dirscanRun(cmd, args);
    case "dnsrecon":
      return dnsreconRun(args);
    case "dig":
      return digRun(args);
    case "nslookup": {
      const name = args.find((a) => !a.startsWith("-")) ?? "";
      if (name === "target.co") return [dim("Server: 127.0.0.53 · Address: 127.0.0.53#53"), DL, ok("Name: target.co"), ok("Address: 10.0.0.12")];
      return [dim("Server: 127.0.0.53 · Address: 127.0.0.53#53"), dim(";; no servers could be reached (only lab hosts resolve)")];
    }
    case "whois":
      return whoisRun(args);
    case "traceroute":
      return tracerouteRun(args);
    case "whatweb":
      return whatwebRun(args);
    case "theHarvester":
      return theHarvesterRun(args);
    case "sublist3r":
      return sublist3rRun(args);
    case "amass":
      return amassRun(args);
    case "enum4linux":
      return enum4linuxRun(args);
    case "smbclient":
      return smbclientRun(args);
    case "nc":
    case "netcat":
    case "ncat":
      return netcatRun(cmd, args);
    case "socat":
      return [
        dim("socat by Gerhard Rieger - see www.dest-unreach.org"),
        warn("Tunnels/listeners aren't opened in the sandbox — keep practice read-only."),
        dim("Try the nc example instead: nc -zv target.co 80"),
      ];
    case "tcpdump":
      return tcpdumpRun(args);
    case "tshark":
      return tsharkRun(args);
    case "curl":
      return curlRun(args);
    case "wget":
      return wgetRun(args);
    case "git":
      return gitRun(args);
    case "python3":
      return pythonRun(args);
    case "ssh":
    case "scp":
    case "sftp":
      return sshRun(cmd, args);
    case "msfconsole":
      return msfRun(cmd);
    case "msfvenom":
      return msfRun(cmd);
    case "searchsploit":
      return searchsploitRun(args);
    case "pip":
    case "pip3":
      return null;
    default: {
      if (!pkg || !pkgInstalled(pkg, fs)) return pkg ? notInstalled(pkg) : null;
      return [
        title(`${pkg.name} ${pkg.version} — ${pkg.desc}`),
        dim(`Practice notes: ${cmd} is installed here. Try: man ${cmd}`),
        ok(`  ${cmd} --help · ${cmd} --version · man ${cmd}`),
      ];
    }
  }
}

export function pkgMan(pkg: PkgDef): Line[] {
  return [
    title(`${pkg.name}  (${pkg.version})`),
    dim("NAME"),
    L(pkg.desc + "."),
    dim("SYNOPSIS"),
    ok("  " + pkg.bins.map((b) => `${b} [options]`).join(" · ")),
    dim("DESCRIPTION"),
    L("Simulated practice build. Run the tool live in this sandbox; output is scoped to the lab (target.co · db01.internal · localhost) and never touches real systems."),
    dim("SEE ALSO"),
    ok("  GO KALI — Tools database · Attack Playbooks · AI Assistant"),
  ];
}