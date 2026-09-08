import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — GO KALI",
  description: "GO KALI pricing — free forever. Every feature, no paywall.",
};

const FEATURES = [
  "600+ Kali tool database",
  "AI assistant (free AI models)",
  "Safe terminal sandbox",
  "10-phase learning roadmap",
  "Kali Learn video library",
  "Tools Lab utilities",
  "Wordlist generator",
  "Unlimited usage, no credits",
];

const PAID_FEATURES = [
  "1,000 AI messages / day",
  "GPU cracking (hashtopolis)",
  "Scheduled scans",
  "Team collaboration",
  "Certification exam vouchers",
  "Private Discord",
  "Early access to new tools",
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto mb-12 max-w-2xl text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Priced to be <span className="text-neon">free forever</span>
        </h1>
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          The full GO KALI experience — every tool, every feature — free,
          forever. No trials, no paywalls, no credit cards. Paid plans exist
          only to fund servers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative rounded-2xl border-2 border-neon/60 bg-panel p-7">
          <span className="absolute -top-3 left-6 rounded-full bg-neon px-3 py-0.5 text-xs font-bold text-black">
            FREE FOREVER
          </span>
          <h2 className="text-lg font-semibold text-white">Starter</h2>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-4xl font-bold text-neon">$0</span>
            <span className="pb-1 text-sm text-muted">/ forever</span>
          </div>
          <p className="mt-3 text-sm text-muted">Everything you need to learn and practice Kali Linux.</p>
          <ul className="mt-5 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-white">
                <span className="mt-0.5 text-neon">✓</span> {f}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-6 block rounded-lg bg-neon px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-neon/80"
          >
            Start Free
          </Link>
        </div>

        <div className="relative rounded-2xl border border-line bg-panel p-7">
          <span className="absolute -top-3 left-6 rounded-full border border-line bg-abyss px-3 py-0.5 text-xs font-medium text-muted">
            OPTIONAL
          </span>
          <h2 className="text-lg font-semibold text-white">Premium</h2>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-4xl font-bold text-white">$9</span>
            <span className="pb-1 text-sm text-muted">/ month</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            For heavy users who want more power. 100% optional — nothing core is locked.
          </p>
          <ul className="mt-5 space-y-2.5">
            {PAID_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-white">
                <span className="mt-0.5 text-warn">✦</span> {f}
              </li>
            ))}
          </ul>
          <button
            disabled
            className="mt-6 block w-full cursor-not-allowed rounded-lg border border-line px-4 py-2.5 text-center text-sm font-medium text-muted"
          >
            Coming soon
          </button>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-line bg-panel p-5 text-center text-sm text-muted">
        Student, a country with low purchasing power, or just broke?{" "}
        <span className="text-white">The free plan is the whole product.</span>{" "}
        That’s the point.
      </div>
    </main>
  );
}