import type { Metadata } from "next";
import Link from "next/link";
import { ATTACK_PLAYBOOKS, ATTACK_CATEGORIES } from "@/data/attacks";
import { ShieldAlert, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Attack Playbooks — GO KALI",
  description:
    "How real-world attacks actually happen: technique chains, the tools behind them, and how defenders detect and stop each one.",
};

export default function AttackPlaybooksIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mono text-xs text-dim">
        <Link href="/" className="transition-colors hover:text-accent">
          home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mut">attack playbooks</span>
      </nav>

      <div className="mt-6">
        <p className="font-hand flex items-center gap-2 text-lg text-accent">
          <ShieldAlert size={16} /> the attacker&apos;s playbook
        </p>
        <h1 className="mt-1 text-3xl font-bold text-fg">Attack Playbooks</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mut">
          The techniques behind every-day real-world attacks — from a phishing
          email to a planted malicious APK — broken into the exact steps an
          attacker runs, the tools they use, and how defenders detect and stop
          each one. Every playbook keeps the same structure so you can read a
          scenario end-to-end and know its weaknesses before it happens to you.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {ATTACK_CATEGORIES.map((cat) => {
          const playbooks = ATTACK_PLAYBOOKS.filter((p) => p.category === cat.id);
          if (playbooks.length === 0) return null;
          return (
            <section key={cat.id}>
              <h2 className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-fg">
                <span className="text-accent">{cat.label}</span>
                <span className="mono text-[11px] font-normal text-dim">
                  {playbooks.length} playbook{playbooks.length > 1 ? "s" : ""}
                </span>
              </h2>
              <p className="mt-0.5 text-[13px] leading-relaxed text-mut">{cat.description}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {playbooks.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/attacks/${p.slug}`}
                    className="card-lift group flex flex-col rounded-xl border border-edge bg-panel p-5 transition-all duration-300 hover:border-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg">{p.icon}</span>
                      <span className="mono text-[10.5px] text-dim">
                        {p.steps.length} steps
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-[15px] font-bold leading-snug text-fg group-hover:text-accent">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-mut">{p.summary}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-transform duration-300 group-hover:translate-x-1">
                      Step through it <ArrowRight size={14} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="g-border-soft fade-up mt-10 rounded-xl p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <ShieldAlert size={16} className="text-accent" /> Purpose &amp; scope
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-mut">
          These playbooks teach you how attacks work so you can stop them — for
          education, detection engineering, and authorised penetration testing
          only. You run the techniques exclusively on systems and accounts you
          own, in your own lab, or with written scope. Know the attack well
          enough to recognise it, and it can&apos;t catch you off guard.
        </p>
      </section>
    </div>
  );
}