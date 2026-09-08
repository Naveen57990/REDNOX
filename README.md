# REDNOX

### CyberLab AI — Everything in one place.

A free, browser-based AI cybersecurity learning platform. Explore **637 Kali Linux tools**, learn Linux & networking fundamentals, practice commands in a real terminal sandbox, audit passwords with a wordlist generator, and follow a 10-phase roadmap — all guided by an AI assistant that runs on *your* hardware or *your* API key.

> **Live demo:** [rednox-blush.vercel.app](https://rednox-blush.vercel.app)

> Built for education and authorized security testing only. Never attack a system you do not own or lack permission to test.

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white&style=flat-square)
![React](https://img.shields.io/badge/React%2019-61DAFB?logo=react&logoColor=black&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20v4-38BDF8?logo=tailwindcss&logoColor=black&style=flat-square)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white&style=flat-square)

---

## Key Features

- **637-tool Explorer** — every tool has a plain-English explanation, LiveView-style example commands (with per-command explanations), install command, tags, difficulty, and a save/bookmark system. Search, filter by category, or browse guides for popular tools like `nmap`, `sqlmap`, `hydra`, `hashcat`, and `msfvenom`.
- **AI Kali Assistant** — a teaching-focused assistant that answers with safe, lab-first examples. Bring your own key: **Ollama**, **OpenRouter**, **OpenAI**, or any **OpenAI-compatible endpoint** (LM Studio, Groq, vLLM, ...). Keys never touch your server — they live in the visitor's browser.
- **Terminal Sandbox** — a real xterm.js terminal with a virtual filesystem, so beginners can run Linux commands safely before touching a machine.
- **Kali Learn** — structured Linux, networking, and web-security lessons.
- **Word Gen** — generate targeted wordlists with leetspeak, numbers, years, and custom patterns for offline hash auditing.
- **Road Map** — a 10-phase guided curriculum that tracks your progress on a dashboard.
- **Bonus utilities** — encoding tools, IP/host helpers, and more.
- **5 accent themes** — neon, cosmic, aurora, ember, and ice, persisted per visitor.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Landing page with live stats and feature tour |
| `/explorer` | Browse all 637 tools with search + filters |
| `/tools/...` | Individual tool pages (plain-English, commands, install) |
| `/assistant` | AI Kali Assistant with BYOK provider settings |
| `/learn` | Kali Linux lessons |
| `/terminal` | Interactive terminal sandbox |
| `/wordlist` | Password wordlist generator |
| `/roadmap` | 10-phase learning curriculum |
| `/lab` | (Coming soon) practice labs |
| `/utilities` | Small security utilities collection |
| `/dashboard` | Progress tracking (optional local account) |
| `/support` | Contact + FAQ |

## AI Assistant — bring your own key

No account, no server-side keys. Every visitor picks a provider:

| Provider | What you get |
| --- | --- |
| **Ollama** | Local LLM, zero cost, zero keys (`localhost:11434`) |
| **OpenRouter** | Free tier models with a free API key from openrouter.ai |
| **OpenAI** | Any OpenAI model with your own key |
| **Custom** | Any OpenAI-compatible server (LM Studio, Groq, vLLM, ...) |

A **Test connection** button validates setup before saving. If no provider is configured, the assistant falls back to a built-in educational knowledge mode that still answers tool/topic questions.

## Getting Started

### Prerequisites

- Node.js 20.9+ and npm
- Optional: [Ollama](https://ollama.com) with a model pulled (`ollama pull qwen3:8b`)

### Install & run

```bash
npm install
cp .env.example .env      # then edit values (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `AUTH_SECRET` | yes | Secret used to sign auth cookies (JWT) — change from the example |
| `DB_PATH` | no | SQLite database path (default `data/app.db`) |
| `OPENROUTER_API_KEY` | no | Fallback key used when a visitor brings none |
| `OPENROUTER_MODEL` | no | Default fallback model (default `google/gemini-2.0-flash-001:free`) |

> The SQLite database is created automatically on first run.

## Deploy on Vercel

The app works out-of-the-box on Vercel — no database migrations needed.

One note: the default assistant provider is **local Ollama**, which does not exist on Vercel's servers. Two options:

1. Set `OPENROUTER_API_KEY` so every visitor gets AI responses by default, or
2. Leave it unset — visitors bring their own key via the **Connect your AI** button (⚡), and get the educational fallback otherwise.

```bash
npm run build && npm run start   # verify locally first
```

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, lucide-react |
| Terminal | xterm.js + addon-fit |
| Markdown rendering | react-markdown + remark-gfm |
| Database | SQLite via better-sqlite3 |
| Auth | bcryptjs + JWT (jose) — optional, browser-local sessions |
| Tool data | 637 typed tool definitions + guides & plain-English generator |

## Project Structure

```
src/
  app/            # routes (pages + API handlers)
  components/     # landing, assistant, explorer, common, site UI
  data/tools/     # 637 tool definitions, hand-written guides, auto-explainers
  lib/            # llm settings, terminal sandbox, site config, auth
data/             # SQLite database (gitignored)
```

## Contributing

Contributions are welcome — tool guides, missing commands, new lessons, or bug fixes. Open an issue first for larger ideas.

## License

This repository is published publicly, but no license has been applied yet. Reach out if you would like to use it in a project or contribute long-term. (FAQ, pricing, privacy, refund, and terms pages already exist in-app.)