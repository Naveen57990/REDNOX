import type { Metadata } from "next";
import { MissionsApp } from "@/components/missions/MissionsApp";
import { TerminalSandbox } from "@/components/terminal/TerminalSandbox";

export const metadata: Metadata = {
  title: "Lab Missions — GO KALI",
  description:
    "Solo training missions: complete real tool workflows in the safe terminal sandbox and earn XP.",
};

export default function MissionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">
          Lab Missions
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Train like it&apos;s <span className="text-neon">real</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Pick a mission, work through its steps in the sandbox below (install
          the tool, then run it), and the checklist verifies each command you
          type. Finish a mission to bank XP — harder missions pay more.
        </p>
      </div>

      <div className="mb-10">
        <MissionsApp />
      </div>

      <div className="rounded-xl border border-line bg-panel shadow-lg shadow-black/40">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-3 font-mono text-xs text-muted">
            kali@gokali: mission-lab
          </span>
        </div>
        <TerminalSandbox />
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Everything runs virtually against the lab hosts (target.co, db01.internal)
        — no real systems, no real harm.
      </p>
    </main>
  );
}