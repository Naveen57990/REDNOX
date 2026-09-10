import type { Metadata } from "next";
import { TerminalSandbox } from "@/components/terminal/TerminalSandbox";
import { TerminalChips } from "@/components/terminal/TerminalChips";

export const metadata: Metadata = {
  title: "Terminal Sandbox — GO KALI",
  description:
    "Free, safe, simulated Kali Linux terminal — practice commands without risk.",
};

export default function TerminalPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Terminal <span className="text-neon">Sandbox</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          A safe, <span className="text-neon">free</span> Kali terminal to{" "}
          <span className="text-neon">install</span> tools and practice real
          workflows — virtually. <code className="text-neon">sudo apt install sqlmap</code>{" "}
          really makes <code className="text-neon">sqlmap</code> available, then you run it
          against a simulated lab (target.co, db01.internal). Everything happens safely
          in your browser — no live attacks, no harm, no risk.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-panel shadow-lg shadow-black/40">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-3 font-mono text-xs text-muted">
            kali@gokali: sandbox
          </span>
        </div>
        <TerminalSandbox />
      </div>

      <TerminalChips />
      <p className="mt-4 text-center text-xs text-muted">
        <span className="text-warn">Note:</span> clicking a chip types the command for
        you. Tools are installed <em>virtually</em> and only run inside this simulated
        lab — nothing touches a real network, and real-world attacks on unauthorized
        systems stay illegal.
      </p>
    </main>
  );
}