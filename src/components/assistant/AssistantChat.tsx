"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Check,
  Trash2,
  Send,
  Bot,
  User,
  Plug,
} from "lucide-react";
import { MarkdownMsg } from "./MarkdownMsg";
import { LlmSettingsModal } from "./LlmSettings";
import {
  loadSettings,
  saveSettings,
  PROVIDER_LABEL,
  type LlmSettings,
} from "@/lib/llm";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's the best way to start with Kali Linux?",
  "Explain nmap -sV -sC output",
  "What is msfvenom and how do I use it safely?",
  "How do I crack WPA2 handshakes ethically?",
  "Explain privilege escalation on Linux",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [settings, setSettings] = useState<LlmSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSettings(loadSettings()));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    const userMsgs: ChatMsg[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages([...userMsgs, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: userMsgs,
          provider: settings?.provider,
          model: settings?.model,
          apiKey: settings?.apiKey,
          baseUrl: settings?.baseUrl,
        }),
      });

      if (res.headers.get("X-Mock") === "1") setMockMode(true);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      if (!res.body) throw new Error("No response stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta: string =
              json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages([
                ...userMsgs,
                { role: "assistant", content: acc },
              ]);
            }
          } catch {
            /* partial line */
          }
        }
      }

      setMessages([...userMsgs, { role: "assistant", content: acc }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages([...userMsgs, { role: "assistant", content: "" }]);
    } finally {
      setBusy(false);
    }
  }

  async function copyMessage(idx: number, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1600);
    } catch {
      setError("Could not copy — clipboard unavailable.");
    }
  }

  function clearChat() {
    setMessages([]);
    setError("");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-112px)] max-w-4xl flex-col px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
            <Bot size={22} className="text-neon" />
            AI Kali Assistant
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Ask me anything about authorized cybersecurity learning.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="hidden items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-medium text-muted transition hover:border-rose/40 hover:text-rose sm:flex"
            >
              <Trash2 size={13} /> Clear
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-all hover:border-accent/70 hover:shadow-[0_0_20px_-6px_var(--accent-glow)]"
          >
            <Plug size={13} />
            <span className="hidden sm:inline">
              {settings
                ? `${PROVIDER_LABEL[settings.provider]} · ${settings.model}`
                : "Connect your AI"}
            </span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>
      </div>

      {mockMode && (
        <button
          onClick={() => setMockMode(false)}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-left text-xs text-muted hover:border-warn/50"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
          <span>
            <span className="font-semibold text-warn">Local educational mode.</span>{" "}
            No AI provider connected. Hit{" "}
            <span className="font-semibold text-accent">Connect your AI</span>{" "}
            (⚡) for full responses with a free OpenRouter key or your own
            Ollama/LM Studio. Tap to dismiss.
          </span>
        </button>
      )}

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-line bg-panel/40 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div>
              <p className="text-3xl">🤖</p>
              <h2 className="mt-3 text-lg font-semibold text-white">
                Ask me anything about Kali Linux
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Commands, tool explanations, methodology — I&apos;ll tell you how
                to do it ethically and legally.
              </p>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-panel px-3.5 py-2 text-xs text-muted transition-colors hover:border-neon/50 hover:text-neon"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <AssistantMsg
            key={i}
            message={m}
            isLast={i === messages.length - 1}
            busy={busy}
            copied={copiedIdx === i}
            onCopy={() => copyMessage(i, m.content)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mt-2 rounded-md border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
          ⚠️ {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any Kali tool or command..."
          className="flex-1 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-white placeholder:text-dim focus:border-neon/60 focus:outline-none"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex items-center gap-1.5 rounded-lg bg-neon px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send size={15} />
          {busy ? "…" : "Send"}
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] text-dim">
        ⚠️ For education only. Never attack a system you don&apos;t own or lack
        authorization to test.
      </p>

      {settings && settingsOpen && (
        <LlmSettingsModal
          open={settingsOpen}
          settings={settings}
          onSave={(next) => {
            saveSettings(next);
            setSettings(next);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function AssistantMsg({
  message,
  isLast,
  busy,
  copied,
  onCopy,
}: {
  message: ChatMsg;
  isLast: boolean;
  busy: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neon/35 bg-neon/10 text-neon">
          <Bot size={16} />
        </span>
      )}
      <div
        className={`fade-in max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-md bg-gradient-to-br from-neon/20 to-cyber/10 text-fg ring-1 ring-neon/25"
            : "border border-line bg-panel text-white"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-fg/95">{message.content}</p>
        ) : message.content ? (
          <MarkdownMsg content={message.content} />
        ) : busy && isLast ? (
          <span className="flex items-center gap-1 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-neon blink-soft" />
            <span
              className="h-1.5 w-1.5 rounded-full bg-neon blink-soft"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="h-1.5 w-1.5 rounded-full bg-neon blink-soft"
              style={{ animationDelay: "0.3s" }}
            />
          </span>
        ) : null}

        {!isUser && message.content && (
          <button
            onClick={onCopy}
            aria-label="Copy response"
            className="mt-2 flex items-center gap-1 text-[11px] text-dim transition hover:text-neon"
          >
            {copied ? (
              <>
                <Check size={11} /> Copied
              </>
            ) : (
              <>
                <Copy size={11} /> Copy
              </>
            )}
          </button>
        )}
      </div>
      {isUser && (
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyber/35 bg-cyber/10 text-cyber">
          <User size={16} />
        </span>
      )}
    </div>
  );
}