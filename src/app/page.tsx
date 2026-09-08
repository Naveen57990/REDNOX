import Link from "next/link";
import { TerminalPreview } from "@/components/landing/TerminalPreview";
import { Reveal } from "@/components/common/Reveal";
import { SpotlightCard } from "@/components/landing/SpotlightCard";
import { CountUp } from "@/components/landing/CountUp";
import { Tilt } from "@/components/landing/Tilt";

const features = [
  {
    icon: "🧰",
    title: "637 Kali Tools",
    desc: "Complete tool database with commands, install instructions and examples.",
    href: "/tools",
    cta: "Browse the database",
  },
  {
    icon: "🤖",
    title: "AI Assistant",
    desc: "Local Ollama + free cloud models — explain any tool or command in plain English.",
    href: "/assistant",
    cta: "Ask the copilot",
  },
  {
    icon: "🛠️",
    title: "Utility Tools",
    desc: "IP, hash, encoding and networking tools in your browser — free, no install.",
    href: "/utilities",
    cta: "Open the toolbox",
  },
  {
    icon: "💻",
    title: "Terminal Sandbox",
    desc: "Practice commands in a safe, simulated Kali-like terminal — no real systems harmed.",
    href: "/terminal",
    cta: "Enter the sandbox",
  },
  {
    icon: "🗺️",
    title: "Road Map",
    desc: "Zero to Hero learning path with 10 phases and guided lessons across the whole field.",
    href: "/roadmap",
    cta: "Start the journey",
  },
  {
    icon: "🎬",
    title: "Kali Learn",
    desc: "180+ video-style tutorials and guides for every phase of your training.",
    href: "/learn",
    cta: "Open the library",
  },
  {
    icon: "📋",
    title: "Wordlist Generator",
    desc: "Advanced password list generation — names, years, leet, separators and patterns.",
    href: "/wordlist",
    cta: "Generate wordlists",
  },
  {
    icon: "💬",
    title: "Priority Support",
    desc: "Fast help whenever you get stuck — email the team and get a reply within a day.",
    href: "/support",
    cta: "Get support",
  },
];

const phases = [
  "1 · Foundations",
  "2 · Linux Essentials",
  "3 · Information Gathering",
  "4 · Vulnerability Analysis",
  "5 · Web Attacks",
  "6 · Password Attacks",
  "7 · Exploitation",
  "8 · Post-Exploitation & Privesc",
  "9 · Wireless & Sniffing",
  "10 · Reporting & Career",
];

const marqueeTools = [
  "nmap",
  "sqlmap",
  "burpsuite",
  "metasploit",
  "hashcat",
  "john",
  "aircrack-ng",
  "wireshark",
  "gobuster",
  "ffuf",
  "hydra",
  "bloodhound",
  "evil-winrm",
  "crackmapexec",
  "responder",
  "bettercap",
  "wpscan",
  "nikto",
  "chisel",
  "linpeas",
];

