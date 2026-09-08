import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support — GO KALI",
  description: "Get help with GO KALI — free community support, docs and contact.",
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Contact & <span className="text-neon">Support</span>
        </h1>
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          Free product, free help. Here’s how to reach the GO KALI team and get
          unstuck fast.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        <div className="rounded-xl border border-line bg-panel p-5">
          <h2 className="text-lg font-semibold text-white">📬 Email support</h2>
          <p className="mt-2 text-sm text-muted">
            Write to me directly — I reply fast, usually within a day.
          </p>
          <a
            href="mailto:5799.nox@gmail.com"
            className="mt-2 inline-block font-mono text-sm text-neon transition-opacity hover:opacity-80 hover:underline"
          >
            5799.nox@gmail.com
          </a>
        </div>

        <div className="rounded-xl border border-line bg-panel p-5">
          <h2 className="text-lg font-semibold text-white">📸 Instagram</h2>
          <p className="mt-2 text-sm text-muted">
            DMs are open — drop an update request, bug report or question
            there.
          </p>
          <a
            href="https://www.instagram.com/_naveen_5799_/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-mono text-sm text-neon transition-opacity hover:opacity-80 hover:underline"
          >
            @_naveen_5799_
          </a>
        </div>

        <div className="rounded-xl border border-line bg-panel p-5">
          <h2 className="text-lg font-semibold text-white">💬 Community</h2>
          <p className="mt-2 text-sm text-muted">
            Join other learners. Share walkthroughs, ask questions, stay in the
            know about new free tools.
          </p>
          <p className="mt-3 text-xs text-dim">
            (Links to official Discord / Telegram appear here soon.)
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-5">
          <h2 className="text-lg font-semibold text-white">🛠️ FAQ</h2>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-white">Is it really free?</h3>
              <p className="mt-1 text-muted">
                Yes. The entire learning platform — tools, lessons, sandbox,
                AI assistant — is free forever.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Why does the AI assistant need a key?</h3>
              <p className="mt-1 text-muted">
                The app can run a local LLM (Ollama) with no key at all — just
                pick it in the assistant&apos;s settings. For cloud AI, you get to
                choose your own provider: bring a free key (OpenRouter, OpenAI,
                etc.) or point the app at any OpenAI-compatible endpoint. Your
                key is saved only in your own browser and is never stored on our
                servers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Can I practice real attacks?</h3>
              <p className="mt-1 text-muted">
                Not on your target — and you shouldn’t. Use the sandbox for CLI,
                and legal labs (HTB, TryHackMe, Metasploitable VMs) for real
                exploitation practice.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Do I need an account?</h3>
              <p className="mt-1 text-muted">
                No — everything works without logging in. If you add an AI key,
                it is saved privately in your browser (localStorage), not on an
                account. Accounts are only useful for tracking dashboard progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}