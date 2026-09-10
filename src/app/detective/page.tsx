import type { Metadata } from "next";
import { DetectiveApp } from "@/components/detective/DetectiveApp";

export const metadata: Metadata = {
  title: "Exploit Detective — GO KALI",
  description:
    "Chain-of-thought lab scenarios: read the story, pick the right tool and the right move at every step to solve the case and earn XP.",
};

export default function DetectivePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">Exploit Detective</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Solve the <span className="text-neon">case</span>, step by step
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Each case drops you into a scene with an objective. Work through the investigation —
          choose the right move at every step, and wrong picks hand you a clue instead of the
          answer. Finish a case to bank XP (Easy +30, Hard +50).
        </p>
      </div>
      <DetectiveApp />
    </main>
  );
}