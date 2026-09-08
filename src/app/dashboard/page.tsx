import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { DashboardProgress } from "@/components/dashboard/DashboardProgress";

export const metadata: Metadata = {
  title: "Dashboard — GO KALI",
  description: "Your GO KALI dashboard.",
};

const shortcuts = [
  { href: "/assistant", icon: "🤖", title: "AI Assistant", desc: "Ask anything about any Kali tool." },
  { href: "/terminal", icon: "💻", title: "Terminal Sandbox", desc: "Practice commands safely." },
  { href: "/roadmap", icon: "🗺️", title: "Road Map", desc: "Zero to hero, 10 phases." },
  { href: "/learn", icon: "🎬", title: "Kali Learn", desc: "184+ video tutorials." },
  { href: "/tools", icon: "🧰", title: "600+ Tools", desc: "Search the full database." },
  { href: "/lab", icon: "🛠️", title: "Tools Lab", desc: "Wordlists + 30 utilities." },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mono text-xs uppercase tracking-[0.25em] text-neon">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold text-fg">
            Hey,{" "}
            <span className="text-neon">
              {user?.name || user?.email.split("@")[0]}
            </span>
          </h1>
          <p className="mt-2 text-sm text-mut">
            Free Forever member · every feature unlocked, no trial expiry.
          </p>
        </div>
        <span className="rounded-full border border-neon/40 bg-neon/10 px-4 py-1.5 text-xs font-medium text-neon">
          ● Pro Access — $0
        </span>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-fg">Quick Access</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="card-hover rounded-xl border border-edge bg-panel p-5"
              >
                <span className="text-2xl">{s.icon}</span>
                <h3 className="mt-3 text-base font-semibold text-fg">{s.title}</h3>
                <p className="mt-1 text-sm text-mut">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
        <DashboardProgress />
      </div>
    </div>
  );
}