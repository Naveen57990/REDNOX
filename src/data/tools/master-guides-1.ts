import type { MasterGuide } from "../types";

export const MASTER_GUIDES_1: MasterGuide[] = [
  {
    slug: "nmap",
    tagline: "the network mapper",
    intro: `Nmap (**Network Mapper**) is the single most important tool in a pentester's box. Give it IPs, ranges, or hostnames and it answers three questions: *what is alive?* — *which ports are open?* — *what runs behind them?* Master Nmap and you master the opening half of every engagement.

### Why it matters

Everything downstream depends on what Nmap finds. A service enumeration mistake means a missed attack surface; a sloppy scan means a target that knows it is being watched. Professionals use Nmap to build the **inventory** they report against — so learning it properly (not just \`nmap -sV\`) is the difference between "ran a scan" and "mapped a target".

### Install

\`\`\`bash
sudo apt install nmap
nmap --version
\`\`\`

### Sanity check (do this on your own machine first)

\`\`\`bash
nmap -sn 127.0.0.1        # "is 127.0.0.1 alive?" -> your loopback
nmap -p- 127.0.0.1        # every TCP port on your own loopback
nmap -O 127.0.0.1         # OS guess against yourself
\`\`\`
Everything below assumes you scan **your own lab or an authorized target**. Verb the request carefully: \`nmap -sV -sC -p- target\` is the workhorse of authorised engagements.`,
    sections: [
      {
        title: "The three ideas everything hangs off",
        md: `**1 — Port states.** When you scan, every port ends up in a state:
- \`open\` — a service answered and accepted the connection.
- \`closed\` — reachable, but nothing listens (a firewall "reject", or just nothing there).
- \`filtered\` — it *looks* unreachable: a firewall dropped or never answered. Common on the internet side of a NAT or firewall.
- \`open|filtered\` / \`closed|filtered\` — Nmap cannot tell which, usually UDP or firewall-dependent.

**2 — Scan types** choose *how* Nmap probes, which matters for both speed and whether the target sees you:
- \`-sS\` **SYN scan** (default as root) — sends a SYN, reads the SYN-ACK, sends RST, never completes the handshake. Fast, well-supported, still the default.
- \`-sT\` **connect scan** — completes the full TCP handshake. Used when you cannot send raw sockets (non-root).
- \`-sU\` **UDP scan** — slow and noisy, but *essential*: many admins forget UDP services (DNS, SNMP, TFTP, NTP).
- \`-sA\` **ACK scan** — maps firewall rules (does the firewall pass through or reject?), not really "is the port open".

**3 — Timing** (\`-T0\` … \`-T5\`). \`-T4\` is fast but chatty; \`-T1\`/T2 are slow and quiet; \`-T0\` is allowed to wait minutes and is almost paranoid. Meetings with blue teams are won and lost on this. On **your own LAN** \`-T4\` is fine; against a sensitive auth'd target start \`-T2\`.`,
      },
      {
        title: "Targeting — CIDR, ranges, and hostnames",
        md: `\`\`\`bash
nmap 192.168.1.1                          # single host
nmap 192.168.1.1-50                        # range
nmap 192.168.1.0/24                        # whole subnet (CIDR)
nmap scanme.example.com                    # resolve and scan a name
nmap -iL targets.txt                       # read from file (engagements!)
nmap -iL targets.txt --exclude 10.0.0.1    # big list, skip out-of-scope hosts
\`\`\`

**Your real engagement workflow** always starts from an *authorisation scope* text file. Keep:

\`\`\`bash
cat > scope.txt <<'EOF'
10.10.10.1-120
10.10.11.0/26
vpn-*.example.com
EOF
nmap -iL scope.txt -sn      # scope POPULATION only — ping sweep
\`\`\`

Use \`-sn\` (ping sweep) first: ICMP echo, then TCP 80/443. It is the *least* intrusive inventory step and the one everyone runs first. (Note \`-Pn\` skips ping entirely — "assume alive", needed when a host blocks ICMP but still serves services.)`,
      },
      {
        title: "Choosing ports to scan",
        md: `\`\`\`bash
nmap -p 22,80,443 target            # exactly these
nmap -p 1-1000 target               # a range
nmap -p- target                     # ALL 65,535 TCP ports
nmap -p- -T4 target                 # full + fast (see "pitfalls" first)
nmap -p U:53,111,T:21-25 target     # UDP 53/111 AND TCP 21-25
nmap --top-ports 100 target         # the 100 most common
\`\`\`

- The **default** is the top 1,000 TCP ports — enough for a first pass, not for a real engagement.
- **\`-p-\` is slow** (65k ports) and sends a lot of packets. It is the right call on lab/CTF boxes; on production, prefer a *fast top-ports pass, then \`-sV\` on only what's open*.

**The pro pattern** — scan cheap first, then interrogate:

\`\`\`bash
nmap -p- --min-rate 2000 -oA full target     # 1) which ports are even alive?
nmap -sV -sC -p <open1,open2,...> target     # 2) version+scripts on THOSE only
\`\`\`

This two-pass habit gives you full coverage *and* sane volume.`,
      },
      {
        title: "Version detection and default scripts",
        md: `\`-sV\` makes Nmap identify the service *and* version by sending targeted probes and matching fingerprints:

\`\`\`bash
nmap -sV 10.10.10.10                              # version on top-1000
nmap -sV -sC 10.10.10.10                          # + default safe scripts
nmap -sV --version-intensity 9 10.10.10.10        # smoother (0-9)
nmap -sV --version-light                          # quick, less accurate
nmap -sV --version-all                            # full set of probes
\`\`\`

**Interpreting \`-sC\` output** — you will see headings like:
\`\`\`text
PORT     STATE SERVICE VERSION
80/tcp   open  http    nginx 1.18.0
| http-title: Welcome to example.com
|_http-server-header: nginx/1.18.0
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5
| ssh-hostkey:
|_  2048 12:34:...  (RSA)
\`\`\`
Read it as: service, version, then **script lines** (things like \`http-title\`, \`http-methods\`, \`smb-os-discovery\`). The banner + version is what you'll match against exploit databases (\`searchsploit\`, Rapid7/NVD) — keep it *exact*.

**Version-gathering discipline**: \`nginx 1.18.0\` matters; "nginx (version unknown)" does not. If \`-sV\` fails on a service, target it with its own client instead (e.g. \`curl -I\` for http, \`ssh -V\` for ssh).`,
      },
      {
        title: "The NSE scripting engine — your real power",
        md: `NSE turns Nmap from a port spoon into a vulnerability surface mapper. \`--script\` takes names, categories, or wildcards:

\`\`\`bash
nmap -sV --script vuln target                    # every known-issue check
nmap -sV --script http-enum target               # enumerate web endpoints
nmap -sV --script http-headers target            # inspect response headers
nmap -sV --script smb-enum-shares target         # map SMB shares
nmap -sV --script ssh2-enum-algos target         # ssh cipher inventory
nmap --script "http-*" target                    # all http scripts
nmap --script 'not (broadcast or dos)' target    # exclude noisy categories
\`\`\`

**Script arguments** are passed with \`--script-args\`:

\`\`\`bash
nmap -p 80 --script http-form-brute --script-args 'http-form-brute.path=/login' target
nmap --script ftp-anon --script-args 'ftp-anon.maxlist=50' target
\`\`\`

**Pro rule:** NSE scripts are half-of-the-work. The list of *what* scripts exist (their names alone) IS a checklist of what to check. Install the whole library and keep it current:

\`\`\`bash
sudo nmap --script-updatedb   # update the script DB (runs the updater)
ls /usr/share/nmap/scripts/   # read the names, then read a .nse if unsure
\`\`\`

Never run \`broadcast-*\`, \`dos\`, or \`exploit\` scripts during a real scan without explicit sign-off — they are the ones blue teams flag.`,
      },
      {
        title: "Saving your evidence — never scan without this",
        md: `\`\`\`bash
nmap -oA myengagement 10.10.10.0/24     # normal + XML + greppable
nmap -oG - 10.10.10.10 | grep "22/open"   # grepable, pipe it
nmap -oX - 10.10.10.10                   # XML to stdout
\`\`\`

- \`-oN\` plain report (for humans), \`-oX\` XML (for tooling: so many parsers), \`-oG\` greppable (for \`grep\`/awk pipelines).
- **The habit:** every engagement = \`-oA engagement\`. Re-runs overwrite; keep date-stamped files: \`nmap -oA scans/2024-05-01\`.
- XML is your friend: \`xsltproc scan.xml -o scan.html\` produces a styled report your client/lab report can reference.

**Parsing greppable output** (for automation):

\`\`\`bash
grep "open" engagement.gnmap | cut -d' ' -f2    # live host list
awk '/open/{print $2}' engagement.gnmap          # same, faster
\`\`\``,
      },
      {
        title: "A complete first engagement workflow (follow this order)",
        md: `\`\`\`bash
# 1) Scope population — who is even alive (quiet)
nmap -sn -iL scope.txt -oA 01-alive

# 2) Full port sweep on the alive set (or just -p- on few targets)
nmap -p- --min-rate 1500 -iL 01-alive.gnmap-alive.txt -oA 02-ports

# 3) Service + script pass on OPEN ports only
ports=$(grep "open" 02-ports.gnmap | cut -d' ' -f3 | tr ',' ' ')
for ip in $(grep "open" 02-ports.gnmap | cut -d' ' -f2); do
  open=$(grep -h "$ip" 02-ports.gnmap | grep -oP '\d+/open' | cut -d'/' -f1 | tr '\n' ',')
  nmap -sV -sC -p "\${open%,}" "$ip" -oA "03-$(echo $ip | tr . _)"
done

# 4) Targeted scripts on interesting services (http, smb, ssh, mysql)
nmap -p 80,443 --script http-enum,http-headers -sV 10.10.10.10
nmap -p 445 --script smb-enum-shares,smb-enum-users 10.10.10.10
\`\`\`

Every step writes evidence BEFORE you move on. This single habit (scan → interrogate → document) is what separates disciplined report-writers from script-kiddies.`,
      },
      {
        title: "Stealth, evasion, and \"net\" behaviour",
        md: `Understand *why* these options exist before you use them on real targets.

- \`-D decoy1,decoy2\` — send checks from decoy sources (they still see the real one in flow data).
- \`--source-port 53\` — some firewalls trust DNS (source port 53). Rarely works, documents mastery.
- \`-sS -T2\` — a slow SYN scan is dramatically quieter log-wise than a connect scan.
- \`--data-length 55\` — pad packets to look less "scanner-ish".

**The honest engineering view**: evasion is *financing* on real engagements. It costs speed, coverage, and often buys nothing — modern EDR/IDS spot scan patterns regardless. Use slow scanning for **authorised but sensitive** targets (medical, financial) where you must minimise log noise; do not treat stealth as a skeleton key.

**Blue-team reality check**: almost everything Nmap does ends up in \`tcpdump\`/Zeek/Suricata somewhere. Any hope of quiet relies on rate + randomness: \`--randomize-hosts\`, \`--min-rate\`/max controls, and decoy fragmentation.`,
      },
      {
        title: "Detection & defense (know the other side)",
        md: `As a defender you look for exactly the tells above:

- SYN floods to many ports from one source — session/flow analytics flag first.
- A single source hitting every host's port 80 in seconds = sweep pattern.
- \`http-server-header\` leaks version — patch or hide banners.
- Firewalls: rate-limit RST/ICPMP; drop \`-p-\` sweeps at the edge; consider a stateful IDS like Suricata with rules for Nmap patterns.

As an *attacker* who respects the game: a properly done \`-sn\` then targeted \`-sV\` two-pass beats a 65k-scan in terms of being noticed. Log hygiene = "scan wide in peace, interrogate the winners slowly".`,
      },
      {
        title: "Pitfalls, pro habits, and how you'll know you're good",
        md: `**Habits that fix most pain:**
1. Always \`-oA\` — never lose evidence.
2. After \`-p-\`, re-scan open ports with \`-sV -sC\`. **Never** run \`-sC\` across 65k ports.
3. \`-p-\` on 100+ hosts will take forever — use \`--min-rate 2000\` or work per-host.
4. Non-root? \`-sS\` falls back to \`-sT\`; use \`sudo\`.
5. UDP (\`-sU\`) takes minutes per host — budget it separately.

**How you know you've "got" Nmap:** you can answiner
- "Which ports would \`--top-ports 20\` return on a fresh Ubuntu?" (22,80,443,445,3306,5432,8080,631,5900,53,111,139,993,995,389,25,587,110,143,465 — roughly)
- "Why is this port \`filtered\` on the internet but \`closed\` inside the LAN?"
- "Explain \`open|filtered\` for UDP without googling."
- You can script a scan pipeline and parse \`-oG\` output blindfolded.

**Close out**: re-read the man page sections on \`-sU\`, NSE categories, and \`--script-args\`. Then build a sweep→interrogate→document pipeline of your own and run it against your home lab once a month.`,
      },
    ],
  },
  {
    slug: "subfinder",
    tagline: "passive subdomain discovery",
    intro: `**Subfinder** finds **subdomains of a domain you own** by reading 30+ *passive* sources (Certificate Transparency logs, DNS datasets, security scanners, certificate APIs) instead of sending you directly at the target. Passive discovery is quiet: you never touch a live host until *you* decide to.

### Why it matters

Attack paths start at forgotten subdomains: \`dev.example.com\`, \`test\`, \`staging\`, \`old-vpn\`. A single out-of-date subdomain is often worth more than the whole visible site. Subfinder automates the boring "google for subdomains" step that used to take analysts hours.

### Install

\`\`\`bash
sudo apt install subfinder        # (or) go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
subfinder -version
\`\`\`

### Sanity check

\`\`\`bash
subfinder -d example.com          # your own domain first!
\`\`\`
Always run against **domains you own or are authorised to test**.`,
    sections: [
      {
        title: "Active vs passive — the core idea",
        md: `- **Passive** (subfinder's job): cram public databases. Providers include Certificate Transparency (crt.sh), VirusTotal, AlienVault OTX, HackerTarget, SecurityTrails, URLScan, Shodan, Censys, and the DNS "community" datasets. Sends *zero* probe packets to the target. The target cannot see you.
- **Active** (e.g. \`subfinder\`'s sibling \`amass\`, or brute-forcing with \`dnsx\`/gobuster): queries the DNS servers directly, guesses names, may trigger alerts.

The professional flow is *passive-wide → active-narrow*. Subfinder is the passive-wide layer.`,
      },
      {
        title: "Core usage — sources, output, per-source",
        md: `\`\`\`bash
subfinder -d example.com                          # quick default run
subfinder -d example.com -all                     # EVERY source, no rate drain
subfinder -dL domains.txt                         # a list of root domains
subfinder -d example.com -s crtsh,hackertarget    # only these sources
subfinder -dL domains.txt -o subs.txt             # save results
subfinder -r 8.8.8.8,1.1.1.1                      # custom resolvers
subfinder -w -d example.com                       # live-only (we verify hosts)
\`\`\`

**Output practice** — subfinder prints hostnames. Pipe into verification:

\`\`\`bash
subfinder -d example.com -silent | dnsx -resp-only       # resolve them all
subfinder -d example.com -silent | httpx -silent          # which serve HTTP(S)?
subfinder -d example.com -silent | dnsx -a -resp          # get the A records
\`\`\`

(\`dnsx\` and \`httpx\` are projectdiscovery's resolvers/probers; \`apt install dnsx httpx\`.)`,
      },
      {
        title: "Getting more out of every provider",
        md: `Subfinder gets more results when you configure API keys — free tiers exist for most:

\`\`\`bash
subfinder -config config.yaml -d example.com   # config-provider keys
\`\`\`
Your \`~/.config/subfinder/provider-config.yaml\` holds keys for shodan, censys, virustotal, securitytrails etc. Environment vars are read too:

\`\`\`bash
export CENSYS_USERNAME=... CENSYS_SECRET=...
export VIRUSTOTAL_API_KEY=...
subfinder -d example.com
\`\`\`

**Pro tip — chaining is the real art:**
\`\`\`bash
subfinder -d example.com -silent | tee subdomains.txt
# then hand the list to your active layer:
dnsx -silent -l subdomains.txt -a -resp > resolved.txt
httpx -silent -l subdomains.txt -title -status-code -tech-detect
\`\`\`
Turn a passive list into a *scoped working environment* in three pipes. That's the master move.`,
      },
      {
        title: "Verification & scope discipline",
        md: `Discovery is worthless if you trust stale records. Always:
1. **Resolve**: did a DNS server answer *today*?
2. **Probe**: is it a live host or a parking page?
3. **Scope-check**: is this subdomain in your auth'd scope? Wildcard DNS (\`*.example.com\` → same IP) will drown you in junk — track the \`-silent\` + resolver count pattern and inspect for wildcards early:

\`\`\`bash
subfinder -d example.com -silent | wc -l          # then
host random-string.example.com                    # wildcard test!
\`\`\`
If a random subdomain resolves, filter the noise:

\`\`\`bash
subfinder -d example.com -silent | grep -v '^ran' # crude; learn your resolver's habits
\`\`\``,
      },
      {
        title: "Detection & defense from the subdomain side",
        md: `As a *defender* wanting to stop passive discovery you cannot fully win — CT logs are public by design. What you CAN do:

- **Track certificate transparency**: alert when \`*.example.com\` certs appear for hosts you don't know.
- **Decommission heart**: old DNS records, especially \`test.\`, \`dev.\`, \`staging.\`, \`old.\*\` — the reason subdomain enumeration works at all.
- **Wildcard hygiene**: prefer explicit records over \`*\` unless you need it.
- **Rate intelligence**: watch for a *sudden* burst of queries across all subdomains = someone pulled crt.sh yesterday and started an active phase today.

As the *attacker*: remember passive output is a starting line, not a finish line — most interesting subdomains still require active enumeration.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- \`-all\` is thorough but hits rate-limits — combine with \`-timeout\`/sleep so you don't burn providers.
- **Cache**: subfinder caches per-domain; if a source updated, add \`-nC\` or clear \`~/.config/subfinder/cache\`.
- **Silent mode** (\`-silent\`) hides banners; use the pretty default while learning.
- Results are your *candidate* list — never treat unresolved hosts as real.
- Keep your provider config in \`~/.config/subfinder/provider-config.yaml\`; back it up, don't commit it.

**Know you've mastered it** when you can: rebuild an entire virtual house from a blank domain in <30 min (subfinder → resolve → probe → inventory) and *explain which sources contributed which results*.`,
      },
    ],
  },
  {
    slug: "theharvester",
    tagline: "OSINT email & host discovery",
    intro: `**theHarvester** is an OSINT (open-source intelligence) gathering tool. Point it at a domain and it scrapes *public* sources — search engines, certificate logs, professional networks, Pastebin — to collect **emails, subdomains, hosts, IPs, and people's names** linked to that domain. This is reconnaissance that happens entirely in the open, before you ever touch the target.

### Why it matters

Email addresses are the keys to social-engineering, credential-stuffing, and targeted phishing tests. Hostnames are the map of the kingdom. theHarvester turns "google \`@example.com\`" into a structured report you can actually deliver.

### Install

\`\`\`bash
sudo apt install theharvester
theharvester --version
\`\`\`

### Sanity check

\`\`\`bash
theharvester -d example.com -b all -l 200
\`\`\`
Run it against your own domain, and remember: OSINT on third parties without authorisation is where scripts and judgment split.`,
    sections: [
      {
        title: "The core loop: sources → entities",
        md: `theHarvester's job is to query \`-b <sources>\` for \`-d <domain>\` and collect:
- **emails** — the gold. One verified \`it-admin@example.com\` seeds the whole password phase.
- **hosts/subdomains** — map the attack surface (often overlaps subfinder's output; theHarvester adds search-engine sources subfinder skips).
- **names** — for person-based attacks (impersonation, phone phishing).
- **IP ranges** — the internet-facing estate.

\`\`\`bash
theharvester -d example.com -b google -l 200          # one engine
theharvester -d example.com -b all -l 1000             # everything (slow)
theharvester -d example.com -b baidu,duckduckgo        # selected sources
theharvester -d example.com -b all -l 500 -f report    # write HTML/XML report
\`\`\``,
      },
      {
        title: "Choosing & combining sources",
        md: `- \`all\` — best coverage, longest wait, may hit CAPTCHAs/rate limits.
- \`google\`, \`bing\`, \`duckduckgo\`, \`yahoo\` — search engines; results change with your IP region.
- \`linkedin\`, \`twitter\` (API) — people discovery; old sources degrade often.
- \`crtsh\` — certificate transparency (great for subdomain overlap).
- \`hunter\`, \`sotery\`, \`bevigil\` — paid/partner sources; some need API keys via \`-s\`/env.

**Pro flow** — combine engines on purpose:
\`\`\`bash
theharvester -d example.com -b crtsh,duckduckgo,google -l 250 -f hosts
# then dedupe what you got:
sort -u emails.txt > emails.clean
\`\`\`

Some sources need API keys in \`src/api-keys.yaml\` (or \`~/.theharvester/api-keys.yaml\`) — free tiers exist for many.`,
      },
      {
        title: "Interpreting output",
        md: `\`\`\`text
[*] Emails found: 27
----------------------
it@example.com
admin.example@example.com

[*] Hosts found: 12
----------------------
example.com
vpn.example.com
webmail.example.com

[*] IPs found: 3
----------------------
203.0.113.10
\`\`\`
Treat each section as a different *phase starter*:
- emails → phishing & password attacks.
- hosts → next subfinder/httpx-style live probing (remember theHarvester output is a *candidate list*).
- IPs → scope verification against your authorisation.

**Airtight habit**: sanitise reults — grep out obvious parking pages (\`cpanel\`, \`www\` duplicates) before hand-rolling into the next tool.`,
      },
      {
        title: "Working cleanly at scale",
        md: `\`\`\`bash
# run for a list of domains
for d in $(cat domains.txt); do
  theharvester -d "$d" -b all -l 300 -f "$d-report"
done
# collect every email found
grep -rh "@" *-report* | sort -u > all-emails.txt
\`\`\`

Keep rate-limit-friendly: many sources will throttle you if you bang them with dozens of domains back to back. Sleep between runs (\`sleep 12\` in the loop) and prefer \`-l 200-300\` for breadth over \`-l 1000\` for a single domain.`,
      },
      {
        title: "Ethics, detection, defense",
        md: `**Ethics:** all this data is *public*. That changes nothing — you still need authorisation before *acting* on it. Harvesting on an unauthorised domain = a legal problem, even when every source is "public".

**Defense**: you can't stop public data collection, but you can reduce the damage:
- Remove organisational-internal domains from public contact lists; use contact aliases (\`info@\`) not \`ceo.bob@\`.
- Watch for *clustered* email-address hunts (many emails on one domain in hours) — often the sign of an active campaign about to start.
- Monitor for your domains in paste/Pastebin — theHarvester catches real leaks your admins might miss.

**Attacker reality**: theHarvester output is *raw material*. Good reconnaissance teams merge its emails with hunter.io results and company directory scraping into one clean contact list — then start the social-engineering phase.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **Rate limits/CAPTCHAs** on Google/DuckDuckGo are normal — use \`-b all\` sparingly, and expect fewer results than \`all\` implies.
- **False emails**: plenty of results are CN-parking or form-spam; verify before using (still valid *inventory*).
- **Old data**: engines cache for months. Tag results with "observed" not "current".
- **API keys**: keep them in the config file, not the CLI, and never commit the file.
- **Combine**: theHarvester is one octant — pair with subfinder (subdomains), \`dnsx -a\` (resolution), and \`metagoofil/exiftool\` document leaks.

**Mastery sign**: you can produce, in an afternoon, a clean contact + host + IP inventory of an authorised scope *and explain for each entry which source found it and how stale it likely is*.`,
      },
    ],
  },
  {
    slug: "dnsrecon",
    tagline: "DNS enumeration workhorse",
    intro: `**dnsrecon** interrogates the DNS infrastructure of a domain: zone attempts, brute-force wordlists, record sniffing, cache snooping. It is the classic "what does this DNS estate look like" tool — the same machine an old-school pentester ran 20 years ago, still relevant because misconfigured DNS remains one of the most common findings.

### Why it matters
DNS is the load-bearing wall of every network. A zone transfer that works = you now hold the *entire* internal host map for free. Brute-forced A records reveal \`vpn\`, \`dev\`, \`test\`, \`mail\`, \`remote\` hosts nobody documented. dnsrecon automates this interrogation and saves you the "random GUESS + dig" hamster wheel.

### Install
\`\`\`bash
sudo apt install dnsrecon
dnsrecon --help | head -40
\`\`\`

### Sanity check
\`\`\`bash
dnsrecon -d example.com          # your own domain first
\`\`\`
Only enumerate domains you own or are explicitly authorised to test.`,
    sections: [
      {
        title: "DNS records — what you're actually looking for",
        md: `- **A** — host → IPv4 (the surface).
- **AAAA** — host → IPv6 (often forgotten! many hosting stacks have A but misconfigured AAAA).
- **CNAME** — alias (nebula: rename hosts hiding behind aliases).
- **MX** — mail servers (often the *first* foothold: mail systems are complex).
- **NS** — nameservers (authority / zone-transfer candidates).
- **SOA** — the zone's "serial" — tells you how it's administered.
- **TXT** — arbitrary text; SPF/DKIM records leak permissions and often internal hostnames.
- **PTR** — reverse records; cross-check against A for "is this host known at all".

Every one of these is a **finding candidate**. dnsrecon enumerates them automatically.`,
      },
      {
        title: "Fast·module basics — every core mode",
        md: `\`\`\`bash
dnsrecon -d example.com                     # auto: DNS records + zone check
dnsrecon -d example.com -t std              # same, explicit
dnsrecon -d example.com -t rvl              # reverse-lookup 3-IP ranges
dnsrecon -d example.com -t brt              # brute-force subdomains (with wordlist)
dnsrecon -d example.com -t brt -D /usr/share/wordlists/dnsrecon/subdomains-top1million.txt
dnsrecon -d example.com -t crt              # certificate transparency (crt.sh)
dnsrecon -d example.com -t snoop -n 8.8.8.8 # DNS cache snooping
dnsrecon -d example.com -n 192.168.1.10     # ask a SPECIFIC nameserver
dnsrecon -d example.com -j results.json     # JSON output for your pipeline
\`\`\``,
      },
      {
        title: "Zone transfers — the free win",
        md: `A **zone transfer** (\`AXFR\`) is meant for secondary nameservers to copy the zone. If the nameserver operator forgot to restrict it, *anyone* can ask — and get the full internal map:

\`\`\`bash
# dnsrecon will attempt AXFR automatically in -t std output ("Zone Transfer" lines)
dnsrecon -d example.com -t axfr -n <nameserver>

# or the classic manual check:
dig example.com AXFR @ns1.example.com
\`\`\`

**Reading it:** if you get a giant record dump, you've won the recon phase — every host, alias, mail and internal IP on one plate. Findings to file immediately (\`-oA\`-style habit: \`-j\` or \`-c csv\`):

\`\`\`bash
dnsrecon -d example.com -t axfr -c transfer.csv
\`\`\`

**Defense note**: this is the finding that gets *fixed* fast — restrict AXFR to your own secondaries, always. If you find it, re-test after lunch: happy defenders, quick insight into their patch cadence.`,
      },
      {
        title: "Brute-force discipline",
        md: `\`\`\`bash
dnsrecon -d example.com -t brt -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
\`\`\`
- Wordlists matter more than brute engine. **SecLists** has the best public lists (\`apt install seclists\`).
- Brute-forcing sends a *focused* query storm — it IS the active phase; keep it scoped.
- Filter noise: check for **wildcard DNS** first (\`host randomxyz.example.com\`) so a wildcard stays one entry not 5,000.
- Rate-limit politely; on authorised-but-sensitive work use a smaller list first (\`subdomains-top1million-2000.txt\`), then widen.

**Pro loop** — resolve and dedupe anything you find:
\`\`\`bash
dnsrecon -d example.com -t brt -D wordlist.txt -j brt.json
# mash it into your live-host pipeline:
cat brt.json | jq -r '.records[].name' | sort -u | dnsx -silent
\`\`\``,
      },
      {
        title: "Cache snooping & the sneaky inspectors",
        md: `\`-t snoop\` against a *resolver* asks "do you have X cached?" — files the resolver's cache reveals which names people recently queried (and hence which names are *interesting* to the organisation):

\`\`\`bash
dnsrecon -d example.com -t snoop -n 8.8.8.8
\`\`\`
Caveats: modern recursive resolvers randomise/serve stale caching poorly; results are "recent activity", not truth. Use it as (niche) corroboration, and remember checking a *third-party* recursive resolver for a foreign domain is bad form ethically unless authorised.

**PTR hunting (\`-t rvl\`)** maps an IP range to names — the reverse of normal enumeration, and often exposes *internal* hostnames (dev.box, dbserver) leaking through public PTR records.`,
      },
      {
        title: "Detection & defense from the DNS side",
        md: `**Attacker TTLs:** DNS queries are *the* visible footprint. Rate-analysis at your resolver + DNS-dedicated analytics (dnstap, Zeek \`dns.log\`) will catch a careful adversary's brute. Keep enumeration proportionate.

**Defender checklist:**
1. AXFR locked to authorised secondaries (NSA: *non*); test yourself monthly.
2. Wildcard off in public zones unless deliberate.
3. PTR hygiene: internal hostnames don't belong in public reverse records.
4. Monitor "high-FQDN-volume" (thousands of distinct queries in minutes) = enumeration happened.
5. Reject queries from unauthorised recursive resolvers where your estate allows.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **Timeout/copy**: use \`-n\` to point at the *authoritative* nameserver, not a cache (fresher data, fewer rate-limit issues).
- **Output habit**: \`-j\`/\`-c csv\` always. Race conditions lose trees; stored JSON replays them.
- **Wildcard check before brute** — otherwise 996% of your "findings" are one misconfigured line.
- **Pair it**: dnsrecon (records/zonetransfer) + subfinder (passive breadth) + \`dnsx\` (resolution) gives you the complete DNS estate in three commands.
- **Recursion cut**: for resolver-level questions (recursive open resolver? status) use \`dig +short example.com @resolver\` sanity before dnsrecon probing.

**Mastery sign**: you can enumerate a domain, prove the zone-transfer finding, explain cache-snooping's limits, and produce a JSON evidence set a report team can parse — without touching a live host until you choose to.`,
      },
    ],
  },
  {
    slug: "enum4linux",
    tagline: "Windows/SMB enumeration",
    intro: `**enum4linux** is the Swiss-army SMB/NetBIOS enumerator: share listing, user enumeration, password-policy scraping, group maps, RID cycles. It wraps \`smbclient\`/rpcclient, smbclient queries and legacy enumeration techniques into a single pass — the classic "what can an unauthenticated Windows box tell us?" tool.

### Why it matters
The most common first foothold on a Windows-domain / SOHO box: weak or unsolicited **SMB** (445) or NetBIOS (139). enum4linux asks polite questions and the box — misconfigured or legacy — answers. One command turns a dead port into a user list and a file share.

### Install
\`\`\`bash
sudo apt install enum4linux
enum4linux --help | head -40
\`\`\`

### Sanity check
\`\`\`bash
enum4linux 192.168.1.50          # your own Windows SMB host first
\`\`\`
Always audit hosts you administer or have explicit authorisation for.`,
    sections: [
      {
        title: "What it actually asks (and what the answers mean)",
        md: `Under the hood it runs a suite of requests:
- \`rpcclient\` — Session setup, then **enumdomusers** (list Windows account names!), **enumdomgroups**, **querydispinfo** (display names/descriptions — gold for password resets).
- \`smbclient -L\` — **list shares** (network shares like \`C$\` admin, \`IPC$\`, user shares).
- \`lookupnames/\`lookupids\` — RID-to-name cycle.
- \`net user\`-style local users via \`enum4linux\`'s own wrappers.
- \`smbmap\`-ish share walking via \`smbclient\` for the "what's on the share" pass.

The output blocks are labelled — read order matters: \`[+] Share listing\`, \`[+] Password policy\`, \`[+] Users\`.
\`\`\`text
[+] Enumerating users using SID S-1-5-21-...
Server: 192.168.1.50
Entry for RID 1000
user:[admin] rid:0x3e8
\`\`\`
A user list + a share list = two ready-made attack vectors.`,
      },
      {
        title: "Core use — the standard passes",
        md: `\`\`\`bash
enum4linux 192.168.1.50                    # every pass
enum4linux -a 192.168.1.50                 # all simple enumerations (-a)
enum4linux -U 192.168.1.50                 # users only
enum4linux -S 192.168.1.50                 # shares only
enum4linux -P 192.168.1.50                 # password policy
enum4linux -G 192.168.1.50                 # group memberships
enum4linux -r 192.168.1.50                 # RID cycling (RIDs -r)
enum4linux -n 192.168.1.50                 # NetBIOS names (-n)
enum4linux -u user -p pass 192.168.1.50    # authenticated pass (SMB creds)
enum4linux -v 192.168.1.50                 # verbose
\`\`\`

The **NULL session** (no credentials) is the interesting one for your report: if \`-a\` works *without* \`-u\`, you have an unauth'd enumeration finding.`,
      },
      {
        title: "Interpreting the user dump",
        md: `The win is usually the **RID cycle** output:
\`\`\`text
[+] Enumerating users using SID S-1-5-21-.... and logonusername ''
Entry for RID 500:	Administrator  (admin)
Entry for RID 501:	Guest  (guest)
Entry for RID 1000:	sales
Entry for RID 1001:	backup_admin
\`\`\`
Actionable mechanics:
- RID 500 = built-in Administrator; RID 501 = Guest. If they're enabled, huge finding.
- RID 1000+ = domain-alias members; read *names* carefully: \`backup_admin\` sounds exactly like what it is.
- Cross-reference names with the **password policy** block (\`min password length\`, \`lockout count\`) → that's your *attack budget*: policy with no lockout = "try entire wordlist over SMB". Policy with 5-attempt lockout = "one guessing attempt, do not burn the account".

Pair with \`smbclient\`/mount to actually **open the shares** you found:
\`\`\`bash
smbclient //192.168.1.50/C$ -U user -N        # -N = null session
smbclient //192.168.1.50/public -U user pass
\`\`\``,
      },
      {
        title: "Authenticated house-cleaning",
        md: `Once you *have* valid creds, authenticated enumeration is the same question list but louder:
\`\`\`bash
enum4linux -u alice -p 'Str0ng!' -a 192.168.1.50
\`\`\`
- Now the SID$ user list is *real* output, not guesswork.
- Look for **vend** permissions on shares (\`C$\`, \`ADMIN$\`) and password-policy line \`[+]\] Policy: Lockout Time\` — a policy with no lockout AND a known admin user = spend the dictionary.
- **Defenders sometimes leave a service account with user rights**: names like \`svc_\`\`print\`, \`backup\` enumerating with \`-P -U\` tells you who you can *attempt*.

**Follow-through** — you have users, you have shares; the natural next tool in this guide's family is \`crackmapexec\` for wide authenticated checks and \`smbmap\` for share permissions.`,
      },
      {
        title: "Detection & defense on SMB",
        md: `**Defender:**
1. **SMB signing** must be enabled everywhere (vulnerability is misconfig) — \`-E\` in Windows \`Set-SmbServerConfiguration -RequireSecuritySignature $true\`.
2. Null sessions disabled: LocalAccountTokenFilterPolicy / restrict anonymous Windows 10+/Server hardening.
3. Guest off; legacy NetBT (139) disabled where possible.
4. Monitor 445 from every LAN member → RID/doc enumeration produces a very predictable *request pattern* a-IDS/\`smbclient\`-log inspection will catch.

**Attacker reality**: modern Windows (Server 2019+) hardens null sessions by default; enum4linux results will read "no valid users" on patched boxes. The finding is then *"no unauth'd SMB, defer to authenticated path"* — a real report line too.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **Root needed** for best results (\`-a\` wraps \`net\` and \`lookup\`). Use \`sudo\`.
- **Timeouts**: huge user lists take minutes; \`-r\` (RID range) lets you bound.
- **Guess host is Windows**: port 139/445, \`-n\` NetBIOS response. If it's Samba, output still valuable.
- **Don't brute logins with enum4linux** — that's \`hydra\`/crackmapexec's job; enum4linux is *enumeration*, and its gussying passes are noisy.

**Mastery sign**: you can turn a raw 445/139 host into "users + shares + policy + group map" in one pass, distinguish *misconfig* from *hardened* findings, and explain to a defender exactly which SMB policy lines to flip.`,
      },
    ],
  },
  {
    slug: "tcpdump",
    tagline: "packet capture & analysis",
    intro: `**tcpdump** is the packet-capture Swiss Army knife: it taps an interface, records raw network traffic, and lets you filter it with the de-facto packet filter language (\`BPF\`). It's the backbone of every "what actually goes across the wire" investigation — debugging, capture-and-crack, forensic snapshotting, reverse traffic analysis.

### Why it matters
Every other tool produces theory; tcpdump produces *the wire*. A 60-second capture can show you cleartext credentials, sessions, unexpected protocols, or the exact moment your pack is being probed. The filter language you learn here is *the same syntax* used by Wireshark/tshark, Zeek, and bpf tools — one skill, ten tools.

### Install
\`\`\`bash
sudo apt install tcpdump
tcpdump --version
\`\`\`

### Sanity check
\`\`\`bash
sudo tcpdump -i any -c 5               # see 5 packets, any interface
sudo tcpdump -i en0 -n -c 5            # your main interface, numeric
\`\`\`
Capture only traffic you are authorised to inspect (your own hosts, your lab, a hub/span you own).`,
    sections: [
      {
        title: "Capture basics — interfaces, counts, files",
        md: `\`\`\`bash
sudo tcpdump -i eth0                        # live capture on eth0
sudo tcpdump -i any                         # ANY interface (useful, noisy)
sudo tcpdump -i eth0 -c 100                 # stop after 100 packets
sudo tcpdump -i eth0 -w cap.pcap            # SAVE to file (think before you don't)
sudo tcpdump -r cap.pcap                    # read a saved file
sudo tcpdump -i eth0 -c 500 -w /tmp/probe.pcap   # bounded capture
sudo tcpdump -i eth0 -W 5 -C 100            # rotate 5 files of 100MB each
\`\`\`

**Habits that save you:**
- ALWAYS \`-w\` to a file when something is live and valuable — analysis happens *after*, reading (\`-r\`) is free.
- \`-n\` = don't resolve names (faster + honest); \`-nn\` also keeps ports numeric.
- \`-c\` bound captures won't fill your disk.
- Use \`-s 0\` (or 262144) to capture full packets; default snap can truncate payload.`,
      },
      {
        title: "The BPF filter language — 90% of your power",
        md: `Primitives combine with \`and\`, \`or\`, \`not\` (or \`&&\`, \`||\`, \`!\`):

\`\`\`bash
sudo tcpdump -i eth0 host 10.0.0.5                 # to/from one host
sudo tcpdump -i eth0 src host 10.0.0.5              # only source
sudo tcpdump -i eth0 dst port 80                    # dest port 80
sudo tcpdump -i eth0 port 53                        # either direction, 53
sudo tcpdump -i eth0 tcp and port 3389              # RDP picks
sudo tcpdump -i eth0 'tcp[13] & 2 != 0'             # SYN-flagged packets
sudo tcpdump -i eth0 'ip[6] & 0x40 = 0'             # non-DF (fragmentation) 
sudo tcpdump -i eth0 '(udp or tcp) and port 53 and src host 10.0.0.5'
sudo tcpdump -i eth0 not port 22                     # everything BUT ssh
\`\`\`

**The byte-level filter** (\`tcp[offset] & mask = value\`) is the master's card — once you can write \`tcp[13] & 2 != 0\` (SYN) or \`icmp[icmptype] = icmp-echo\` fluently, you can distinguish any handshake phase.`,
      },
      {
        title: "Reading output like a packet whisperer",
        md: `\`\`\`bash
sudo tcpdump -i eth0 -nn -e
\`\`\`
Output columns: **time, direction, src→dst, proto, ttl, len** and flags:

\`\`\`text
12:03:44.123456 IP 10.0.0.5.56034 > 10.0.0.1.80: Flags [S], seq 411..., win 64240, ...
12:03:44.123999 IP 10.0.0.1.80 > 10.0.0.5.56034: Flags [S.], ...
12:03:44.124101 IP 10.0.0.5.56034 > 10.0.0.1.80: Flags [.], ack 1, ...
\`\`\`
- Flags: S(SYN), .(ACK), F(FIN), P(PUSH), R(RST). A **TCP handshake** is S → S. → . (the three-way dance).
- S → S. → . repeated fast = many connections = port scan or load spike.

**Payload decode** (the fun part):
\`\`\`bash
sudo tcpdump -i eth0 -A port 80                # ASCII payload (awkward http)
sudo tcpdump -i eth0 -X port 443               # hex + ASCII (TLS hello)
sudo tcpdump -i eth0 -A port 21 -nn            # an FTP login (user/pass swap)
sudo tcpdump -i eth0 -nn -A 'port 67 or port 68'   # DHCP lease traffic
\`\`\`
Add \`-e\` for MAC layer → ARP discipline work:
\`\`\`bash
sudo tcpdump -i eth0 -e -nn 'arp'              # ARP poison spotting (two MACs, one IP)
\`\`\``,
      },
      {
        title: "Common capture workflows",
        md: `**1. Cleartext credential hunting** (lab only / authorised):
\`\`\`bash
sudo tcpdump -i eth0 -nn -A 'port 21 or port 80 or port 25 or port 110 or port 143' -w creds.pcap
\`\`\`

**2. DNS forensics**:
\`\`\`bash
sudo tcpdump -i eth0 -nn -s 0 port 53 -w dns.pcap
# later, "which hostnames got asked":
tcpdump -r dns.pcap -nn -l port 53 | grep -oP 'query \S+' | sort -u
\`\`\`

**3. ARP/poison / protocol anomaly**:
\`\`\`bash
sudo tcpdump -i eth0 -e -nn not tcp port 22   # find weirdness, not ssh
\`\`\`

**4. Port-scan answer pack** (blue team): capture your external interface, filter SYN to your services with no ACK follow — scanners look just like this.`,
      },
      {
        title: "Saving, merging, analysing later",
        md: `\`\`\`bash
sudo tcpdump -i eth0 -w big.pcap -C 100 -W 10   # rotating capture
cp big.pcap* backup/                            # evidence hygiene
# read with the professional stack AFTER capture:
tshark -r big.pcap00 -Y 'http.request' -T fields -e http.host -e http.user_agent
# or merge files:
mergecap -w all.pcap big.pcap*}
\`\`\`
**The workflow** is always the same: capture wide → analyse narrow. Never parse live when you can afford to re-read a file. And a \`-w\` capture is log-forensics gold — you can answer "was it 10.0.0.5 at 12:03:44?" a week later from a .pcap nobody ever watched live.`,
      },
      {
        title: "Detection & defense with tcpdump itself",
        md: `\`\`\`bash
# A defender's quick "am I being scanned" filter:
sudo tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn) != 0 and tcp[tcpflags] & (tcp-ack) == 0' -c 50
# ARP poisoning look: same IP, two MACs in seconds:
sudo tcpdump -i eth0 -e -nn 'arp' | awk '{print $11, $17}' | sort -u
\`\`\`
Capture → correlate with \`ip neigh\` and \`ss -tulpn\` for a full "who's talking to me" picture. If you build the habit of \`-w\` rotating captures on an internet-facing host, you'll own the network's perspective instead of guessing it.

**Attacker note**: a serious op *also* uses tcpdump — to inventory what the target leaks over the wire before touching anything. The tool is neutral; the authorisation decides the shape of the use.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **\`-i any\` vs \`-i eth0\`**: "any" catches all; eth0 is one link. Choose deliberately.
- **Don't mix \`-r\` and \`-i\`**: reading a file with \`-r\` is not capturing.
- **Snapshot truncation** — increase \`-s\` when you need payload.
- **Non-root can't capture raw** — \`sudo\` or a capture group.
- **Buffering**: \`-w\` supports \`-U\` (flush per packet) if you want live-growing files; diagnostics only.
- **Timestamps**: \`-tttt\` for full timestamps in evidence.

**Mastery sign**: you can (a) write a BPF for "SYN without ACK to port 443 from outside", (b) detect an ARP poison in 30 seconds, (c) give a defender a one-liner capture with \`-w\` that becomes their incident evidence.`,
      },
    ],
  },
  {
    slug: "responder",
    tagline: "LLMNR/NBT-NS/mDNS poisoning",
    intro: `**Responder** is one of the sexiest tools in the box: it *listens* to broadcast name-resolution protocols (LLMNR, NBT-NS, mDNS) and, when a machine can't find a name via DNS and falls back to broadcasts, Responder **answers** with its own identity. The victim then hands over its username + an NTLMv2 hash — which you crack or relay. All from a port that "nobody ever uses".

### Why it matters
Windows has lots of "if nobody answers DNS, let me ask the LAN" fallbacks for modern and legacy reasons. The moment a user mistypes a share name, or a client probes an unadvertised host, Responder is often the *only* tool that reliably converts that second-of-human-error into a credential. It is the single best "I'm on the LAN, now what?" first move.

### Install
\`\`\`bash
sudo apt install responder
sudo responder --version
\`\`\`

### Sanity check
\`\`\`bash
sudo responder -I eth0 -A -v     # ANALYZE mode: watch, DON'T respond yet
\`\`\`
Only run inside your own lab or an authorised assessment network.`,
    sections: [
      {
        title: "The attack surface — LLMNR, NBT-NS, mDNS, WPAD",
        md: `- **LLMNR** — the modern "I didn't get DNS, let me broadcast and ask" protocol (link-local).
- **NBT-NS** — the NetBIOS-era version; same idea, older.
- **mDNS** (\`.local\`) — Apple/mDNS responders on laptops will probe it too.
- **WPAD** — Web Proxy Auto-Discovery: some browsers ask "is there a proxy?" — Responder can answer "yes, I am" and harvest. (Invoke with \`-wP\` options.)

**When it fires** — the killer scenario: user clicks a shortcut to \`\\fs1\` (typo: fs instead of fileserver), DNS fails, Windows broadcasts "who is fs1?", Responder says "I am!", and the box — after the failed logon — sends the *current user's NTLM* hash. You just became "the file server".

**Why attackers love it**: no phishing, no user figure-of-it-out, no high-privilege requirement. The traffic is normal-looking "who is X" broadcasts.`,
      },
      {
        title: "Analyze first — never respond blind",
        md: `\`\`\`bash
sudo responder -I eth0 -A -v            # -A = ANALYZE ONLY, log but DON'T answer
sudo responder -I eth0 -wd              # analyze + WPAD explore (still no poison)
\`\`\`
Run analyze mode for some minutes before responding. You learn:
- Which protocols even show up on this LAN (if none — poisoning this network is moot, save yourself the noise).
- The hosts that routinely ask (that's who'll walk into your trap).
- Background chatter your \`-v\` log will let you distinguish later.

**Rule**: first recon, then fire. Same discipline as every tool, but here it actively prevents "poisoning a quiet correct network" embarrassment.`,
      },
      {
        title: "The standard run — and what lands",
        md: `\`\`\`bash
sudo responder -I eth0 -dFwv
\`\`\`
Flags in the \`-dFwv\` habit:
- \`-d\` — respond to NBT-NS; \`-f\` fingerprint the client (OS detect).
- \`-w\` — WPAD rogue proxy (harvest even without SMB).
- \`-r\` — also answer to the *NetBIOS* session; \`-F\`/\`-F\` capture upper/lowercase username.
- \`-v\` verbose.

When a hit lands, the log prints a banner like:
\`\`\`text
[+] Listening for events...                                            
[*] [NBT-NS] Poisoned answer sent to 10.0.0.50 for name FS1 (queries: 1)
[+] [SMBv2] NTLMv2-SSP Client   : 10.0.0.50
[+] [SMBv2] NTLMv2-SSP Username : CORP\\alice
[+] [SMBv2] NTLMv2-SSP Hash     : alice::CORP:aaaaaaaa:...:<HASH>...
\`\`\`
That long hash string is your prize. Save the full line.`,
      },
      {
        title: "From hash to access — crack or relay",
        md: `**Crack it offline** (the classic):

\`\`\`bash
# hashes end up in /usr/share/responder/logs/ by default
sudo cat /usr/share/responder/logs/*NTLMv2*  > ntlmv2.txt
hashcat -m 5600 ntlmv2.txt /usr/share/wordlists/rockyou.txt   # mode 5600 = NTLMv2
# or John:
john --format=netntlmv2 --wordlist=/usr/share/wordlists/rockyou.txt ntlmv2.txt
\`\`\`

**Relay it** (faster than cracking, attacks other machines' *sessions* — use \`ntlmrelayx\` from Impacket, never do this without authorisation):
\`\`\`bash
sudo ntlmrelayx.py -tf targets.txt -smb2support
\`\`\`
Relaying *is* the modern responder playbook (SMB signing off → dump user accounts, dump share lists). But remember the number-one Defender mitigation — **SMB signing mandatory** — kills the relay for SMB. Cracking is unaffected.

**Crack speed sanity**: 8-digit to 12-digit worldlist 'rockyou' is millions of candidates; NTLMv2 crack at ~100M/s with a GPU means "seconds to minutes for bad passwords".`,
      },
      {
        title: "Detection & the defender's counter-play",
        md: `**Defenders' responses to this exact attack:**
1. **Disable LLMNR & NBT-NS** via GPO — it's the kill shot; most orgs can. (Document as the *primary* fix.)
2. **SMB signing required** everywhere — kills relay for SMB and makes poisoning far less rewarding.
3. **WPAD blocked** at the browser/DNS layer.
4. **Watch for it**: packet captures looking for broadcast "who is <name>" queries answered by a *new* host — or Zeek/IDS rules (responder's fingerprints are known).
5. **Least privilege**: local admin everywhere means a captured *user* hash is less valuable.

**Attacker reality-check**: a responder run on a properly defended modern LAN returns zero (LLMNR off, mDNS off, signing on). Any tool guide that promises "instant hashes" is selling you an old world. This one works best on legacy or SOHO Windows — that IS your finding "(network posture relies on LLMNR)".`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **\`-I eth0\` not \`-I eth0 -I eth1\`** unless you want chaos; choose the LAN-facing interface.
- **Backup your hashes** the moment they appear — one Ctrl+C loses logs; \`-o\` sets a custom logdir.
- **Don't run responder + Wireshark/hand analyser on the same UI** for hours; it's a listener, let it run.
- **Watch your own box**: you'll poison *yourself* — \`-F\` flags make evidence cleaner.
- **Combos**: responder walking the wrong way is amateur; expert multistager: responder → capture → disentangle (if you relaid) — never burst hashes into crack if the goal is relay.

**Mastery sign**: you can detect a bad-LLMNR network in analyze mode, run responder cleanly, explain whether "crack it" or "relay it" is better *for this client*, write the defender's one-GPO fix into your report, and demo both sides in your lab without burning a real network.`,
      },
    ],
  },
  {
    slug: "searchsploit",
    tagline: "local Exploit-DB search",
    intro: `**searchsploit** is a local command-line search across the contents of the **Exploit-DB** archive (tens of thousands of public exploits). Search a product, a version, a CVE — and searchsploit lists the matching public exploits with paths, descriptions and metadata. It's the fastest "is there an exploit for this?" question a pentester asks all day.

### Why it matters
Every "version → exploit" decision starts here. \`searchsploit openssh\` beats a browser tab, and more importantly **\`--exclude=\`** + \`-m\` + \`-x\` give you a disciplined workflow for *evaluating* an exploit before running it.

### Install
\`\`\`bash
sudo apt install exploitdb        # pulls searchsploit + the archive
searchsploit --version
\`\`\`

### Sanity check
\`\`\`bash
searchsploit slocate            # or any product you own
searchsploit -u                 # update the db (security news freshness matters)
\`\`\``,
    sections: [
      {
        title: "Searching — the craft is the search",
        md: `\`\`\`bash
searchsploit apache 2.4.49
searchsploit openssh
searchsploit windows rdp
searchsploit "web server" "17.0"
# case-insensitivity is on by default; quote phrases:
searchsploit -e "Microsoft Outlook 2019"
# exclude noisy families:
searchsploit webmin --exclude="dos"
# narrow by platform:
searchsploit -w linux kernel      # -w prints the web URLs too
searchsploit --colour             # colourised, easier to eyeball
searchsploit -c apache           # -c case sensitive (tightens)
\`\`\`

**Read the columns**: \`Title\`, \`Path\`, \`Type\` (local/remote/webapp) and the \`----\` family split. **Type matters more than people think**: a *remote* exploit for port 80 is immediately actionable; a *local* one needs a shell you already have — very different operations.`,
      },
      {
        title: "Copy, mirror, inspect — the evaluation loop",
        md: `\`\`\`bash
# m: mirror the exploit into your working dir
searchsploit -m exploits/webapps/1234.py
# x: open it for inspection (metadata + comments)
searchsploit -x exploits/webapps/1234.py
# p: print the path (for your pipelines)
searchsploit -p 1234.py
# j: JSON out, machine-parseable
searchsploit -j wine | jq '.EXPLOIT[0:5]'
\`\`\`

**The rule you will thank yourself for**: **read every exploit's header before running it**. Check the target version, the EDB-dated description, and that the payload isn't a "DoS". \`-x\` is cheap insurance against firing a rebranded-DoS at a production box. An exploit is *evidence of a vulnerability* — your job is to turn it into a *responsible* finding.`,
      },
      {
        title: "The version-matching procedure",
        md: `How pros answer "is \`nginx 1.18.0\` breakable?":

\`\`\`bash
# 1. name + version
searchsploit nginx 1.18.0
# 2. if empty, widen to family + check CVEs
searchsploit nginx | grep -i "1\.18"
# 3. cross-check exploitdb entries against the CVE of record
searchsploit --cve 2021-23017
# 4. read titles for "successful exploitation" vs "fails on patched"
searchsploit -x "nginx 1.18"
\`\`\`

**Remember**: exploit-db's *versions* column can lag reality; the authoritative match is \`-sV\` output vs the *exploit's* claimed version range. A "1.18.0" exploit often silently requires sub-version specifics — the header always says.`,
      },
      {
        title: "Pairing with Metasploit",
        md: `\`\`\`bash
searchsploit --msf apache        # shows the metasploit module path if one exists
searchsploit --msf-module        # prints loadable module names
searchsploit -j --msf samba
\`\`\`
Not every exploitdb entry has a metasploit twin — and a manual python/ruby exploit run against the right target can be dramatically more reliable than the MSF wrapper. Know both: **MSF for fast re-testing, manual for surgical control.** If your engagement cares about *invisibility*, the manual \`.py\` is often the quieter choice.

**Classic hazard**: metasploit payloads assume target specifics (arch, offsets). \`-x\` the module; check \`Targets\`; run against a docker/local lab copy first.`,
      },
      {
        title: "Keeping it green — updates & organisation",
        md: `\`\`\`bash
searchsploit -u                        # update the local repo (slow but necessary)
nano ~/.config/searchsploit/config    # point paths at your exploitdb clone
\`\`\`

**Modern habit** — many teams clone exploitdb themselves:
\`\`\`bash
git clone --depth 1 https://gitlab.com/exploit-database/exploitdb /opt/exploitdb
echo 'path_array+=(/opt/exploitdb)' >> ~/.config/searchsploit/config
\`\`\`
Now \`-m/-x/-j\` behave against your up-to-date clone. Keep a naming convention (the db cycles; your dated mirrors survive).`,
      },
      {
        title: "Detection, ethics & pro habits",
        md: `- **Ethics**: public exploits ≠ permission to fire them. Version-match *and* scope-match, then decide \`-m\`/\`-x\`/MSF — never just "send it".
- **Defense read**: an attacker *running* searchsploit isn't detectable by signature; but the *outbound* transfer of the mirror file at scale or the specific payload traffic is — your IDS should know the popular exploit filenames.
- **Pitfalls**: don't grep \`-e\` case-insensitively when a product has an ambiguous term ("web" matches everything); always \`--exclude=dos\` on production checks; and **the title is not the whole exploit** — read the header before trusting.

**Mastery sign**: you can, in under five minutes for an arbitrary version string, state whether a public exploit exists, whether it is remote/local, whether MSF offers it, and estimate how patched the target's *specific* build is.`,
      },
    ],
  },
];