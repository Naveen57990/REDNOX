"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Trash2 } from "lucide-react";
import "@xterm/xterm/css/xterm.css";
import { execute, type LineKind } from "@/lib/terminal/commands";
import { VirtualFS } from "@/lib/terminal/fs";
import {
  TERMINAL_THEMES,
  loadThemeId,
  loadHistory,
  pushHistory,
  clearHistory,
  type TermTheme,
} from "@/lib/terminal/themes";

const ANSI: Record<LineKind, string> = {
  out: "\x1b[0m",
  dim: "\x1b[2m",
  ok: "\x1b[32m",
  warn: "\x1b[33m",
  err: "\x1b[31m",
  cyan: "\x1b[36m",
  title: "\x1b[1;32m",
};

function vtermWrite(term: Terminal, lines: { t: string; c?: LineKind }[]) {
  for (const l of lines) {
    term.write((l.c ? ANSI[l.c] : ANSI.out) + l.t + "\x1b[0m\r\n");
  }
}

function installedPackages(raw: string): string[] {
  const l = raw.trim();
  let m = l.match(/(?:^|\s)(?:sudo\s+)?apt(?:-get)?\s+install\s+(?:-y\s+)?([a-zA-Z0-9._+-]+)/);
  if (m) return [m[1]];
  m = l.match(/(?:^|\s)(?:sudo\s+)?pip(?:3)?\s+install\s+([a-zA-Z0-9._[\]-]+)/);
  if (m) return [m[1]];
  return [];
}

function publishRun(raw: string, cwd: string) {
  window.dispatchEvent(new CustomEvent("gk-terminal-ran", { detail: { raw, cwd } }));
  for (const pkg of installedPackages(raw)) {
    window.dispatchEvent(new CustomEvent("gk-tool-installed", { detail: { pkg } }));
  }
  pushHistory(raw);
}

export function TerminalSandbox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fsRef = useRef(new VirtualFS());
  const cwdRef = useRef("/home/kali");
  const termRef = useRef<Terminal | null>(null);
  const [theme, setTheme] = useState<TermTheme>(
    () => TERMINAL_THEMES.find((t) => t.id === loadThemeId()) ?? TERMINAL_THEMES[0],
  );
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(0);
  const bootTheme = useRef(theme.theme);

  useEffect(() => {
    historyRef.current = loadHistory();
    historyIdxRef.current = historyRef.current.length;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily:
        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      theme: bootTheme.current,
      scrollback: 5000,
    });
    termRef.current = term;
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    const resize = () => fit.fit();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const promptFor = (cwd: string) =>
      `\x1b[32mkali@gokali\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `;

    const printPrompt = () => term.write(promptFor(cwdRef.current));

    vtermWrite(term, [
      { t: "GO KALI — virtual Kali terminal (sandbox)", c: "title" },
      {
        t: "Install (virtually) and practice real tool workflows against a simulated lab.",
        c: "warn",
      },
      { t: "  sudo apt install -y sqlmap   →   sqlmap -u http://target.co/login.php?id=1 --dbs", c: "ok" },
      { t: "Lab hosts: target.co (10.0.0.12) · db01.internal (10.0.0.5) · localhost", c: "dim" },
      { t: "Type 'help' for commands. Everything here is simulated — never touches a real system.", c: "dim" },
      { t: "", c: "dim" },
    ]);
    printPrompt();

    let inputBuf = "";

    const runRaw = (raw: string) => {
      historyRef.current.push(raw);
      historyIdxRef.current = historyRef.current.length;
      publishRun(raw, cwdRef.current);
      const res = execute(cwdRef.current, raw, fsRef.current, historyRef.current);
      if (res.clear) {
        term.clear();
      } else {
        vtermWrite(term, res.out);
        if (res.cwd) cwdRef.current = res.cwd;
      }
    };

    term.onData((data) => {
      if (data === "\r") {
        term.write("\r\n");
        const raw = inputBuf.trim();
        inputBuf = "";
        if (raw) runRaw(raw);
        printPrompt();
      } else if (data === "\u007f") {
        if (inputBuf.length > 0) {
          inputBuf = inputBuf.slice(0, -1);
          term.write("\b \b");
        }
      } else if (data === "\u001b[A") {
        // up arrow
        if (historyIdxRef.current > 0) {
          historyIdxRef.current -= 1;
          const h = historyRef.current[historyIdxRef.current] ?? "";
          while (inputBuf.length > 0) {
            inputBuf = inputBuf.slice(0, -1);
            term.write("\b \b");
          }
          inputBuf = h;
          term.write("\x1b[0m" + h);
        }
      } else if (data === "\u001b[B") {
        // down arrow
        if (historyIdxRef.current < historyRef.current.length) {
          historyIdxRef.current += 1;
          const h = historyRef.current[historyIdxRef.current] ?? "";
          while (inputBuf.length > 0) {
            inputBuf = inputBuf.slice(0, -1);
            term.write("\b \b");
          }
          inputBuf = h;
          term.write("\x1b[0m" + h);
        }
      } else if (data === "\t") {
        // simple tab completion: ls-like completion fallback is skipped
      } else if (data.startsWith("\x01") || data.startsWith("\x05")) {
        // ctrl-a / ctrl-e: ignore for now
      } else if (data >= "\x20") {
        inputBuf += data;
        term.write(data);
      }
    });

    // focus on first click anywhere
    const focus = () => term.focus();
    container.addEventListener("click", focus);
    term.focus();

    // allow external "run this command" buttons
    const runCmd = (e: Event) => {
      const cmd = (e as CustomEvent).detail as string;
      if (!cmd) return;
      term.write("\r\n" + cmd + "\r\n");
      runRaw(cmd);
      printPrompt();
    };
    window.addEventListener("gk-terminal-run", runCmd);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("gk-terminal-run", runCmd);
      ro.disconnect();
      container.removeEventListener("click", focus);
      term.dispose();
      termRef.current = null;
    };
  }, []);

  function applyTheme(next: TermTheme) {
    setTheme(next);
    try {
      localStorage.setItem("cyberlab-terminal-theme", next.id);
    } catch {
      // ignore
    }
    if (termRef.current?.options) termRef.current.options.theme = next.theme;
  }

  function wipeHistory() {
    clearHistory();
    historyRef.current = [];
    historyIdxRef.current = 0;
  }

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-line/70 px-3 py-2">
        <select
          value={theme.id}
          onChange={(e) => {
            const next = TERMINAL_THEMES.find((t) => t.id === e.target.value) ?? TERMINAL_THEMES[0];
            applyTheme(next);
          }}
          aria-label="Terminal theme"
          className="rounded-lg border border-line bg-panel px-2.5 py-1 text-[11px] text-mut outline-none transition-colors hover:border-neon/40 focus:border-neon/50"
        >
          {TERMINAL_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="ml-2 hidden text-[10.5px] text-dim sm:inline">
          Theme saved — history syncs across visits (up arrow brings it back)
        </span>
        <button
          type="button"
          onClick={wipeHistory}
          title="Clear saved history"
          aria-label="Clear saved history"
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-line/60 px-2 py-1 text-[11px] text-mut transition-colors hover:border-rose/50 hover:text-rose"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear history
        </button>
      </div>
      <div
        ref={containerRef}
        className="h-[460px] w-full overflow-hidden"
        style={{ background: theme.bg }}
      />
    </div>
  );
}