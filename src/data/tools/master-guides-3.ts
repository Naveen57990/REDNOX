import type { MasterGuide } from "../types";

export const MASTER_GUIDES_3: MasterGuide[] = [
  {
    slug: "nikto",
    tagline: "web vulnerability scanner",
    intro: `**nikto** is a veteran web-server scanner: it versions the server, checks thousands of known-risk patterns (outdated components, dangerous files, default pages), audits headers, and prods TLS quirks. Where gobuster finds *what exists*, nikto asks "is what exists known-bad?".

### Why it matters
Two reasons: (a) nikto *names the components* behind URLs — retro \`httpd\` + mod_ssl + \`/icons/\` implies a list of CVEs to check; (b) it ships plugins (\`headers\`, \`cookies\`, \`ssl\`) that find misconfiguration many scanners skip. Run it wide, read its findings narrow, verify by hand.

### Install

\`\`\`bash
sudo apt install nikto
nikto -Version
\`\`\`

### Sanity check

\`\`\`bash
nikto -h http://localhost/
\`\`\`

Authorised scope. Nikto is chatty and loud-ish — plan for it.`,
    sections: [
      {
        title: "The default run and how to read it",
        md: `\`\`\`bash
nikto -h http://10.10.10.10
\`\`\`
Output you'll see:
- **Target/IP/hostname/port lines** — track which scan run this is.
- **\`Server: nginx/1.18.0\`** — the fingerprint you'll version-match later.
- **\`+ OSVDB-xxxx: ...\` findings** — legacy vulnerability IDs; modern entries often map to CVEs.
- **Plugin lines**: \`/icons/\` exists, \`/includes/... likely dangerous\`, cookie-flag gaps, header leaks, TLS warnings.
- **A summary line** ("0 error(s)" etc).

Read **top-down**: fingerprint → high-signal paths (\`/admin\`, \`/phpmyadmin\`, \`/server-status\`) → TLS/cookie lines → plugin noise. Every line is a *lead to verify*, not a verdict.`,
      },
      {
        title: "Plugins & report formats",
        md: `\`\`\`bash
nikto -h http://t -Plugins "headers|ssl(openssl)"      # chosen set
nikto -h http://t -Plugins "cookies"                   # cookie-flag sweep
nikto -h http://t -o out.csv -Format csv               # spreadsheet-ready
nikto -h http://t -o out.html -Format htm              # client-deck ready
nikto -list-plugins                                     # the catalogue
nikto -h http://t -Tuning x                            # exclude categories
\`\`\`
- Always \`-o\` + \`-Format\` — CSV feeds your tracker, HTML feeds the client report.
- \`headers\` catches leaked \`X-Powered-By\`/X-Runtime; \`ssl(openssl)\` reviews version/ciphers/cert-validity; \`cookies\` flags missing Secure/HttpOnly/SameSite.
- **Tuning** (\`-Tuning x\`) excludes DoS tests — mandatory on production targets.`,
      },
      {
        title: "Fingerprint → CVE shortlist",
        md: `The master read of a nikto run is *what your version string implies*:

\`\`\`bash
searchsploit nginx 1.18.0
curl -s "https://nvd.nist.gov/vuln/search/results?query=nginx%201.18" | grep -o "CVE-[0-9-]*" | sort -u | head
\`\`\`

- An outdated \`Server:\` banner means "known CVEs likely apply" — nikto flags the row, but it's your homework to shortlist the 2-3 relevant ones for the *stack* (nginx alone brakes nothing; nginx + PHP-FPM changes everything).
- **Header leaks are treasures**: \`X-Powered-By: PHP/7.4\` + \`X-Generator: Drupal\` bind the whole stack for you.
- TLS findings ("certificate expired", "SSL renegotiation enabled", weak ciphers) are clean reportable findings on their own.`,
      },
      {
        title: "The wide-then-narrow rhythm",
        md: `\`\`\`bash
# Phase A — sweep the surface
nikto -h http://target -p 80 -Tuning x -o sweep-80.csv -Format csv
# Phase B — interrogate the interesting
nikto -h http://target -p 8080 -Plugins headers -o pass-8080.csv -Format csv
# Phase C — deep-dive a specific path
nikto -h http://target/secret -o deep.csv -Format csv
\`\`\`

**Discipline**: nikto's thousands of checks are *breadth*. Every finding is verified manually — a \`curl -I\`, a real \`-sV\`, an actual exploit test — before it enters the report. A scanned lead without manual confirmation is a guess with a timestamp.`,
      },
      {
        title: "Detection, defense & pro habits",
        md: `**Attacker reality**: nikto's request profile is extremely well known — WAFs with basic signature rules flag it instantly. Use it as the *screening pass* (breadth), then switch to quieter manual/curl work for depth.

**Defender layers**:
1. Version discipline (patch or *remove* the banner tell).
2. Remove stale default files (\`/icons/\`, phpinfo, \`/includes/\`) — they're instant "outdated app" flags to a scanner.
3. Tight cookie flags everywhere (\`Secure; HttpOnly; SameSite\`).
4. Your WAF should recognise — and your SIEM should alert on — nikto's UA + request cadence.

**Pro habits**: \`-C all\` for cookie audit everywhere; \`-P\` to skip the "server has no errors" noise when you care about findings; keep running the wide pass before \`-sV\` narrow so you never deep-dive a dead port.

**Mastery sign**: one nikto run yields a fingerprint, a header-leak stack, and two misconfig leads — and you can explain which of them is *reportable tonight* versus *verify tomorrow*.`,
      },
    ],
  },
  {
    slug: "wpscan",
    tagline: "WordPress vulnerability scanner",
    intro: `**WPScan** is the gold standard for auditing WordPress: it enumerates themes/plugins/users, fingerprints the core version, checks for known-vulnerable versions against the WPScan database, and brute-forces logins. WordPress powers ~40% of the web and most of it runs outdated plugins — WPScan exists precisely because that surface is enormous.

### Why it matters
A WordPress site is a stack of moving parts (core + themes + plugins). One vulnerable plugin = file upload, LFI, SQLi, or RCE. WPScan's \`enumerate\` tells you exactly which components exist so you can version-match them against known CVEs — and its user enumeration gives you the login names.

### Install

\`\`\`bash
sudo apt install wpscan
wpscan --version
\`\`\`

### Sanity check

\`\`\`bash
wpscan --url http://localhost/ --disable-tls-checks
\`\`\`

Authorised scope, always.`,
    sections: [
      {
        title: "Detection & basic enumeration",
        md: `The scanner learns a lot from headers, \`/wp-login.php\`, \`/wp-json/\`, and \`readme.html\` fingerprints:

\`\`\`bash
wpscan --url http://target                 # basics: WP detection, version
wpscan --url http://target --api-token <token>   # CVE matching (better)
\`\`\`

Output includes: WordPress version (or "version undetermined"), detected plugins with versions, known-vulnerability notices (requires an API token for the public CVE feed), themes, and a headless "Interesting entries" list.

**\`--api-token\` is the unlock**: without it VDB (vulnerability database) integrations are disabled. Free token from wpscan.com — worth every click for a real audit.`,
      },
      {
        title: "enumerate — the heart of the tool",
        md: `\`\`\`bash
wpscan --url http://target --enumerate          # everything
wpscan --url http://target -e vp                 # vulnerable plugins
wpscan --url http://target -e p                  # all plugins
wpscan --url http://target -e vt                 # vulnerable themes
wpscan --url http://target -e u                  # users (usernames!)
wpscan --url http://target -e ap                 # all plugins incl. inactive
wpscan --url http://target -e u,vp,p             # the professional combo
\`\`\`

Interpretation skill: a *vulnerable plugin* line is the crown (matches against the VDB CVE feed). A *usernames* list feeds the login-brute phase. Inactive plugins are worth checking too — they're often still reachable by direct \`wp-content/plugins/<slug>/\` paths.

**Version-matching**: "plugin X version 4.2" → \`searchsploit plugin-x\` or the VDB entry → decide exploitability for *this* target (plugin combo + auth-state matters).`,
      },
      {
        title: "Login brute force (authorised only)",
        md: `\`\`\`bash
wpscan --url http://target -P wordlist.txt -U admin          # one user, list
wpscan --url http://target -P wordlist.txt --usernames users.txt   # many users
wpscan --url http://target --passwords rockyou.txt -U bob --random-user-agent
wpscan --url http://target --password-attack xmlrpc -P list.txt -U bob   # xmlrpc
\`\`\`

**The attack vector matters**:
- Default is the \`wp-login\` HTTP brute — slow-ish, noisier.
- \`xmlrpc\` (wp.multicall) can *batch* attempts in one request — fast but often disabled or rate-limited by hardening.
- \`--password-attack xmlrpc\` or \`login\`: pick by what the target allows.

**Discipline**: brute-forcing logins is a high-impact action — only on authorised targets, with a sensible attempt budget (usually from the *password policy*, not the whole of rockyou, unless no lockout exists).`,
      },
      {
        title: "Stealth & polite scanning",
        md: `\`\`\`bash
wpscan --url http://target -e vp --random-user-agent --disable-tls-checks
wpscan --url http://target -e p --threads 1 --request-timeout 20 --connect-timeout 20
\`\`\`
- \`--random-user-agent\` breaks signature-based UA filters (WAF default rules catch \`wpscan\` UA instantly).
- \`--throttle\` / \`--threads 1\` on sensitive targets: enumeration can rattle a busy WordPress box.
- \`--disable-tls-checks\` for self-signed/internal targets.
- **Honesty**: WAF plugins (Wordfence, NinjaFirewall) fingerprint WPScan's request cadence regardless of UA. Expect to be flagged on well-defended sites and behave accordingly (authorised, documented, limited rate).`,
      },
      {
        title: "Defense & the defender's checklist",
        md: `**What stops WPScan (document for your report):**
1. Keep core/themes/plugins updated — the VDB feed only has *known* CVEs.
2. Disable \`xmlrpc\` unless needed (blocks the fastest brute).
3. Login rate-limiting + reCAPTCHA on \`wp-login\` (Wordfence does both).
4. Remove default files (\`readme.html\`, \`license.txt\`), strip version headers (\`generator\`, RSS versions)).
5. Username enumeration off via block-queries on \`?author=\` and \`/wp-json/wp/v2/users\`.
6. Least-privilege file perms; \`wp-config.php\` outside web root where possible.

**Attacker reality**: the strongest findings come from *outdated components* (a patchable, undisputed row in your report) and *weak login posture*. Both are WPScan's bread and butter, which is exactly why orgs that run it monthly don't get breached through old plugins.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- Always get an \`--api-token\` — without it, vulnerability matching is disabled and the scan is half as useful.
- \`-e vp\` first (vulnerable plugins), then widen — don't dump the whole component list on prod.
- **Verify** each enumerated plugin version by hand (\`curl /wp-content/plugins/slug/readme.txt\`) — WPScan is usually right and it's cheap to confirm.
- Save output: \`-o report.txt\`; replay runs keep your evidence reproducible.
- Pair with the chain: WPScan users → hydra (login) or the VDB exploit; WPScan plugin-cve → searchsploit for a PoC; file-upload findings → your webshell phase.

**Mastery sign**: one authorised scan produces a plugin-version inventory, a CVE shortlist, the login user list, and a defender-facing fix list — all verifiable from evidence within the hour.`,
      },
    ],
  },
  {
    slug: "hydra",
    tagline: "online password brute-forcer",
    intro: `**hydra** (thc-hydra) is the online brute-forcer: it throws username × password combinations at live services — SSH, RDP, HTTP login, FTP, SMB, pop3/imap, MySQL, Postgres and ~40 more. The word is **online**: every guess is a round-trip to a real service, with a different cost profile, a different noise profile — and very different rules of engagement — than offline hash cracking.

### Why it matters
Weak credentials are the number-one initial access vector in real breaches, and hydra is the tool that tests for them at scale. Used right it's the difference between "user 'admin' with password 'admin123' — five minutes" and a week of guessing. Used wrong it locks accounts and trips alerts; the discipline matters as much as the speed.

### Install

\`\`\`bash
sudo apt install hydra
hydra -h
\`\`\`

### Sanity check

\`\`\`bash
hydra -l admin -P top-10.txt ssh://10.10.10.10
\`\`\`

**Authorised scope only.** Hydra is loud, detectable, and can lock accounts or crash fragile services.`,
    sections: [
      {
        title: "The syntax and the four coordinates",
        md: `\`\`\`bash
hydra -l USER -P passwords.txt TARGET PROTO
hydra -L users.txt -P passwords.txt 10.10.10.10 ssh
hydra -l admin -P rockyou.txt ssh://10.10.10.10 -t 4
hydra -l admin -P rockyou.txt rdp://10.10.10.10
\`\`\`

Four coordinates every command needs:
1. **\`-l\`** (one username) or **\`-L\`** (username list) — *which identity?*
2. **\`-p\`** (one password) or **\`-P\`** (password list) — *what guess set?*
3. **TARGET** — host or \`protocol://host\`.
4. **PROTO** — the endpoint/service being attacked (\`ssh\`, \`rdp\`, \`http-get-form\`, \`smb\`, ...).

The skill is choosing the *right* wordlist and service, not the fastest threads.`,
      },
      {
        title: "The service-specific attack",
        md: `\`\`\`bash
# SSH (the classic)
hydra -L users.txt -P rockyou-sorted.txt ssh://10.10.10.10 -t 4 -f
# RDP — watch for the server greet/lock behaviour
hydra -l Administrator -P top-passwords.txt rdp://10.10.10.10
# FTP
hydra -L users.txt -P pass.txt ftp://10.10.10.10
# SNMP (community strings)
hydra -P community.txt 10.10.10.10 snmp
# SMB
hydra -L users.txt -P pass.txt smb://10.10.10.10
\`\`\`

The **\`-f\` (find-first)** flag stops after the first found credential — the master move for multi-user targets: you want *a* foothold with least noise, not all accounts. Use \`-F\` for the single-user-many-services case.`,
      },
      {
        title: "HTTP GET/POST form brute — the real world",
        md: `\`\`\`bash
hydra -l admin -P passes.txt 10.10.10.10 http-get-form \
  "/login.php:user=^USER^&pass=^PASS^:Invalid credentials"
hydra -l admin -P passes.txt 10.10.10.10 https-post-form \
  "/login:/username=^USER^&password=^PASS^:C=1 : Login failed"
\`\`\`

**Format**: \`URL:POST-BODY:FAIL-STRING\`. The fail-string is everything — hydra marks a guess "success" only when that string does NOT appear in the response. Get the exact login form field names and the exact failed-login message (rip them from a login attempt in Burp/curl) or the whole run is misread.
- \`^USER^\` / \`^PASS^\` placeholders are where hydra injects the guesses.
- Use \`\`\`,^pass^,\`\`\` tricks (empty/comma separators) for \`C=1\`-style redirect edge cases; verify your test against a known-good and known-bad credential first.`,
      },
      {
        title: "Choosing wordlists & ordering",
        md: `No brute force succeeds on the wrong list. Go in this order:
1. **Speculative logic** (fast, common): name + year, \`user123\`, \`company2023\`, leetspeak of the domain — the pentest shortlist.
2. **Top-N of rockyou** (fast): the first 10k–100k lines, for noisy/default targets.
3. **rockyou-sorted.txt** — frequency-sorted rockyou: default creds first, tail is the "exhaustive" end.
4. **Custom rules**: default creds per protocol (\`admin/admin\`, \`root/toor\`, \`user/user\`), plus mutator passes if your brute is budgeted.

**Reality check**: every attempt consumes a service interaction. Lockout policies (5 tries → lock 15 min) and WAF/IDS rate rules decide your budget before you start. A locked account is worse for you than a missed password.`,
      },
      {
        title: "Stealth, noise & lockouts",
        md: `\`\`\`bash
hydra -l admin -P passes.txt ssh://10.10.10.10 -t 4 -W 1     # few threads
hydra -l admin -P passes.txt http-get-form ... -R            # resume a run
hydra -l admin -P passes.txt ... -o found.txt                # SAVE findings
\`\`\`

**The three costs you must price:**
1. **Lockouts** — the failed-login counter. Keep attempts under policy, or expect to lock the very account that held your password.
2. **Slowness** — online brute is *round-trips*; 4 threads SSH ≈ 4 simultaneous auths, not 4000 loop iterations.
3. **Detection** — every failed auth is logged; alerters fire on N failures/minute. \`-t 4 -W 1\` is a jog, \`-t 16\` is a pack of wolves.

**\`-R\` (restore)** continues an interrupted run — evidence and discipline in one flag.`,
      },
      {
        title: "Defense & pro habits",
        md: `**Defender layers (report them as close-notes):**
- Strong, unique creds per asset; no default passwords anywhere (scan them quarterly with hydra yourself — self-audit beats breach).
- SSH key-only auth on internal boxes; disable password logins.
- Fail2ban / per-IP rate limiting on SSH; lockout + caps on web forms.
- Watch \`/var/log/auth.log\` spikes; alert on \`Failed password\` bursts from one IP.

**Pro habits**:
- **\`-f\`/first-cred found, then STOP** — one foothold, minimal noise.
- Verify hydra's success by logging in manually — false positives exist on badly-contracted form attacks.
- Save \`-o\`; document attempt budget *before* the run.
- Prefer password *spraying* (every user, one/two common passwords, slow) — detection-blinded and lockout-safe.

**Mastery sign**: you can run a budgeted, unprompted \`ssh\` spray that finds the default cred without locking a single account — and explain why that's harder than running rockyou at \`-t 16\`.`,
      },
    ],
  },
  {
    slug: "hashcat",
    tagline: "offline GPU hash cracker",
    intro: `**hashcat** is the world's fastest password-cracking engine: it runs entirely offline against *hash files* (like NTLM, SHA-256, bcrypt, Kerberos TGS) rather than live services. Because nothing is round-tripping to a network, the ceiling is your GPU. Cracking is ultimately **a question of hardware, algorithm cost, and word-choice** — and hashcat just executes that math at billions of tries per second.

### Why it matters
A single weak password among a thousand employees is a breach. When you land a credential dump (NTLM hashes, /etc/shadow, web DB hashes), the *quality of the dump* — which hash type, which user — decides your next move, and hashcat is how you turn a hash file into plaintext usernames/passwords. It's also why defenders use *slow, salted* algorithms: the cost of one guess is his, the cost of a million guesses is yours.

### Install

\`\`\`bash
sudo apt install hashcat
hashcat --version
hashcat --show          # sees your GPU via OpenCL/CUDA
\`\`\`

### Sanity check

\`\`\`bash
echo -n 'test' | md5sum | sed 's/  -//'    # get an md5
echo "098f6bcd4621d373cade4e832627b4f6:test" > test.hash
hashcat -m 0 test.hash rockyou.txt --show
\`\`\`

**Hash files and scope**: only ever on data you lawfully possess (authorised dumps, lab CTFs, or your own). Cracking others' credential material has sharp legal edges — know them before you start.`,
    sections: [
      {
        title: "The three coordinates of every hashcat run",
        md: `\`\`\`bash
hashcat -m <hash-type> <hashfile> <wordlist/algorithm>
\`\`\`

1. **\`-m\` hash type** — the identifier for what you're cracking (\`0\`=MD5, \`1000\`=NTLM, \`22000\`=WPA-PBKDF2, \`3200\`=bcrypt, \`13100\`=Kerberos TGS). Wrong \`-m\` = garbage output (or magic garbled); \`hashcat --example-hashes\` shows each type's sample format.
2. **Hash file** — e.g. \`dump.txt\` lines like \`user:hash:extra\` (use \`--username\` if the file has usernames — otherwise hashcat tries to parse the whole line as a hash and fails).
3. **Cracking strategy** — a wordlist run, a rule/wordlist run, a mask run, or a combination.

**Master move**: learn to *identify hashes* fast (length + algorithm signatures), since the dump almost never says — \`hashid\`/hashcat's own examples help.`,
      },
      {
        title: "Your first crack and the report",
        md: `\`\`\`bash
hashcat -m 1000 hashes.ntds rockyou.txt -o cracked.txt          # NTLM
hashcat -m 0 hashes.txt rockyou.txt                             # MD5
hashcat -m 0 file.txt rockyou.txt --potfile-file=pot.txt        # potfile
hashcat -m 1000 hashes.ntds --show                              # potfile view
\`\`\`

- The **potfile** (\`~/.local/share/hashcat/hashcat.potfile\`) remembers every cracked hash — \`--show\` lists them after a run. Re-crack bragging rights: nothing, it's cached.
- **\`-o\`** writes findings to a report file; **\`--potfile-path\`** relocates the potfile when you want per-campaign separation.
- **\`--show\` vs \`--left\`**: show = already-cracked from pot; left = the rest. Run both numbers for your report's "what we recovered" stats.`,
      },
      {
        title: "Wordlists (attacks 1–3)",
        md: `\`\`\`bash
# wordlist (dictionary) attack — the first call
hashcat -m 1000 ntlm.txt rockyou.txt
# wordlist + rules — the exponential multiplier
hashcat -m 1000 ntlm.txt rockyou.txt -r rules/best64.rule
hashcat -m 1000 ntlm.txt rockyou.txt -r rules/rockyou30000.rule
# mask attack — when you know the shape
hashcat -m 1000 ntlm.txt "?d?d?d?d?d?d"          # 6 digits, 0-9
hashcat -m 1000 ntlm.txt "?u?l?l?l?l?d?d?d"      # Capital + letters + digits
\`\`\`

- **Rules** mutate every word (append \`123\`, capitalize, leet-replace\...). \`best64.rule\` is the strongest bang-for-buck set; \`rockyou30000.rule\` is the kitchen sink.
- **Masks** describe shapes: \`?l\`=lower, \`?u\`=upper, \`?d\`=digit, \`?s\`=special, \`?a\`=all ASCII. If the target's password policy forces "8+ chars, 1 number", the mask is your friend.
- **\`--increment\`** grows mask length automatically (\`hashcat -a3 '?l?l?l?l?l?l?l?l?l?l?l?l' --increment\`).`,
      },
      {
        title: "Rules — the multiplier",
        md: `The single biggest mastery lever in hashcat is rules:

\`\`\`bash
hashcat -m 1000 ntlm.txt rockyou.txt -r rules/dive.rule --increment
hashcat -m 1000 ntlm.txt dict.txt -r rules/best64.rule --potfile-path campaign.pot
\`\`\`

Rules are string transforms: each line like \`c\` (capitalize), \`$1\` (append '1'), \`so0\` (swap o→0), \`l\` (lowercase),\`...\`. The engine expands your wordlist by the rule set — a 14M-word rockyou × 64 best64 rules ≈ 900M candidates. That's why rules feel like a free speed-up.

**Pitfall**: rules amplify your waiting-list *and* your noise; 30k-rule sets can take hours on GPU. Start \`best64\`, escalate to \`rockyou30000\` only for the tail.
**Craft your own**: echo a rule into a file (\`echo 'c $! $1' > my.rule\`) to target a known password policy.`,
      },
      {
        title: "GPU, devices & benchmark sanity",
        md: `\`\`\`bash
hashcat -I                          # list devices (OpenCL/CUDA)
hashcat -b                          # benchmark all hash types
hashcat -m 1000 -b                  # benchmark one type
hashcat -m 1000 file.hash dict.txt -w 3      # workload: 1 gentle, 3 max
\`\`\`

- **\`-I\`** shows your GPU and its OpenCL/CUDA name — if your machine only reports CPU, you're leaving 1000× on the table.
- **\`-b\`** tells you the realistic rate for your hardware on MD5, NTLM, bcrypt\... *before* you bet campaign duration on a guess.
- **Workload profile (\`-w\`)** trades your PC's responsiveness for speed — \`-w 3\` for a dedicated rig, \`-w 1\` to keep the machine workable.
- **The honest math**: bcrypt costs ~10^5× per-comparison of MD5. The same GPU that does 10 GHash/s MD5 does ~100 kH/s bcrypt. Know the algorithm's cost = know the campaign's time.`,
      },
      {
        title: "Detection, defense & pro habits",
        md: `**Attacker reality**: hashcat output looks like a math loop to the host — no network, no ampersand noise. Your detection edge comes from *what precedes the hashcat run* (how the dump was exfiltrated), which is your SIEM's real job.

**Defender layers**:
1. Use **slow, salted** algorithms (argon2, scrypt, bcrypt) for stored passwords — the per-guess cost is the defense.
2. Never store NTLM for *logons* unless required; it's effectively plaintext (cracks in minutes on GPU).
3. Long, high-entropy password policies raise the mask length beyond budget; MFA removes the value of *any* leaked password.
4. Audit dumps: run your own \`hashcat --left\` monthly against your shadow stores and flag the weak tail.

**Pro habits**: crack only *with context* (which user matters? which service?) — the "password reuse + admin account" chain beats raw speed; \`--show\` and \`-o\` evidence for every campaign; use potfiles per engagement; never crack something you can't justify owning.

**Mastery sign**: given a dump with 3 user hashes, you identify them by type, map crime→target priority, run a budgeted wordlist+rules pass, and present "which accounts recovered → which require an offline/GPU escalation or must be rotated" — with potfile evidence.`,
      },
    ],
  },
];