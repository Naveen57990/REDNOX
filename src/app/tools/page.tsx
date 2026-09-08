import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolBrowser } from "@/components/tools/ToolBrowser";

export const metadata: Metadata = {
  title: "600+ Kali Linux Tools Database — GO KALI",
  description:
    "Browse 610+ Kali Linux tools with commands, install instructions and descriptions. Free forever.",
};

export default function ToolsPage() {
  return (
    <div>
      <div className="bg-radial-fade border-b border-edge">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <p className="mono text-xs uppercase tracking-[0.25em] text-neon">
            Kali Tool Database
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            600+ Kali{" "}
            <span className="text-neon text-glow">Linux Tools</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mut">
            Every tool with a description, real command examples and install
            instructions. Complete tool database — free, no login needed.
          </p>
        </div>
      </div>
      <Suspense fallback={null}>
        <ToolBrowser />
      </Suspense>
    </div>
  );
}