const stats: (
  | { l: string; text: string }
  | { l: string; n: number; suffix?: string }
)[] = [
  { l: "Tools", n: 637 },
  { l: "Videos", n: 184, suffix: "+" },
  { l: "Phases", n: 10 },
  { l: "Powered", text: "AI" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grid relative overflow-hidden">
        <div className="bg-radial-fade pointer-events-none absolute inset-0" />
        <div className="blob-a pointer-events-none absolute -top-24 left-[8%] h-72 w-72 rounded-full bg-accent/20 blur-[110px]" />
        <div className="blob-b pointer-events-none absolute right-[4%] top-16 h-64 w-64 rounded-full bg-accent2/15 blur-[100px]" />

        <div className="hero-chip pointer-events-none absolute left-2 top-28 hidden -rotate-3 rounded-lg border border-accent/25 bg-panel/70 px-3 py-2 font-mono text-xs text-mut backdrop-blur lg:block">
          nmap <span className="text-accent">-sV -sC</span>
        </div>
        <div className="hero-chip-delay pointer-events-none absolute right-3 top-40 hidden rotate-2 rounded-lg border border-accent2/25 bg-panel/70 px-3 py-2 font-mono text-xs text-mut backdrop-blur lg:block">
          sqlmap <span className="text-accent2">--dump-all</span>
        </div>
        <div className="hero-chip pointer-events-none absolute bottom-40 left-[6%] hidden rotate-2 rounded-lg border border-accent/20 bg-panel/60 px-3 py-2 font-mono text-xs text-dim xl:block">
          hashcat <span className="text-accent">-m 3200</span>
        </div>
        <div className="hero-chip-delay pointer-events-none absolute bottom-52 right-[7%] hidden -rotate-2 rounded-lg border border-accent2/20 bg-panel/60 px-3 py-2 font-mono text-xs text-dim xl:block">
          wireshark <span className="blink-soft text-accent">●</span>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-24">
          <div className="text-center">
            <span className="rise inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent transition-all hover:border-accent/70 hover:shadow-[0_0_24px_-6px_var(--accent-glow)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              100% FREE FOREVER — NO PAYWALL
            </span>
            <p className="rise rise-d1 mono mt-6 text-xs uppercase tracking-[0.35em] text-cyber">
              Cybersecurity Copilot
            </p>
            <h1 className="rise rise-d2 mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-fg sm:text-6xl">
              Your <span className="shimmer-text">AI-Powered</span> Kopilot for Cybersecurity Mastery
            </h1>
            <p className="rise rise-d2 font-hand mt-2 text-lg text-accent/70">
              everything in one place
            </p>
            <p className="rise rise-d3 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-mut sm:text-lg">
              Master every Kali Linux tool with intelligent assistance, guided
              tutorials and AI-powered learning. Everything unlocked — no paid
              plan, ever.
            </p>
            <div className="rise rise-d4 mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="btn-primary btn-shine rounded-lg px-6 py-3 text-sm font-semibold"
              >
                Get Started Free →
              </Link>
              <Link
                href="/tools"
                className="rounded-lg border border-edge bg-panel px-6 py-3 text-sm font-medium text-fg transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
              >
                Browse 637 Tools
              </Link>
            </div>

            <div className="rise rise-d4 mx-auto mt-10 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.l}
                  className="g-border-soft rounded-lg px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_-14px_var(--accent-glow)]"
                >
                  <p className="mono text-2xl font-bold text-accent">
                    {"n" in s ? (
                      <CountUp value={s.n} suffix={s.suffix ?? ""} />
                    ) : (
                      s.text
                    )}
                  </p>
                  <p className="mt-0.5 text-xs uppercase tracking-widest text-dim">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rise rise-d5 mx-auto mt-14 max-w-3xl">
            <Tilt max={5}>
              <TerminalPreview />
            </Tilt>
            <p className="mono mt-3 text-center text-xs text-dim">
              kali@gokali:~$ echo &quot;built for learners, not for harm&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Tool marquee */}
      <section
        aria-label="Popular tools"
        className="relative overflow-hidden border-y border-edge bg-abyss/70 py-4"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-abyss to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-abyss to-transparent" />
        <div className="marquee-track mono text-sm text-mut">
          {[...marqueeTools, ...marqueeTools].map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="mx-8 flex items-center gap-8 whitespace-nowrap transition-colors hover:text-accent"
            >
              {t}
              <span className="blink-soft text-accent">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="text-center">
          <p className="mono text-xs uppercase tracking-[0.3em] text-cyber">
            What&apos;s inside
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Everything you need, <span className="shimmer-text">nothing to pay</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-mut">
            The same feature set as paid platforms — re-imagined free. Every
            single feature included.
          </p>
          <span className="mx-auto mt-6 block h-px w-28 bg-gradient-to-r from-transparent via-accent to-transparent" />
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 80}>
              <SpotlightCard className="h-full rounded-xl">
                <Link
                  href={f.href}
                  className="card-lift group flex h-full flex-col rounded-xl border border-edge bg-panel p-6"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    {f.icon}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-fg transition-colors group-hover:text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-mut">
                    {f.desc}
                  </p>
                  <p className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-all duration-300 group-hover:opacity-100 [&>span]:translate-x-0 [&>span]:group-hover:translate-x-0.5">
                    <span className="transition-transform duration-300">{f.cta}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </p>
                </Link>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Roadmap strip */}
      <section className="border-y border-edge bg-panel/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mono text-xs uppercase tracking-[0.25em] text-accent">
                Road Map
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-fg">
                Zero to Hero in <span className="text-accent">10 Phases</span>
              </h2>
            </div>
            <Link
              href="/roadmap"
              className="rounded-lg border border-edge bg-panel px-5 py-2.5 text-sm font-medium text-fg transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
            >
              View the full roadmap →
            </Link>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {phases.map((p, i) => (
              <Reveal key={p} delay={(i % 5) * 60}>
                <div
                  className={`rounded-lg border px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_-16px_var(--accent-glow)] ${
                    i < 2 ? "g-border-soft" : "border-edge hover:border-accent/40"
                  }`}
                >
                  <p className="mono text-[11px] uppercase tracking-widest text-dim">
                    Phase {i + 1}
                  </p>
                  <p className="mt-1 text-sm font-medium text-fg">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20">
        <div className="bg-radial-fade pointer-events-none absolute inset-0" />
        <div className="blob-b pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/15 blur-[110px]" />
        <div className="relative mx-auto max-w-3xl px-4">
          <Reveal>
            <div className="g-border rounded-2xl px-6 py-12 text-center sm:px-12">
              <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
                Start hacking ethically —{" "}
                <span className="shimmer-text">for free</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mut">
                Create a free account, unlock the AI assistant and terminal
                sandbox, and begin the 10-phase journey. No credit card, no
                trial expiry, no catches.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/signup"
                  className="btn-primary btn-shine rounded-lg px-7 py-3 text-sm font-semibold"
                >
                  Create Free Account →
                </Link>
                <Link
                  href="/terminal"
                  className="rounded-lg border border-edge bg-panel px-7 py-3 text-sm font-medium text-fg transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
                >
                  Access Terminal
                </Link>
              </div>
              <p className="mt-6 text-xs text-dim">
                ⚠️ Educational purposes only. Use responsibly and legally. Only
                test systems you own or are authorized to test.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}