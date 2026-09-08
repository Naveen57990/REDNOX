import type { Metadata } from "next";
import { UtilitiesPanel } from "@/components/lab/UtilitiesPanel";

export const metadata: Metadata = {
  title: "Utilities — GO KALI",
  description:
    "Free security utilities — hash generator, hash identifier, encoders, subnet calculator and number base converter.",
};

export default function UtilitiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Security <span className="text-neon">Utilities</span>
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Every-day helpers for the aspiring analyst — all <span className="text-neon">free</span>,
          all in-browser, nothing uploaded. Handle your own data only.
        </p>
      </div>
      <UtilitiesPanel />
    </main>
  );
}