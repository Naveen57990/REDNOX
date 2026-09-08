import Link from "next/link";

const groups: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Learn",
    links: [
      { href: "/tools", label: "Kali Tool Database" },
      { href: "/roadmap", label: "Zero to Hero Roadmap" },
      { href: "/learn", label: "Kali Learn" },
      { href: "/terminal", label: "Terminal Sandbox" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/lab", label: "Tools Lab" },
      { href: "/wordlist", label: "Wordlist Generator" },
      { href: "/utilities", label: "Utility Tools" },
      { href: "/assistant", label: "AI Assistant" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/support", label: "Contact & Support" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-edge bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-accent/50 bg-accent/10 text-accent">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
              </span>
              <span className="text-lg font-bold text-fg">
                CyberLab<span className="ml-1 text-accent">AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mut">
              Everything in one place. Learn cybersecurity, explore tools,
              practice Linux concepts, follow roadmaps, and build skills in a
              safe environment.
            </p>
            <p className="mt-4 mono text-xs text-dim">
              student@cyberlab:~$ echo &quot;keep practicing&quot;
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="mono text-xs font-semibold uppercase tracking-widest text-dim">
                {g.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-mut transition-colors hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-edge pt-6 sm:flex-row">
          <p className="text-xs text-dim">
            © {new Date().getFullYear()} CyberLab AI. All rights reserved.
          </p>
          <p className="max-w-md text-center text-xs leading-relaxed text-dim sm:text-right">
            ⚠️ Educational purposes only. Practice only on systems you own or
            are explicitly authorized to test. Use responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}