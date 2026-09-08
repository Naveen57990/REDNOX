export type LlmProvider = "ollama" | "openrouter" | "openai" | "custom";

export interface LlmSettings {
  provider: LlmProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
}

export const DEFAULT_SETTINGS: LlmSettings = {
  provider: "ollama",
  model: "qwen3:8b",
  baseUrl: "http://localhost:11434",
  apiKey: "",
};

export const STORAGE_KEY = "cyberlab-llm";

export const PROVIDERS: {
  id: LlmProvider;
  label: string;
  tagline: string;
  needsKey: boolean;
  needsBaseUrl: boolean;
  models: string[];
}[] = [
  {
    id: "ollama",
    label: "Ollama (local)",
    tagline: "Free, private, runs on your machine — no key needed.",
    needsKey: false,
    needsBaseUrl: true,
    models: ["qwen3:8b", "llama3.2:3b", "llama3.1:8b", "mistral:7b", "gemma3:4b"],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    tagline: "One key for many free cloud models. Key from openrouter.ai.",
    needsKey: true,
    needsBaseUrl: false,
    models: [
      "google/gemini-2.0-flash-001:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-chat-v3-0324:free",
      "mistralai/mistral-small-3.1-24b-instruct:free",
      "openai/gpt-oss-120b:free",
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    tagline: "Bring your own OpenAI key (gpt-4o-mini is cheap).",
    needsKey: true,
    needsBaseUrl: false,
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  },
  {
    id: "custom",
    label: "Custom / OpenAI-compatible",
    tagline: "Any endpoint speaking OpenAI's API — LM Studio, Groq, Together, vLLM…",
    needsKey: false,
    needsBaseUrl: true,
    models: ["", "local-model", "llama-3.3-70b-versatile", "llama-3.1-70b-versatile"],
  },
];

export const PROVIDER_LABEL: Record<LlmProvider, string> = {
  ollama: "Ollama (local)",
  openrouter: "OpenRouter",
  openai: "OpenAI",
  custom: "Custom endpoint",
};

export function loadSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    /* ignore corrupt settings */
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: LlmSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage may be unavailable */
  }
}

export function resetSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Model id sent to /api/chat — strips any legacy "ollama/" prefix. */
export function normalizeModelId(model: string): string {
  return model.replace(/^ollama\//, "");
}