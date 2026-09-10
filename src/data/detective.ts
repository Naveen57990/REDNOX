export type DetectiveDifficulty = "Easy" | "Hard";

export interface DetectiveStep {
  q: string;
  options: string[];
  answer: number;
  explain: string;
  clue: string;
}

export interface DetectiveCase {
  slug: string;
  difficulty: DetectiveDifficulty;
  title: string;
  tagline: string;
  story: string[];
  steps: DetectiveStep[];
}

export const DETECTIVE_CASES: DetectiveCase[] = [
  {
    slug: "brute-ssh",
    difficulty: "Easy",
    title: "The Weakest Link",
    tagline: "One open port, one bad password.",
    story: [
      "A junior admin stood up target.co (10.0.0.12) to host the company demo. They opened SSH, picked a password from the word 'password', and never look at auth logs.",
      "You are hired to prove the exposure. Your brief: show that the box can be taken over without any knowledge beyond an open service.",
    ],
    steps: [
      {
        q: "First, confirm the SSH port is actually open. What's the fastest reliable check?",
        options: [
          "nmap -p 22 -sV target.co",
          "hydra -l root ssh://target.co",
          "theHarvester -d target.co -b all",
          "responder -I eth0",
        ],
        answer: 0,
        clue: "Start with discovery, not exploitation.",
        explain:
          "Nmap first: `-p 22` targets the port, `-sV` confirms the SSH version. You never attack what you have not observed.",
      },
      {
        q: "SSH is open and the vendor default 'student' user exists. What's the right way to test weak logins?",
        options: [
          "hashcat -m 0 hash.txt rockyou.txt",
          "hydra -L usernames.txt -P rockyou.txt ssh://target.co",
          "aircrack-ng capture.cap",
          "sqlmap -u http://target.co --dbs",
        ],
        answer: 1,
        clue: "This is a login brute force against a service, not a hash crack.",
        explain:
          "hydra is the 'login crusher' — it pumps the username and password lists straight at the SSH service. hashcat is for offline hash cracking.",
      },
      {
        q: "Hydra found student:iloveyou. You log in. Now what's the professional move?",
        options: [
          "Delete the log files with rm -rf",
          "Install a keylogger and keep access",
          "Document the finding and recommend hardening",
          "Pivot to the database immediately",
        ],
        answer: 2,
        clue: "An ethical engagement ends with a report, not vandalism.",
        explain:
          "A weak credential is a reportable finding: change the password, disable password auth or root login, and monitor. Never deface a client's box.",
      },
    ],
  },
  {
    slug: "hidden-locker",
    difficulty: "Easy",
    title: "The Hidden Locker",
    tagline: "A directory that was never meant to be public.",
    story: [
      "The marketing site on target.co serves a clean homepage, but the backend runs its own file server on the same host. Word on the street: there is a folder with backup files nobody remembers securing.",
      "Your task is to locate the hidden directory without breaking anything.",
    ],
    steps: [
      {
        q: "A home page that looks clean can still expose a hidden path. Which tool checks the common ones?",
        options: [
          "dirb http://target.co /usr/share/wordlists/dirb-common.txt",
          "sqlmap -u http://target.co/contact.php --dbs",
          "wpscan --url http://target.co --enumerate u",
          "hashcat -m 0 -a 0 hashes.md5 rockyou.txt",
        ],
        answer: 0,
        clue: "Directory busting — walking the HTTP paths with a wordlist.",
        explain:
          "dirb (and gobuster/ffuf) walks the server's filesystem for you using the dirb-common wordlist — exactly how you find /backup.",
      },
      {
        q: "dirb found /backup, a directory listing full of .sql dumps. Before downloading, what's the responsible move?",
        options: [
          "Note what's exposed, don't mass-download personal data",
          "Grab every dump to 'have proof'",
          "Run rm -rf on the server",
          "Share the URLs on a forum",
        ],
        answer: 0,
        clue: "Minimize data touched; the finding is the exposure itself.",
        explain:
          "You document what is exposed and stop there. Pulling everyone's records 'for proof' escalates the damage the client has to report.",
      },
      {
        q: "What's the root cause to fix here, not just the symptom?",
        options: [
          "Disable directory listing and move backups off the web root",
          "Buy a bigger firewall",
          "Change the homepage text",
          "Reboot the server daily",
        ],
        answer: 0,
        clue: "Backup files should never live under a web-served directory.",
        explain:
          "Directory listing off + backups off-server (or at minimum unguessable and auth'd) closes the finding properly.",
      },
    ],
  },
  {
    slug: "database-injection",
    difficulty: "Hard",
    title: "The Porous Gateway",
    tagline: "Somewhere in POST, a query breaks.",
    story: [
      "db01.internal (10.0.0.5) hosts the customer database behind a thin web API. The API has always been 'tested'. A curl to /login with a single quote in the username causes a 500 — and the error leaks the SQL.",
      "You must prove the injection is exploitable and realistically report impact. The app team insists their query is 'safe' because they saw no banner.",
    ],
    steps: [
      {
        q: "A quote in input breaks the query. What's the first decisive step?",
        options: [
          "sqlmap -u http://db01.internal/login --data='user=x&pass=y' --batch",
          "nmap -sV -p 22 db01.internal",
          "theHarvester -d db01.internal -b linkedin",
          "aircrack-ng -b 00:11:22:33:44:55 cap.pcap",
        ],
        answer: 0,
        clue: "Automate the confirmation — that's what sqlmap exists for.",
        explain:
          "sqlmap --data targets a POST parameter. --batch answers every prompt automatically and proves whether the parameter is injectable.",
      },
      {
        q: "sqlmap confirms a boolean-based blind injection on 'user'. Which option maps out the databases?",
        options: [
          "--dbs then --tables -D <name>",
          "--os-shell then shutdown the server",
          "--current-user only",
          "--technique=E and stop there",
        ],
        answer: 0,
        clue: "Inventory, then drill in — schema first, tables second.",
        explain:
          "`--dbs` lists databases; `--tables -D <db>` lists tables inside one. That's the standard drill-down before any dump.",
      },
      {
        q: "The database contains a customers table with emails. What do you do with it?",
        options: [
          "Note the tables exist and their sensitivity; do NOT mass-dump records",
          "Dump all 2M rows to /tmp 'for evidence'",
          "Export to a public paste",
          "Drop the table to prove access",
        ],
        answer: 0,
        clue: "Prove reachability with minimal damage — count rows, name tables.",
        explain:
          "An engagement proves impact with schema visibility and a small proof set, not by exfiltrating the whole production table.",
      },
      {
        q: "After the finding, what's the correct remediation pair?",
        options: [
          "Parameterized queries everywhere + WAF as defense-in-depth",
          "More indexes on the customers table",
          "Rotate the API key weekly",
          "Disable the /login route entirely",
        ],
        answer: 0,
        clue: "Fix the root cause in code, and harden the outer layer.",
        explain:
          "Parameterization kills the injection at the source; a WAF is belt-and-braces. Logging and query hardening are the real fix.",
      },
    ],
  },
  {
    slug: "wifi-crack",
    difficulty: "Hard",
    title: "The Sniffing Neighbour",
    tagline: "WPA2 is only as strong as its passphrase.",
    story: [
      "The office wireless 'GOKALI-OFFICE' uses WPA2-PSK with a passphrase the marketing team chose. An employee reports their laptop jumped networks after hours.",
      "You are asked to demonstrate — in a safe lab copy of the same config — how easy the passphrase is to recover from a single handshake.",
    ],
    steps: [
      {
        q: "To crack WPA2 offline you first need to capture what?",
        options: [
          "The four-way handshake between client and AP",
          "The boot sector of the AP firmware",
          "A raw DNS query",
          "The client's /etc/passwd",
        ],
        answer: 0,
        clue: "You need the EAPOL exchange — the keys are derived from it.",
        explain:
          "The 4-way handshake reveals enough to verify PMK candidates offline. airodump-ng `--bssid` targeting the AP records it.",
      },
      {
        q: "The handshake is saved. Which tool(s) test password candidates against it?",
        options: [
          "aircrack-ng cap.pcap -w rockyou.txt",
          "hydra -L users -P passes ssh://10.0.0.12",
          "sqlmap --url http://target.co --batch",
          "gobuster dir -u http://target.co -w dirb-common.txt",
        ],
        answer: 0,
        clue: "Offline dictionary against the .cap — not an online login attempt.",
        explain:
          "aircrack-ng (or hashcat with a converted hash) runs the wordlist against the handshake offline — millions of tries, no network needed.",
      },
      {
        q: "The passphrase 'gokali2024' cracks in seconds. What's the strongest practical mitigation to recommend?",
        options: [
          "Long random passphrase (or WPA3/802.1X if supported)",
          "Disable the wifi when not in use",
          "Hide the SSID",
          "Limit DHCP leases",
        ],
        answer: 0,
        clue: "PSK entropy is the whole ballgame — length beats tricks.",
        explain:
          "WPA2-PSK strength equals passphrase entropy. Hidden SSIDs and address limits are folklore; a long random key (or WPA3/enterprise auth) actually helps.",
      },
      {
        q: "Where did the 'jumped networks' story likely start?",
        options: [
          "An evil-twin AP from the same passphrase (or a rogue hotspot)",
          "GPS spoofing on the laptop",
          "A slow DNS resolver",
          "Monitor mode being off",
        ],
        answer: 0,
        clue: "Same network name + same captured passphrase = instant impostor.",
        explain:
          "Once the passphrase is known, anyone can clone 'GOKALI-OFFICE' and clients auto-connect. That's the classic evil-twin next to the cracked key.",
      },
    ],
  },
];