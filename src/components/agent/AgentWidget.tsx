"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bot,
  Send,
  X,
  Plug,
  Loader2,
  Trash2,
  Sparkles,
  Zap,
} from "lucide-react";
import { loadSettings, saveSettings, type LlmSettings } from "@/lib/llm";
import { LlmSettingsModal } from "@/components/assistant/LlmSettings";
import { MarkdownMsg } from "@/components/assistant/MarkdownMsg";
import { matchIntent } from "@/lib/agent/intents";
import { runSkill, type TaskResult } from "@/lib/agent/skills";

type AgentMsg =
  | { id: number; role: "user"; content: string }
  | {
      id: number;
      role: "assistant";
      content?: string;
      task?: TaskResult;
      source: "skill" | "llm" | "local";
    };

const QUICK_TASKS = [
  "Open tool nmap",
  "Search tools for wifi",
  "List attack playbooks",
  "Run in the terminal: nmap -sV target.co",
  "Roadmap beginner",
  "What can you do?",
];

function localAnswer(text: string): string {
  const t = text.toLowerCase();
  if (/^(hi|hey|hello|yo|sup|good (morning|afternoon|evening))/.test(t))
    return "Hey! I'm NOX, your floating lab agent. Ask me a question or give me a task:\n\n• \"open tool nmap\"  ·  \"what is sqlmap\"\n• \"search tools for wifi\"\n• \"list attack playbooks\"\n• \"run in the terminal: nmap -sV target.co\"\n\nWant real AI answers (beyond app tasks)? Open the settings (plug icon) and connect a provider — Ollama on localhost:11434 is free and offline.";
  return "Got it — but no AI provider is connected, so I can only run app tasks right now. Try:\n\n• open tool nmap / what is sqlmap\n• search tools for wifi cracking\n• list attack playbooks\n• run in the terminal: nmap -sV target.co\n• roadmap\n• open the tools page\n\n…or connect an AI provider via the settings (plug icon). Ollama is free, private and works offline.";
}

