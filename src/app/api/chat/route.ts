export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are CyberLab AI Assistant ("AI Kali Assistant"), an AI cybersecurity learning assistant specialized in Kali Linux, Linux commands, networking and authorized security concepts.

Rules:
- You teach for EDUCATIONAL and AUTHORIZED security testing ONLY.
- Keep answers practical: show commands, explain output, warn about legality/authorization when relevant.
- Clearly separate "Educational Lab Example" from "Real-World Activity" whenever relevant.
- Use bash code blocks for commands.
- If asked to attack systems without authorization, refuse and explain why it's illegal and unethical.
- Assume a responsible, beginner-friendly tone.

Homepage brand: CyberLab AI.`;

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages?: ChatMessage[];
  model?: string;
  provider?: "ollama" | "openrouter" | "openai" | "custom";
  baseUrl?: string;
  apiKey?: string;
}

// NOTE: an apiKey supplied by the client is used for this request only,
// never stored or logged. Keys live in the visitor's browser.

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid body", 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const provider = body.provider ?? guessProvider(body.model);
  const model = normalizeModel(body.model, provider);
  const apiKey = body.apiKey?.trim() || process.env.OPENROUTER_API_KEY || "";
  const baseUrl = body.baseUrl?.trim() || "";

  switch (provider) {
    case "ollama":
      return ollamaStream(model, messages, baseUrl);
    case "openai":
      if (!apiKey)
        return jsonError(
          "No OpenAI API key found. Open AI Assistant settings and add your key.",
          400,
        );
      return openAiCompatibleStream(
        "https://api.openai.com/v1/chat/completions",
        model,
        messages,
        apiKey,
      );
    case "openrouter":
      if (!apiKey)
        return jsonError(
          "No API key found for OpenRouter. Add a free key at openrouter.ai, then open AI Assistant settings to paste it (or use a local Ollama model instead).",
          400,
        );
      return openAiCompatibleStream(
        "https://openrouter.ai/api/v1/chat/completions",
        model,
        messages,
        apiKey,
        { "X-Title": "CyberLab AI" },
      );
    case "custom": {
      if (!baseUrl)
        return jsonError(
          "A custom endpoint needs a Server URL. Open AI Assistant settings and enter it (e.g. http://localhost:1234/v1).",
          400,
        );
      return openAiCompatibleStream(baseUrl, model, messages, apiKey);
    }
    default:
      return mockSseStream(mockAnswer(messages));
  }
}

function guessProvider(model?: string): ChatRequest["provider"] {
  if (model && model.startsWith("ollama/")) return "ollama";
  return "openrouter";
}

function normalizeModel(model: string | undefined, provider: ChatRequest["provider"]): string {
  const m = (model ?? "").replace(/^ollama\//, "").trim();
  if (m) return m;
  switch (provider) {
    case "ollama":
      return "qwen3:8b";
    case "openai":
      return "gpt-4o-mini";
    case "custom":
      return "local-model";
    default:
      return "google/gemini-2.0-flash-001:free";
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function eMessage(e: unknown): string {
  if (e instanceof Error) {
    const cause = e.cause as { code?: string; message?: string } | undefined;
    return cause?.code || cause?.message || e.message;
  }
  return String(e);
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

/**
 * Any OpenAI-compatible endpoint (OpenAI, OpenRouter, custom /v1 servers,
 * LM Studio, Groq, vLLM...). The provider stream is relayed verbatim.
 */
async function openAiCompatibleStream(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const url = baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      cache: "no-store",
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: 1800,
        temperature: 0.7,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });
  } catch (e) {
    return jsonError(
      `Could not reach the AI provider at ${url}. Check the Server URL / API key and try again. (${eMessage(e)})`,
      502,
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return jsonError(
      `AI provider error (${upstream.status}). ${text.slice(0, 400)}`,
      502,
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: SSE_HEADERS,
  });
}

/**
 * Local Ollama backend — translate Ollama NDJSON chunks into the
 * OpenAI-style SSE the client already parses.
 */
async function ollamaStream(
  modelId: string,
  messages: ChatMessage[],
  baseUrl?: string,
): Promise<Response> {
  const host = baseUrl || "http://localhost:11434";
  let upstream: Response;
  try {
    upstream = await fetch(`${host.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        model: modelId,
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        options: { temperature: 0.7 },
      }),
    });
  } catch (e) {
    const local = /127\.0\.0\.1|localhost/.test(host);
    return jsonError(
      local
        ? `No local Ollama server at ${host}. Ollama only works when the app itself runs on your own machine (with "ollama serve" running and the model pulled). On this hosted site, use OpenRouter / OpenAI / custom instead — add a key or custom base URL via ⚡ Connect your AI. (${eMessage(e)})`
        : `Could not reach Ollama at ${host}. Check the Server URL and try again. (${eMessage(e)})`,
      502,
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return jsonError(
      `Local Ollama error (${upstream.status}). Ensure Ollama is running and the model is pulled (ollama pull ${modelId}). ${text.slice(0, 300)}`,
      502,
    );
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const id = `chatcmpl-ollama-${Date.now()}`;
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let json: { done?: boolean; message?: { content?: string } };
            try {
              json = JSON.parse(trimmed);
            } catch {
              continue;
            }
            if (json.done) continue;
            const content = json.message?.content ?? "";
            if (!content) continue;
            const payload = {
              id,
              object: "chat.completion.chunk",
              choices: [
                { index: 0, delta: { content }, finish_reason: null },
              ],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, { status: 200, headers: SSE_HEADERS });
}

// ---- Local educational mock assistant (no provider configured) ----

const LAB_NOTE =
  "\n\n> Educational Lab Example: run this only against localhost, your own lab VMs (e.g. Metasploitable), or CTF platforms like TryHackMe/HackTheBox. Real-World Activity against other systems requires explicit written authorization.";

const TOPICS: { keys: string[]; answer: string }[] = [
  {
    keys: ["nmap", "scan", "port"],
    answer:
      "nmap is a network scanner for discovery and inventory.\n\nCommon flags:\n- -sS  SYN scan (fast, needs root)\n- -sV  service/version detection\n- -sC  default NSE scripts\n- -p-  all 65535 ports\n- -A   aggressive (OS + version + scripts)\n\nSafe example:\n```bash\nnmap -sV -sC -p 22,80,443 127.0.0.1      # local scan\nexport IP=10.10.10.10                     # your lab/CTF box\nnmap -sV -sC $IP\n```\n\nEducational tip: always start with a small, known scope and record the full command you ran — report evidence is built from those exact commands." +
      LAB_NOTE,
  },
  {
    keys: ["hydra", "brute", "wordlist", "crack password", "login"],
    answer:
      "Online password testing (hydra) is about *authorized* login auditing, never random targets.\n\n```bash\nhydra -l admin -P wordlist.txt ssh://10.10.10.10\nhydra -L users.txt -P pass.txt 127.0.0.1 http-post-form \"/login:user=^USER^&pass=^PASS^:Invalid\"\n```\n\nKeep it structured:\n1. Enumerate valid usernames first (this is the bottleneck).\n2. Use a targeted wordlist (our Word Gen tool helps).\n3. Mind rate limits — hammering a live system can be detected and criminal.\n\nOffline is safer and faster: crack hashes with hashcat/John instead of guessing online wherever you can." +
      LAB_NOTE,
  },
  {
    keys: ["kali", "linux", "install", "os"],
    answer:
      "Kali Linux is a Debian-based distro packed with security tools. Learn the basics like any Linux:\n\n```bash\nsudo apt update && sudo apt upgrade -y   # keep tools current\nwhoami; id                                # who are you\nls -la; cd /etc; cat os-release           # navigate & read\n```\n\nPractice command flow:\n- Finding files:  find / -name '*.conf' 2>/dev/null\n- Reading output: grep, awk, sed, cut\n- Processes:      ps aux | grep apache\n\nUse the Terminal Sandbox to rehearse commands safely before touching a real machine or live environment." +
      LAB_NOTE,
  },
  {
    keys: ["msfvenom", "metasploit", "payload", "reverse shell", "exploi"],
    answer:
      "Metasploit and msfvenom are exploitation frameworks — always lab-only territory.\n\nSafe lab pattern:\n```bash\nmsfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=127.0.0.1 LPORT=4444 -f elf -o shell.elf\nmsfconsole\nmsf6 > use exploit/multi/handler\nmsf6 > set payload linux/x64/meterpreter/reverse_tcp\nmsf6 > set LHOST 127.0.0.1\nmsf6 > run\n```\n\nEducational flow: recon → enumerate → find known CVE → test exploit in your owned VM. Reverse shells are easily detected; defenders monitor list, tcp state and on-disk artifacts — so study detection too." +
      LAB_NOTE,
  },
  {
    keys: ["sqlmap", "sql", "injection"],
    answer:
      "SQL injection is a web app flaw where untrusted input is executed as SQL.\n\nEducational Lab Example (DVWA / your own vulnerable VM):\n```bash\nsqlmap -u 'http://127.0.0.1/dvwa/vulnerabilities/sqli/?id=1&Submit=Submit' --cookie='PHPSESSID=...; security=low' --batch\nsqlmap -u '<url>' --dbs --batch\n```\n\nLearn the *manual* process too:\n1. Submit a quote like 1' and watch for a DB error.\n2. Test boolean conditions: 1 AND 1=1 vs 1 AND 1=2.\n3. Use UNION SELECT to reconstruct columns.\n\nTools fail against good filters — know the concept, then the tool." +
      LAB_NOTE,
  },
  {
    keys: ["privesc", "privilege escalation", "root", "sudo", "suid"],
    answer:
      "Privilege escalation means raising your access level on a host. This is a lab skill.\n\nSystematic checks (run on your own VM):\n```bash\nsudo -l                                   # what can you sudo?\nfind / -perm -4000 2>/dev/null            # SUID binaries\ncat /etc/crontab; ls -la /etc/cron.*       # scheduled jobs\nuname -a                                  # kernel version\nenv | grep -iE 'path|home'                 # env quirks\n```\n\nMethod: enumerate → match a finding to a technique (sudo misconfig, writable cron, kernel exploit, PATH hijack) → test in the lab. Kernel exploits are dangerous — prefer config-level missteps on modern targets." +
      LAB_NOTE,
  },
  {
    keys: ["wordlist", "generator", "hashcat", "john", "hash"],
    answer:
      "Offline hash cracking is the bulk of real password work — it's fast and auditable.\n\n```bash\n# identify hash type first\nhashid 'e99a18c428cb38d5f260853678922e03'\n\n# crack (example hash '$y$...' = yescrypt; use --identify to be sure)\nhashcat -m 0 -a 0 hash.txt rockyou.txt\njohn --wordlist=rockyou.txt hash.txt\n```\n\nBuild better wordlists with the Word Gen tool (base words + leetspeak + years + numbers + separators). Longer, targeted lists beat enormous generic ones. Ethical bound: only crack hashes you own or are hired to audit." +
      LAB_NOTE,
  },
  {
    keys: ["wifi", "wireless", "wpa", "aircrack"],
    answer:
      "Wireless auditing is strictly for your own networks (or written permission).\n\nLab flow to test your own WPA2 network:\n```bash\nsudo airmon-ng check kill\nsudo airmon-ng start wlan0\nsudo airodump-ng wlan0mon\n# capture handshake from YOUR AP/client\nsudo aircrack-ng -w wordlist.txt capture-01.cap\n```\n\nLearn the theory first: 802.11 frames, the four-way handshake, monitor mode, and client deauth. Modern WPA3/PMF changes the game — study that before assuming a technique still works." +
      LAB_NOTE,
  },
  {
    keys: ["ctf", "tryhackme", "hackthebox", "beginner", "start", "roadmap"],
    answer:
      "Great way to learn & practice legally!\n\nSuggested order:\n1. Linux basics (use our Kali Learn section)\n2. Networking: TCP/IP, ports, DNS\n3. Web technologies & OWASP Top 10\n4. Tooling: nmap, gobuster, nikto, burp\n5. Labs: TryHackMe (guided), HackTheBox (harder)\n6. Weakness → exploit → report the cycle\n\nA solid first target on THM/HTB is a Windows machine with open port 445 (SMB) — practice enumeration before exploit. Follow the Road Map tab to track where you are." +
      LAB_NOTE,
  },
  {
    keys: ["defensive", "blue team", "detect", "log"],
    answer:
      "Defensive security is where most jobs are, and it's the best lens for understanding attacks.\n\nLearn to:\n```bash\n# suspicious login events\njournalctl -u ssh --no-pager | grep -E 'Failed|Accepted'\n# audit recent logins\nlast -i; lastb -i\n# listening services = attack surface\nss -tulpn\n```\n\nCore topics: log analysis (syslog, auth.log, web logs), indicators of compromise, firewall/IDS rules, patch management, and incident response playbooks. A defender who can run attacks in a lab truly understands them." +
      LAB_NOTE,
  },
  {
    keys: ["gobuster", "directory", "dirb", "ffuf", "fuzz", "web enum"],
    answer:
      "Web directory/parameter enumeration discovers hidden endpoints.\n\nEducational Lab Example (your lab/CTF target):\n```bash\ngobuster dir -u http://10.10.10.10 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt\nffuf -u http://10.10.10.10/FUZZ -w /usr/share/wordlists/dirb/common.txt\n```\n\nRead robots.txt and sitemap.xml first, then automate. Use the results to map the app (a 'dashboard' endpoint often means role-based auth to study)." +
      LAB_NOTE,
  },
  {
    keys: ["whoami", "ls", "cd", "chmod", "grep", "command", "terminal"],
    answer:
      "Mastering the shell is step one. Core command family:\n\n```bash\npwd; ls -la; cd /var/log\ncat access.log | grep -iE 'error|admin'\ngrep -rl 'password' /etc 2>/dev/null\nchmod 600 key.pem        # private key, owner-only\nps aux | grep nginx; kill -9 PID\n```\n\nPattern to practice: navigate → read → filter → act. Rehearse in the Terminal Sandbox — it mirrors a real filesystem so you build speed safely." +
      LAB_NOTE,
  },
  {
    keys: ["hello", "hi", "help", "who are you", "what can you"],
    answer:
      "I'm the CyberLab AI learning assistant. I can help you with:\n\n- Kali Linux and Linux command basics\n- Networking fundamentals (TCP/IP, DNS, ports)\n- How cybersecurity tools work and their safe usage\n- Web security, password security, wireless, forensics concepts\n- CTF & learning-roadmap guidance\n- Defensive security, logging and detection\n\nAsk me about any tool in the Explorer, or a specific command — and I'll keep it educational with safe, lab-first examples.",
  },
];

function mockAnswer(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.content.trim());
  const q = (last?.content ?? "").toLowerCase();
  const hit = TOPICS.find((t) => t.keys.some((k) => q.includes(k)));
  if (hit) return hit.answer;
  return (
    `Good question. I'm currently running in local educational mode (no AI provider connected), but I can still guide you.\n\nSince your question is about cybersecurity learning, here's a structured approach:\n\n1. **Clarify the goal** — are you exploring a concept (e.g. how TCP works), practicing a tool, or following a roadmap phase?\n2. **Scope it** — keep all practice inside localhost, your lab VMs, or CTF platforms with permission.\n3. **Practice the pattern** — enumerate → understand → act → document.\n\nTry asking me specifically about tools like nmap, hydra, sqlmap, gobuster, or topics like privilege escalation, WiFi auditing, or the Kali command line — the responses are tailored to each.\n\nTip: open the ⚙️ Connect your AI settings and add a free OpenRouter key, or point the app at a local Ollama/LM Studio instance, to unlock full AI responses.`
  );
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks.length > 0 ? chunks : [text];
}

function mockSseStream(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = chunkText(text, 9);
  const id = `chatcmpl-mock-${Date.now()}`;

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        const payload = {
          id,
          object: "chat.completion.chunk",
          choices: [
            { index: 0, delta: { content: chunk }, finish_reason: null },
          ],
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
        await new Promise((r) => setTimeout(r, 30));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...SSE_HEADERS, "X-Mock": "1" },
  });
}