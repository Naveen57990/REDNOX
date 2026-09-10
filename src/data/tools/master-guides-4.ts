import type { MasterGuide } from "../types";

export const MASTER_GUIDES_4: MasterGuide[] = [
  {
    slug: "john",
    tagline: "offline password cracker",
    intro: `**John the Ripper (john)** is the purist's password cracker — the CPU-first, wordlist-and-rules engine that's lighter than hashcat's GPU rig and famously deep on *odd formats*. While hashcat wins on raw GPU speed, John wins at formats: shadow hashes, macOS, ZIP/RAR/WinRAR, KeePass, JWT, SSH keys\... it's the tool that opens the "this file is password-protected" box on a box.

### Why it matters
Every "encrypted" artifact you find is a crackable hash or encrypted blob: \`/etc/shadow\`, a found \`.zip\`, a \`.kdbx\`, an \`id_rsa\` passphrase, Wi-Fi captures. John is the one tool that treats them all with one philosophy — extract the hash, run it through a cracking policy. On modern machines with moderate settings, John trained on a decent wordlist cracks a large fraction of real low-entropy passwords.

### Install

\`\`\`bash
sudo apt install john
john --version
\`\`\`

### Sanity check

\`\`\`bash
printf '098f6bcd4621d373cade4e832627b4f6\n' > test.hash
john test.hash --wordlist=rockyou.txt
john --show test.hash
\`\`\`

**Scope**: authorised material only — your own files, lab CTF artifacts, or dumps you lawfully possess.`,
    sections: [
      {
        title: "Extraction first — get the hash into John's world",
        md: `John doesn't open files; it reads *hash formats*. Extraction tools do the conversion:

\`\`\`bash
# /etc/shadow → john format
unshadow passwd shadow > shadow.john
# ZIP / RAR / KeePass
zip2john protected.zip > zip.hash
rar2john archive.rar > rar.hash
keepass2john vault.kdbx > keepass.hash
# SSH private key passphrase
ssh2john id_rsa > id_rsa.hash
# JWT
john jwt.txt --format=HMAC-SHA256
\`\`\`

The extraction step is where 80% of "it didn't work" happens — get the exact right \`xxx2john\` for the artifact, and validate that the produced hash line *looks like a hash* before you crack.`,
      },
      {
        title: "Crack modes — wordlist is the base case",
        md: `\`\`\`bash
john hashfile --wordlist=rockyou.txt
john shadow.john --wordlist=rockyou.txt --format=crypt            # force a format
john zip.hash --wordlist=rockyou.txt --format=zip
john --wordlist=rockyou.txt hashfile                                # order-free syntax
\`\`\`

- **\`--format\`** tells John the hash family when it can't infer (common with encryption-blob hashes); check \`john --list=formats\`.
- John's default wordlist (\`/usr/share/john/password.lst\`) is a tune-in; for seriousness always pass rockyou or your engagement list.
- **Cracked output appears as you go**, and \`john --show\` prints the full potfile at the end.`,
      },
      {
        title: "Rules, single mode & mangling",
        md: `Rules are how John turns one dictionary word into a thousand candidates:

\`\`\`bash
john hashfile --wordlist=rockyou.txt --rules=Jumbo
john --single hashfile          # "single" mode: mangled from username+gecos
john hashfile --mask='?u?l?l?l?l?d?d'     # mask: shape-driven
\`\`\`

- **\`Jumbo\` rules** (from John's crackedlists / jumbo build) apply common manglings (append numbers, leet, case shifts) — the difference between "rockyou only" and "rockyou × 100 modes".
- **Single mode** morphs the *known identity* (name, email, birthyear) — lethal on corporate dumps where passwords echo the username.
- **Mask mode** is hashcat-style shape guessing; combine with wordlist for real campaigns.

**Practical budget**: start wordlist, then \`--rules=Jumbo\`; escalate to mask only if shape is known. Every mode multiplies runtime.`,
      },
      {
        title: "Incremental & the full toolset",
        md: `\`\`\`bash
john hashfile --incremental                  # statistical character attack
john hashfile --incremental:lower            # charset-scoped
john hashfile --wordlist=dict.txt --rules:All
john --show hashfile                         # review pot
john --pot=engagement.pot hashfile           # isolated potfile per campaign
\`\`\`

- **Incremental** hunts pure-entropy short passwords (statistical, like "what characters are likely next") — good tail when wordlists fail, slower per guess.
- Potfile management (\`--pot=\`) is the professional move: per-engagement pots keep "what did we crack for THIS scope" clean and auditable.
- **\`--show\` only prints results that are *in the pot***; it's your evidence output.`,
      },
      {
        title: "John vs hashcat — picking correctly",
        md: `\`\`\`bash
# John shines: odd formats, small scope, CPU work, no GPU setup
john wp.zip.hash --wordlist=rockyou.txt
# Hashcat shines: massive NTLM/bcrypt dumps, GPU
hashcat -m 1000 ntlm.txt rockyou.txt
\`\`\`

**Decision rule**:
- Huge same-format dumps (NTLM, KRB5, bcrypt) where the quantity of hashes outstrips format variety → **hashcat on GPU**.
- One encrypted file, an unusual hash family, CPU-only rig, JWT/SSH/odd formats → **John**.
- **Complement, don't compete**: John extracts; the same potfile format moves campaigns between tools. Masters keep both radars lit.`,
      },
      {
        title: "Defense & pro habits",
        md: `**Defender layers**:
1. Slow, salted algorithms for stored secrets (argon2/bcrypt/scrypt); never permissive "MD5 of salt:hash".
2. Strong cloud vault policies; per-file encryption keys not reused across artifacts.
3. Role-based access so a single dump doesn't contain everyone's NTLM.
4. Alert on bulk file exfiltration, not on the crack itself — prevention lives upstream of the GPU.

**Pro habits**:
- Extraction failure is usually a format/scope bug — sanity-test on a *known* hash first.
- \`--show\` + a per-engagement pot is your evidence trail; save \`-o\` output too.
- Rule escalation is the lever: wordlist → Jumbo → mask → incremental, in cost order.
- Never crack artifacts you can't justify; copy-input→pot isolation keeps campaigns honest.

**Mastery sign**: a password-protected \`.kdbx\` on a laptop, \`/etc/shadow\` with 3 users, and a JWT — you extract all three into john formats, crack what the budget allows, and report each with potfile evidence and a rotate-list.`,
      },
    ],
  },
  {
    slug: "aircrack-ng",
    tagline: "Wi-Fi security auditing suite",
    intro: `**Aircrack-ng** is the standard Wi-Fi auditing suite: capture (\`airodump-ng\`), attack (\`aireplay-ng\`), and crack (\`aircrack-ng\`) WPA/WPA2 handshakes and WEP. The threat model is different from web app hacking: the *air* is the network, and "credentials" are often a scripted PMKID or 4-way handshake that you then crack offline.

### Why it matters
Wi-Fi is the most reachable network interface most organizations have — anyone in range can probe it. Aircrack-ng is how auditors prove "the WPA password is weak / unpatched / default" and how CTF players get onto wireless lab networks. It's also a first-class lesson in *layer-1-3 realities*: monitor mode, channel hopping, deauth, and handshake forgery.

### Install

\`\`\`bash
sudo apt install aircrack-ng
aircrack-ng --help
\`\`\`

### Environment

Monitor-capable Wi-Fi card (most internal ones work; external adapters for range). \`airmon-ng check kill\` may be needed to free the interface (it kills interfering processes — be careful on a machine you need in a job).

**Authorised scope only — Wi-Fi cracking requires explicit permission to touch the airspace.`,
    sections: [
      {
        title: "Monitor mode & the capture phase",
        md: `\`\`\`bash
sudo airmon-ng start wlan0                    # wlan0 → wlan0mon
sudo airodump-ng wlan0mon                    # scan, watch channels
sudo airodump-ng -c 6 wlan0mon -w capture   # lock channel 6, save capture
sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF wlan0mon -w cap
\`\`\`

- **AIRODUMP-ng column-reading**: \`BSSID\`, \`CH\`, \`PWR\` (signal), \`ENC\` (WPA2 vs WEP vs OPN), \`ESSID\`. Screenshot-worthy targets are: your authorized ESSID, a decent PWR, WPA2.
- **Capture naming**: files are \`capture-01.cap\` etc — the \`-w prefix\` is what's kept if the network uses multiple channels/files.
- You need the **4-way handshake** (target > AP > target exchange), not just beacon frames — that's what aircrack-ng cracks.`,
      },
      {
        title: "Forcing & collecting the handshake",
        md: `\`\`\`bash
# attack: associate then deauth the client so it re-authenticates (renew handshake)
sudo aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF -c 01:23:45:67:89:AB wlan0mon
# after the smoke: confirm handshake
sudo aircrack-ng capture-01.cap | grep -i handshake
\`\`\`

- **Deauth (\`-0\`)** floods a connected client so it drops and reconnects — the reconnect carries a fresh handshake you capture.
- **Want handshakes without deauth?** The PMKID attack (below) makes targeting *really* optional — client deauth isn't needed if the AP leaks PMKID.
- If you don't see the handshake, the AP/client is on 5GHz, your card's channel is wrong, or PWR is negative-weak — all checklist items, all fixable.`,
      },
      {
        title: "Cracking the handshake (WPA/WPA2)",
        md: `\`\`\`bash
aircrack-ng -w rockyou.txt capture-01.cap
aircrack-ng -w best.txt -b AA:BB:CC:DD:EE:FF capture-01.cap    # target one AP
\`\`\`

- Aircrack runs the wordlist against the captured handshake — **WPA handshakes are not guess-able by incremental math**: they PBKDF2 the passphrase, so a password must actually appear in your wordlist to crack.
- **Wordlist strategy matters more here than anywhere** — top-of-rockyou + your engagement's custom list, then rules if a budget allows.
- PMKID attack (when available): no client needed, just the AP:
\`\`\`bash
# use hcxdumptool / hcxtools to grab PMKID → crack offline
\`\`\`
(the \`hcxdumptool\`+hashcat combo replaced many \`aireplay\` flows for pure-alert-free PMKID work)`,
      },
      {
        title: "WEP — the legacy reflex and the lesson",
        md: `WEP is broken by statistics, and aircrack-ng has the classic flow:

\`\`\`bash
sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF wlan0mon -w wepcap
sudo aireplay-ng -1 0 -e ESSID -a AA:BB:CC:DD:EE:FF wlan0mon    # fake auth
sudo aireplay-ng -3 -b AA:BB:CC:DD:EE:FF wlan0mon               # ARP replay
aircrack-ng wepcap-01.cap
\`\`\`

The **ARP replay injection** forces the AP to churn IVs until a weak-IV statistical break appears. Once that legacy lesson is internalised, the modern truth stands: **WEP ≈ always destroyed, WPA2 ≈ wordlist-sized problem, WPA3 ≈ new airspace**.

**Determination of "which mode" precedes "which crack"** — a WPA3 AP with WPA2 downgrade consent is a different attack from a pure WPA3 network with SAE.`,
      },
      {
        title: "Detection, defense & pro habits",
        md: `**Defender layers**:
1. **WPA3/SAE** on new APs, WPA2 only where compatibility forces it — with long, random passphrases (rockyou-trivial lengths are killable in hours on a GPU).
2. **PMKID exposure kills WPA2**: keep firmware patched; audit with hcxdumptool to see if \`SAE-PME\` data leaks.
3. **Rogue-AP / evil-twin awareness**: alert on clones; EAP-TLS (802.1X) shifts the trust from "shared passphrase" to "per-user certs" — the real destination for org Wi-Fi.
4. Deauth churn is a layer-2 fingerprint: WIDS watches \`deauth \` bursts from one MAC.

**Pro habits**: capture then crack in *phases* (don't run crack during a live engagement's capture window if you can split them); wordlist-first, rules-after; keep alpha-audit captures; never crack a network you weren't cleared for; log the ESSID/BSSID/capture filename for the report.

**Mastery sign**: given an authorised WPA2 network, you grab a handshake (or PMKID), identify its dominant wordlist hit or document it's uncracked, and present the evidence with the passphrase — no deauth collateral beyond what you cleared.`,
      },
    ],
  },
];