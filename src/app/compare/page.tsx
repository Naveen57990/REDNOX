import type { Metadata } from "next";
import { CompareApp } from "@/components/compare/CompareApp";

export const metadata: Metadata = {
  title: "Tool Comparisons — GO KALI",
  description:
    "Side-by-side comparisons of Kali tools: installs, commands, difficulty and when to use which.",
};

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <p className="mono text-xs uppercase tracking-[0.25em] text-neon">
          Tool Comparisons
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Compare <span className="text-neon">any two tools</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Pick two tools (or tap a suggested pair) and get a side-by-side:
          category, difficulty, install method, commands, strengths — plus a
          plain-English verdict on when to reach for which.
        </p>
      </div>
      <CompareApp />
    </main>
  );
}