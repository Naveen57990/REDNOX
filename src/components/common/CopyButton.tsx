"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      onClick={copy}
      className="rounded border border-edge bg-panel2 px-2 py-1 text-[11px] text-mut transition-colors hover:border-neon/50 hover:text-neon"
    >
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}