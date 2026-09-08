import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tools Lab — GO KALI",
  description:
    "Free hacking lab utilities — wordlist generator, hash tools, encoders, subnet calculator and a safe terminal sandbox.",
};

const TOOLS = [
  {
    href: "/wordlist",
    icon: "📦",
    title: "Wordlist Generator",
    desc: "Create targeted wordlists with leet-speak, years, numbers and separators. One-click download.",
    tag: "Free",
  },
  {
    href: "/utilities",
    icon: "🧰",
    title: "Utilities",
    desc: "Hashes, hash identification, Base64/URL encode, subnet calculator and number-base converter.",
    tag: "Free",
  },
  {
    href: "/terminal",
    icon: "💻",
    title: "Terminal Sandbox",
    desc: "A safe, simulated Kali terminal to practice CLI skills without any real risk.",
    tag: "Free",
  },
  {
    href: "/tools",
    icon: "🗂️",
    title: "600+ Tool Database",
    desc: "Browse every Kali tool with usage, flags, examples and related tools.",
    tag: "Free",
  },
];

export default function LabPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Tools <span className="text-neon">Lab</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Our free hacker toolbox — every utility you’d expect from a pro
          platform, <span className="text-neon">at zero cost</span>, running
          right in your browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-xl border border-line bg-panel p-5 transition hover:border-neon/50 hover:bg-[#0d1511]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{t.icon}</span>
              <h2 className="text-lg font-semibold text-white group-hover:text-neon">
                {t.title}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.desc}</p>
            <span className="mt-3 inline-block rounded-full bg-neon/10 px-2.5 py-0.5 text-[11px] font-semibold text-neon">
              {t.tag}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-warn/30 bg-warn/5 p-5">
        <h3 className="text-sm font-semibold text-warn">Security notice</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          These utilities are for learning and authorized testing only. Using
          them against systems you do not own is illegal in most countries.
          Always stay within scope and get written authorization.
        </p>
      </div>
    </main>
  );
}