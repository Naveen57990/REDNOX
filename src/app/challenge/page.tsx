import type { Metadata } from "next";
import { DailyChallenge } from "@/components/challenge/DailyChallenge";

export const metadata: Metadata = {
  title: "Daily Challenge — GO KALI",
  description:
    "A short adaptive quiz every day: tool, command and case questions that scale with your level. Play daily to keep your streak alive and earn XP.",
};

export default function ChallengePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">Daily Challenge</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Keep the <span className="text-neon">streak</span> alive
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Every day a fresh five-question set, generated from the tool database, the
          commands lab and real case scenarios. Questions adapt to what you&apos;ve done
          around the site — the more you train, the harder they get.
        </p>
      </div>
      <DailyChallenge />
    </main>
  );
}