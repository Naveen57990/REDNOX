"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, TerminalSquare } from "lucide-react";
import type { Components } from "react-markdown";

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-edge bg-[#0a1219]">
      <div className="flex items-center justify-between border-b border-edge/70 bg-panel2/60 px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-dim">
          <TerminalSquare size={12} className="text-neon" />
          {lang || "bash"}
        </span>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1 text-[11px] text-dim transition hover:text-neon"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-relaxed text-fg">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="mx-0.5 rounded-md border border-edge bg-panel2 px-1.5 py-0.5 font-mono text-[0.85em] text-neon">
      {children}
    </code>
  );
}

const components: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const text = String(children).replace(/\n$/, "");
    const isBlock = Boolean(match) || text.includes("\n");
    if (!isBlock) return <InlineCode>{children}</InlineCode>;
    return <CodeBlock lang={match?.[1]}>{text}</CodeBlock>;
  },
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 font-display text-lg font-bold text-white">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 font-display text-base font-bold text-white">
      <span className="mr-1.5 text-neon">##</span>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 font-display text-sm font-bold text-white">
      <span className="mr-1.5 text-cyber">###</span>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-2 text-sm leading-relaxed text-fg/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-fg/90 marker:text-neon">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-fg/90 marker:text-neon">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-r-lg border-l-2 border-warn/70 bg-warn/5 px-3.5 py-2.5 text-[13px] leading-relaxed text-mut">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-edge">
      <table className="w-full border-collapse text-left text-[13px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-panel2/70 text-dim">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-edge px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-edge/60 px-3 py-2 align-top text-fg/85">
      {children}
    </td>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-neon underline decoration-neon/40 underline-offset-2 transition-colors hover:decoration-neon"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-fg/85">{children}</em>,
  hr: () => <hr className="my-4 border-edge" />,
};

export function MarkdownMsg({ content }: { content: string }) {
  return (
    <div className="markdown-msg">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}