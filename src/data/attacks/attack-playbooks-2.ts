import type { AttackPlaybook } from "../types";

export const ATTACK_PLAYBOOKS_2: AttackPlaybook[] = [
  {
    slug: "evil-twin-wifi",
    title: "Evil Twin Wi-Fi — fake network",
    icon: "📡",
    category: "network",
    summary:
      "The attacker broadcasts a clone of a trusted Wi-Fi network (cafe, office, home). Devices auto-join by name, and everything the victim sends flows through the attacker first.",
    target: "Anyone who auto-connects to familiar Wi-Fi names.",
    impact:
      "Full interception of the victim's traffic — plaintext logins, session cookies — and, with a captive-portal swap, the victim types credentials directly into the attacker's page.",
    tools: ["wifiphisher", "hostapd-wpe", "bettercap", "wireshark", "responder"],
    introMd: `An evil twin is an access point that copies a *name* and *password* from a network people already trust. Devices rejoin by name alone, so a clone that is louder (or closer) wins the association without any user interaction.

The classic flow in a cafe, airport or office:

1. The attacker's laptop broadcasts the **same SSID with the same security** (WPA2-PSK).
2. Devices that remember the name re-associate to the twin because its signal is stronger.
3. Every packet now rides through the attacker's machine: plaintext passwords, DNS answers, cookies.
4. With a captive-portal swap, the twin pushes "re-login" and collects the login straight from the user.

> **Scope note:** run this only against SSIDs you own or have written permission to test. Cloning someone else's network is a crime in virtually every jurisdiction — this playbook exists so you can recognize and defend against it.`,
    steps: [
      {
        title: "Pick a network and clone it",
        md: `The attacker sniffs nearby networks (\`airodump-ng\`), takes the SSID and encryption of the one people trust, then broadcasts an identical twin on a hotspot interface.

\`\`\`bash
# wifiphisher automates the whole clone:
wifiphisher -aI wlan0 -e CafeGuest        # evil twin of "CafeGuest"
# mode 1: FakeAP -> same SSID + WPA2-PSK on your own radio
# then pick a luring template (login / captive portal / update)
\`\`\`

The manual route uses \`hostapd-wpe\`: a config file declaring the same SSID and security, run on an interface in AP mode. Devices that trust the name will join whichever signal is strongest — an attacker a few meters away usually wins.

The trick that makes this *evil*: almost no phone asks "are you sure you want to rejoin this network?".`,
      },
      {
        title: "Push victims onto the twin",
        md: `To ensure regulars actually move, the attacker first forces them off the real access point:

\`\`\`bash
# disconnect every client from the genuine AP so they roam:
aireplay-ng --deauth 0 -a <real-AP-MAC> wlan0mon
\`\`\`

A deauth flood makes every phone on the channel hunt for a working version of the SSID — and the nearest, strongest answer is the attacker. Nothing notifies the user; switching networks is unremarkable.

From then on the victim's path is **phone → attacker → internet**. The attacker runs DHCP + DNS on the twin (\`bettercap\` or \`dnsmasq\`), and anything unencrypted is harvested.

Your lab practice runs against an SSID you own; nothing here is ever used on a network that isn't yours.`,
      },
      {
        title: "Swap in a fake portal or relay",
        md: `The upgrade turns a sniffer into a *phish factory*:

- **Captive-portal swap** — the twin reports "no internet" and re-opens the venue's login page. That page POSTs to the attacker; \`wifiphisher\` ships these templates and \`set\` clones work too.
- **HTTP-only targets** — pages still shipping logins or tokens in plaintext get harvested live (\`bettercap\`'s \`net.sniff\`).
- **TLS relay** — only when the client accepts a rogue cert (rare on modern phones, common on old IoT and sideloaded apps).

The attacker's endgame is the portal, because the victim *types* the password into a page the attacker fully owns.`,
      },
    ],
    detectionMd: `- **Two access points with the same name** in the Wi-Fi list — the classic giveaway. Twins often show shifting MACs on the same SSID.
- **Unexpected reconnects**: the phone drops to "no internet" at the same spot repeatedly = deauth churn.
- **Certificate warnings** on sites that never warned before.
- **A captive portal that re-asks** right after the cafe already logged you in — real venues don't re-request on entry.
- **WIDS/RogueAP monitors** flag an unknown device teaching address-resolution broadcasts.

The practical check anyone can run: list nearby networks and look for two identical SSIDs.

(Organization detection fixes at 802.1X/EAP → the twin can't fake the per-device certificate.)`,
    defenseMd: `1. **Do not auto-join public Wi-Fi**; roughly-orbit the "forget this network" habit when leaving a venue.
2. Use a **VPN** on public Wi-Fi — the tunnel is encrypted end-to-end, so even a twin sees noise.
3. **HTTPS everywhere** as a browser baseline.
4. Verify a captive portal is the venue's own — the URL hostname should be branded, not random.
5. **802.1X/EAP-TLS for office Wi-Fi** — per-device certificates mean cloning the SSID earns the attacker nothing.

You don't choose the Wi-Fi name — the name chooses the victim. Encrypt above the layer.

(The fix: VPN + HTTPS + cert-authenticated networks.)`,
  },
  {
    slug: "wifi-handshake-crack",
    title: "Cracking a WPA2 network handshake",
    icon: "🔓",
    category: "network",
    summary:
      "While a real device connects, its password exchange is captured; a dictionary attack then reveals the passphrase if it was weak — unlocking the Wi-Fi and everything that joined it.",
    target: "Home or small-office Wi-Fi guarded by WPA2 and a shared (often short) passphrase.",
    impact:
      "The network key, plus access to the LAN behind it: printers, NAS, cameras, and any devices that trust the segment.",
    tools: ["aircrack-ng", "hashcat", "crunch", "wordlists", "nmap"],
    introMd: `WPA2's password is never sent — the *handshake* is. When a client joins, a 4-way exchange proves both sides know the passphrase, and every message is visible to a nearby sniffer. The attacker records one handshake, then tries passphrases offline until one matches.

That offline step is the whole story: **the faster the guesses and the weaker the word, the shorter the find**. A 12-character random phrase is effectively uncrackable today; a neighbor's "johnson123" takes seconds.

> Lab only: crack routers you own or have written consent to test.

\`\`\`bash
sudo airmon-ng start wlan0                  # enable monitor mode
sudo airodump-ng wlan0mon                   # list APs + clients
sudo airodump-ng -c 6 --bssid <AP-MAC> -w cap wlan0mon
\`\`\``,
    steps: [
      {
        title: "Capture the handshake",
        md: `When no client joins on its own, force one:

\`\`\`bash
sudo aireplay-ng --deauth 3 -a <AP-MAC> wlan0mon
# the reconnecting client hands in its handshake -> cap.pcapng
sudo aircrack-ng cap.pcapng        # verify: "1 handshake" confirms the capture
\`\`\`

The deauth is the polite shove that makes the capture happen *now* instead of waiting for a natural join.

The capture itself is passive. The victim notices nothing.

(WPA3 moves past this — the target is overwhelmingly legacy WPA2.)`,
      },
      {
        title: "Crack offline — CPU, then GPU",
        md: `With the handshake file in hand:

\`\`\`bash
aircrack-ng -w /usr/share/wordlists/rockyou.txt cap.pcapng
# GPU route — much faster:
cap2hccapx cap.pcapng cap.hccapx
hashcat -m 22000 cap.hccapx /usr/share/wordlists/rockyou.txt
\`\`\`

If the wordlist misses, the attacker:

- Reruns with **rules** that append digits, years and symbols to every word.
- **Targets the owner's vocabulary** — pet names, street addresses, the shop sign — assembled into a custom ruleset.
- Lets \`crunch\` brute a constrained charset for short numeric-style phrases.

This phase decides everything: a weak password is a locked door with a paper key.

(Run on your lab router first; reset your own PSK when the demo's done.)`,
      },
      {
        title: "Attack the network behind it",
        md: `With the key, the real prize is the LAN:

- **Scan the segment** (\`nmap -sV\`) for exposed services: NAS, cameras, printers, "smart" hubs.
- **Harvest defaults** — so many IoT devices ship telnet/SNMP/HTTP portals with factory credentials.
- **Watch the traffic** (\`wireshark\`, \`bettercap\`) for anything unencrypted.

\`\`\`bash
nmap -sV -Pn 192.168.1.0/24         # version scan: fingerprints + default creds
\`\`\`

Home automation is usually the soft underbelly once the Wi-Fi key is known.

(Your own bench: your lab's VLAN is far enough; don't lint a neighbor's devices.)`,
      },
    ],
    detectionMd: `- **Deauth sparks**: one client's Wi-Fi drops for a few seconds right before a capture — the most visible tell.
- **Radio monitors (WIDS)** flag unknown sources teaching high-rate deauth frames.
- Cracking itself is **offline** — no packet an IDS can see; detection is really *prevention time*.

Home users rarely catch this live; that's why the fix has to be the password.

(The router's own log will at least show the victim devices re-joining.)`,
    defenseMd: `1. **Long, random passphrase** (16+ chars, diceware-style) — offline cracking is cheap past ~12 random characters.
2. **WPA3** where available: SAE means the handshake can't be replayed as an offline target.
3. **Rotate the PSK** when people leave; give guests a non-credentialed guest SSID.
4. **VLAN the IoT** so a cracked key lands on a segment with nothing worth taking.
5. **Enterprise WPA (802.1X)** for offices: per-person credentials instead of one shared word.

A fresh random PSK + WPA3 + isolated IoT is the whole home answer.

(Cracking is offline, cheap and silent — the defense has to happen before the handshake.)`,
  },
  {
    slug: "arp-mitm-sniff",
    title: "ARP spoofing — MITM traffic capture",
    icon: "🕸️",
    category: "network",
    summary:
      "On a shared Wi-Fi or LAN, the attacker silently rewrites who the gateway is, rerouting a victim's traffic through their laptop to read and modify it in transit.",
    target: "Anyone on the same Wi-Fi/LAN as the attacker (cafe, office, shared apartment Wi-Fi).",
    impact:
      "Plaintext credentials, session cookies, DNS answers, and the ability to inject or replace page content live.",
    tools: ["bettercap", "ettercap", "wireshark", "responder", "nmap"],
    introMd: `Devices find each other with ARP (IP→MAC). An attacker can announce "I am the gateway", and many devices silently accept the lie — traffic now flows through the attacker, who forwards it onward.

That's the whole mechanism: **reroute the traffic, read it, pass it through**. Nothing breaks; the internet keeps working — it just gained a reader in the middle.

> Authorised-lab scope only.

\`\`\`bash
sudo bettercap -iface wlan0
net.probe on                    # discover hosts on the segment
net.show
arp.spoof on                    # become the middle-man for the segment
net.sniff on                    # harvest from the rerouted streams
\`\`\``,
    steps: [
      {
        title: "Enumerate the network",
        md: `First, know who is here:

\`\`\`bash
sudo nmap -sn 192.168.1.0/24
sudo bettercap -iface eth0
net.probe on
net.show
\`\`\`

The attacker picks the victim (any MAC on the LAN) and the gateway.

ARP MITM is invisible by design — before a byte of traffic changes, the attacker has simply grown a "routing" role.

(Point all of this at your own lab VLAN.)`,
      },
      {
        title: "Hijack the conversation",
        md: `With victim and gateway known:

\`\`\`bash
arp.spoof on        # both victim and gateway think the attacker is the other party
net.sniff on        # everything the victim sends now passes through this box
\`\`\`

**Ettercap** does the classic version too (ARP poisoning with sniff-remote on).

What the attacker sees in real time:

- **HTTP**: form logins, tokens, session cookies — readable when the request is cleartext.
- **DNS**: what the victim asked, plus attacker-shaped answers (the DNS-spoof playbook).
- **Non-TLS apps**: mail and APIs still shipped unencrypted.

TLS stays unreadable — exactly why the ecosystem pushed everything to HTTPS.

(Your VPN on shared Wi-Fi is this attack's natural counterpoint.)`,
      },
      {
        title: "Harvest and pivot",
        md: `With the stream, the attacker triages the loot:

- Searches for **credential-shaped fields** (username/password pairs, auth tokens).
- **Cookie replay**: grab a session cookie, load it in the attacker's browser → instant account takeover.
- **\`responder\`** on the interface picks up NTLM hashes from the Windows side.

\`\`\`bash
responder -I eth0 -dwP     # harvest NTLMv2 hashes from LAN broadcasts
\`\`\`

Captured creds then get stuffed across other sites.

The packet capture (\`wireshark\` on the routed interface) is saved for review.

(This is standard lab work on a private VLAN with written scope.)`,
      },
    ],
    detectionMd: `- **ARP table drift**: \`arp -a\` shows the gateway MAC is not the router's real address — the smoking gun.
- **Duplicate-IP / MAC-change warnings** from the OS on connection.
- **Latency spikes** and retransmits: a man-in-the-middle adds hops and delays.
- **IDS alerts**: "ARP spoofing — IP claims multiple MACs".

\`\`\`bash
arp -a          # compare gateway MAC against the router's label
\`\`\`

(Static ARP is a rare practical fix; a VPN is the realistic one.)`,
    defenseMd: `1. **VPN on shared networks** — the tunnel endpoint is never on the LAN itself.
2. **HTTPS everywhere**: an encrypted session can't be read or replayed no matter how well the attacker sits in the path.
3. **Static ARP** on the router/gateway itself (closes the gateway-spoof arm).
4. **Managed switch**: DHCP snooping + Dynamic ARP Inspection (DAI) drops spoofed ARP at the port.
5. **802.1X on the LAN** — per-device authentication.

The practical answer stays simple: VPN for anything sensitive, HTTPS as the default.

(ARP spoofing is a *shared-medium* problem; encryption above it is the cure.)`,
  },
  {
    slug: "dns-spoof-creds",
    title: "DNS spoofing — your login page is a mirror",
    icon: "🌐",
    category: "network",
    summary:
      "On a poisoned DNS path, the victim types a trusted name (bank.com) and lands on the attacker's mirror — the padlock they were promised belongs to a cloned cert.",
    target: "Anyone on the attacker's LAN/Wi-Fi whose traffic isn't encrypted above the network.",
    impact:
      "Login credentials, session cookies, and one-click malware delivery, all while the victim is convinced they are on the real site.",
    tools: ["bettercap", "ettercap", "set", "evilginx", "wireshark"],
    introMd: `DNS resolves names to addresses. In a spoofed-DNS man-in-the-middle, the attacker already sits in the path (ARP MITM, evil twin, or a tampered router) and answers name→address queries with *their own* address.

The victim then connects to the impostor; the page looks identical (it's the clone from the phishing playbook), and with a cloned TLS cert plus a one-time browser warning, even the padlock story holds.

The chain: poison the address → deliver a mirror → steal.

> Authorised-lab only.

\`\`\`bash
sudo bettercap -iface eth0
net.probe on
set arp.spoof targets <victim-ip>
arp.spoof on
set dns.spoof.domains bank.com
set dns.spoof.address <attacker-ip>
dns.spoof on
\`\`\``,
    steps: [
      {
        title: "Establish the man-in-the-middle",
        md: `DNS spoofing never exists alone — it rides on a path the attacker already controls:

- **ARP MITM** on the shared LAN (previous playbook).
- **Evil-twin Wi-Fi** the victim auto-joined.
- A **tampered-home-router** whose DNS setting was flipped.

Once the victim's DNS talk flows through the attacker's box, the attacker answers instead of the real resolver.

\`\`\`bash
sudo bettercap -iface eth0
net.probe on
net.show                    # victim + router visible in the table
\`\`\`

The victim's only experience so far: "pages load oddly at times".
`,
      },
      {
        title: "Answer with the mirror",
        md: `With the victim in your path:

\`\`\`bash
set dns.spoof.domains login.bank.com
set dns.spoof.address 192.168.1.66     # your clone / SET site
dns.spoof on
\`\`\`

Now a request for \`login.bank.com\` resolves to \`192.168.1.66\` — the clone from the phishing playbook (\`set\` or a hand-mirrored page).

The extra layer: serve a TLS cert for the domain so the first warning reads "untrusted" and a single "continue anyway" lands the victim inside.

Modern HTTPS/HSTS makes the downgrade path narrow — that's why attackers also ride the non-HTTPS pages.

(This lab uses your router and your own test domains.)`,
      },
      {
        title: "Steal forward",
        md: `The mirror POSTs credentials to the attacker's listener (SET stores them to its reports dir).

After capture:

- **Replay** the creds against the genuine site (or ride the evilginx cookie when proxying).
- **Stuff** them across other domains.
- **Drop a drive-by** — the poisoned page serves an exploit or malware.

\`\`\`bash
cat /root/.set/reports/*/logs.txt   # SET prints typed creds as they land
\`\`\`

Attacker quirk: the return is usually at the victim's natural login hour.

(VPN'd sessions are immune to this path entirely.)`,
      },
    ],
    detectionMd: `- **DNS mismatch smell**: \`nslookup bank.com\` returns a private LAN address.
- **TLS warnings** on daily-use sites — an "expired/untrusted" prompt on a site you never get one from.
- **HSTS misfires**: if the domain is HSTS-preloaded, a downgrade attempt simply fails validation — that failure *is* the tel.
- **Resolver checks**: DNSSEC-validating resolvers reject the poisoned answers.

\`\`\`bash
nslookup login.bank.com   # compare the resolved IP against the real public IP
\`\`\``,
    defenseMd: `1. **HTTPS/HSTS-first browsing**; never click through a cert warning on a daily site.
2. **VPN for transit** — encrypted end-to-end, DNS injections read as noise.
3. **DNSSEC-validating DNS** where available — validated answers defeat name injection.
4. **Don't log in on shared networks** — use a VPN'd or 4G/5G session.
5. **Own your router**: disable remote-DNS proxying and HTTPS admin.

The rule of thumb for public Wi-Fi stays the same: nothing sensitive without a VPN.

(DNS spoofing wins when trust is inherited from the network — encryption moves trust up the stack.)`,
  },
];