function TaskCard({ task }: { task: TaskResult }) {
  return (
    <div className="rounded-xl border border-neon/30 bg-panel2/70 p-3 text-left shadow-[0_0_24px_-12px_var(--accent)]">
      <p className="text-[13px] font-semibold text-neon">{task.title}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg/90">
        {task.summary}
      </p>
      {task.items && task.items.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {task.items.map((it, i) =>
            it.href ? (
              <li key={i}>
                <Link
                  href={it.href}
                  className="group block rounded-lg border border-line/60 bg-abyss/50 px-2.5 py-1.5 transition-colors hover:border-neon/40"
                >
                  <span className="text-[12.5px] font-medium text-neon2 transition-colors group-hover:text-neon">
                    {it.label}
                  </span>
                  {it.desc && (
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-mut">
                      {it.desc}
                    </span>
                  )}
                </Link>
              </li>
            ) : (
              <li key={i}>
                <div className="px-1 py-0.5 text-[12.5px] text-fg/90">
                  {it.label}
                  {it.desc && (
                    <span className="ml-1 text-[11.5px] text-mut">{it.desc}</span>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}
      {task.code && task.code.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {task.code.map((c, i) => (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border border-line/60 bg-black/40 px-2.5 py-1.5 text-[11.5px] text-emerald-300"
            >
              {c}
            </pre>
          ))}
        </div>
      )}
      {task.note && (
        <p className="mt-2.5 text-[11px] italic text-dim">{task.note}</p>
      )}
    </div>
  );
}

export function AgentWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [settings, setSettings] = useState<LlmSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const id = requestAnimationFrame(() => setSettings(loadSettings()));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nextId = () => ++idRef.current;

  function performTask(task: TaskResult) {
    if (task.nav && task.nav !== pathname) router.push(task.nav);
    if (task.terminalCmd) {
      const delay = task.nav && task.nav !== pathname ? 1400 : 500;
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("gk-terminal-run", { detail: task.terminalCmd }),
        );
      }, delay);
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const id = nextId();
    const userMsg: AgentMsg = { id, role: "user", content };
    const msgs = [...messages, userMsg];
    setMessages(msgs);
    setInput("");
    setBusy(true);
    setError("");

    const assistantId = nextId();
    const upsert = (content: string) =>
      setMessages([
        ...msgs,
        { id: assistantId, role: "assistant", content, source: "llm" },
      ]);

    try {
      const intent = matchIntent(content);
      if (intent) {
        const task = await runSkill(intent);
        setMessages([
          ...msgs,
          { id: nextId(), role: "assistant", task, source: "skill" },
        ]);
        performTask(task);
        return;
      }

      if (!settings) {
        setMessages([
          ...msgs,
          {
            id: nextId(),
            role: "assistant",
            content: localAnswer(content),
            source: "local",
          },
        ]);
        return;
      }

      const chatHistory = msgs
        .filter(
          (m) => m.role === "user" || (m.role === "assistant" && m.content),
        )
        .map((m): { role: "user" | "assistant"; content: string } =>
          m.role === "user"
            ? { role: "user", content: m.content }
            : { role: "assistant", content: m.content ?? "" },
        );

      upsert("");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
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
            const delta: string = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              upsert(acc);
            }
          } catch {
            // partial line — wait for the next chunk
          }
        }
      }

      upsert(acc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      upsert("");
    } finally {
      setBusy(false);
    }
  }

  const last = messages[messages.length - 1];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close NOX agent" : "Open NOX agent"}
        className="fixed bottom-4 right-4 z-[95] flex h-14 w-14 items-center justify-center rounded-full border border-neon/40 bg-gradient-to-br from-panel2 to-abyss text-neon shadow-[0_0_28px_-6px_var(--accent)] transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-neon" />
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-[5.5rem] right-4 z-[95] flex h-[min(600px,calc(100dvh-9rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-abyss/95 shadow-[0_0_60px_-18px_var(--accent)] backdrop-blur">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Sparkles className="h-4 w-4 text-neon" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">NOX</p>
              <p className="truncate text-[11px] text-mut">
                {busy
                  ? "working…"
                  : mockMode
                    ? "offline mode — local answers only"
                    : settings
                      ? `connected · ${settings.provider}`
                      : "floating agent · task mode"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Agent AI settings"
              className="rounded-lg border border-line/60 p-1.5 text-mut transition-colors hover:border-neon/40 hover:text-neon"
            >
              <Plug className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMessages([])}
              aria-label="Clear conversation"
              className="rounded-lg border border-line/60 p-1.5 text-mut transition-colors hover:border-rose/50 hover:text-rose"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close agent"
              className="rounded-lg border border-line/60 p-1.5 text-mut transition-colors hover:border-neon/40 hover:text-neon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3.5"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neon/30 bg-panel2 text-neon shadow-[0_0_24px_-8px_var(--accent)]">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg">
                    I&apos;m NOX — ask or command.
                  </p>
                  <p className="mx-auto mt-1 max-w-[260px] text-[12px] text-mut">
                    I answer questions and perform tasks: open tools, search the
                    database, list playbooks, run sandbox commands.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m) =>
              m.role === "user" ? (
                <div
                  key={m.id}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm border border-neon/40 bg-neon/15 px-3 py-2 text-[13px] text-fg"
                >
                  {m.content}
                </div>
              ) : m.task ? (
                <div key={m.id} className="max-w-[92%]">
                  <TaskCard task={m.task} />
                </div>
              ) : (
                <div key={m.id} className="max-w-[92%]">
                  {m.content ? (
                    <div className="rounded-xl border border-line/70 bg-panel/80 px-3 py-2 text-[13px] text-fg/95">
                      <MarkdownMsg content={m.content} />
                    </div>
                  ) : busy && last?.id === m.id ? (
                    <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-panel/80 px-3 py-2.5 text-mut">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neon" />
                      <span className="text-[12px]">thinking…</span>
                    </div>
                  ) : null}
                  {m.source === "llm" && !m.content && error && (
                    <p className="mt-1 text-[11px] text-rose">{error}</p>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="border-t border-line px-3.5 pt-2.5">
            <div className="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none]">
              {QUICK_TASKS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={busy}
                  className="shrink-0 rounded-full border border-line/60 px-2.5 py-1 text-[11px] text-mut transition-colors hover:border-neon/40 hover:text-neon disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 pb-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me something or give me a task…"
                className="flex-1 rounded-xl border border-line bg-panel px-3 py-2 text-[13px] text-fg outline-none transition-colors placeholder:text-dim focus:border-neon/50"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neon/40 bg-neon/15 text-neon transition-colors hover:bg-neon/25 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
            <p className="flex items-center gap-1 border-t border-line/60 px-1 py-2 text-[10.5px] text-dim">
              <Zap className="h-3 w-3 text-amber" />
              Tasks run inside the app & sandbox only — no real-world actions.
            </p>
          </div>
        </div>
      )}

      {settingsOpen && settings && (
        <LlmSettingsModal
          open={settingsOpen}
          settings={settings}
          onSave={(next) => {
            saveSettings(next);
            setSettings(next);
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}