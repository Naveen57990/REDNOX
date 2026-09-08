"use client";

import { useEffect, useState } from "react";
import {
  Plug,
  X,
  Check,
  Loader2,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import {
  PROVIDERS,
  type LlmProvider,
  type LlmSettings,
} from "@/lib/llm";

export function LlmSettingsModal({
  open,
  settings,
  onSave,
  onClose,
}: {
  open: boolean;
  settings: LlmSettings;
  onSave: (settings: LlmSettings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<LlmSettings>(() => settings);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<{
    kind: "idle" | "testing" | "ok" | "error";
    text?: string;
  }>({ kind: "idle" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const provider = PROVIDERS.find((p) => p.id === draft.provider)!;

  const pickProvider = (id: LlmProvider) => {
    const next = PROVIDERS.find((p) => p.id === id)!;
    setDraft((d) => ({
      ...d,
      provider: id,
      model: next.models[0] ?? d.model,
      apiKey: d.apiKey,
    }));
    setStatus({ kind: "idle" });
  };

  const testConnection = async () => {
    setStatus({ kind: "testing" });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "Reply with the single word: OK" },
          ],
          provider: draft.provider,
          model: draft.model,
          apiKey: draft.apiKey,
          baseUrl: draft.baseUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({
          kind: "error",
          text: (data.error as string) || `Failed (${res.status})`,
        });
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        setStatus({ kind: "error", text: "No stream received." });
        return;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (buffer.includes("data:")) {
          setStatus({
            kind: "ok",
            text: "Connected! The model responded successfully.",
          });
          return;
        }
      }
      setStatus({ kind: "error", text: "Connection seemed fine but produced no reply." });
    } catch (e) {
      setStatus({
        kind: "error",
        text: e instanceof Error ? e.message : "Connection failed.",
      });
    }
  };

  const inputCls =
    "w-full rounded-lg border border-line bg-abyss px-3 py-2.5 text-sm text-white placeholder:text-dim focus:border-accent/60 focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-panel shadow-2xl shadow-black/60 sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
              <Plug size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">
                Connect your AI
              </h2>
              <p className="text-[11px] text-dim">
                Bring your own key or use a local LLM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-accent/50 hover:text-accent"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-dim">
              Provider
            </label>
            <div className="mt-2 grid gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProvider(p.id)}
                  className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                    draft.provider === p.id
                      ? "border-accent/60 bg-accent/10"
                      : "border-line bg-abyss hover:border-accent/30"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      draft.provider === p.id
                        ? "border-accent bg-accent"
                        : "border-dim"
                    }`}
                  >
                    {draft.provider === p.id && (
                      <Check size={10} className="text-black" />
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">
                      {p.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {p.tagline}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-dim">
              Model
            </label>
            <input
              value={draft.model}
              onChange={(e) =>
                setDraft((d) => ({ ...d, model: e.target.value }))
              }
              placeholder={provider.models[0] || "model-name"}
              className={`${inputCls} mono mt-2`}
              list="llm-model-suggestions"
            />
            <datalist id="llm-model-suggestions">
              {provider.models.filter(Boolean).map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {provider.needsBaseUrl && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-dim">
                Server URL
              </label>
              <input
                value={draft.baseUrl}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, baseUrl: e.target.value }))
                }
                placeholder="http://localhost:11434"
                className={`${inputCls} mono mt-2`}
              />
              <p className="mt-1.5 text-[11px] text-dim">
                For Ollama this is where it listens (default{" "}
                <span className="mono">http://localhost:11434</span>). For custom
                endpoints use the base URL, e.g.{" "}
                <span className="mono">http://localhost:1234/v1</span> (LM
                Studio) or <span className="mono">https://api.groq.com/openai</span>.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-dim">
              API key
              {!provider.needsKey && " (optional)"}
            </label>
            <div className="relative mt-2">
              <input
                type={showKey ? "text" : "password"}
                value={draft.apiKey}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, apiKey: e.target.value }))
                }
                placeholder={
                  provider.needsKey ? "sk-…" : "Not needed for local"
                }
                autoComplete="off"
                className={`${inputCls} mono pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "Hide key" : "Show key"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim transition hover:text-white"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-dim">
              Stored only in your browser and sent per-request to the provider.
              Never saved on our servers.
            </p>
          </div>

          {status.kind === "error" && status.text && (
            <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
              ⚠️ {status.text}
            </p>
          )}
          {status.kind === "ok" && status.text && (
            <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
              ✓ {status.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={testConnection}
              disabled={status.kind === "testing"}
              className="flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/20 disabled:opacity-60"
            >
              {status.kind === "testing" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plug size={14} />
              )}
              {status.kind === "testing" ? "Testing…" : "Test connection"}
            </button>
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="btn-primary btn-shine rounded-lg px-5 py-2.5 text-sm font-semibold"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-line bg-abyss px-4 py-2.5 text-sm text-muted transition hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setDraft({
                  provider: "ollama",
                  model: "qwen3:8b",
                  baseUrl: "http://localhost:11434",
                  apiKey: "",
                });
              }}
              className="ml-auto flex items-center gap-1.5 text-xs text-dim transition hover:text-muted"
            >
              <RotateCcw size={12} /> Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}