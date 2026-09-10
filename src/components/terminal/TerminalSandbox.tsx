"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { execute, type LineKind } from "@/lib/terminal/commands";
import { VirtualFS } from "@/lib/terminal/fs";

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

export function TerminalSandbox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fsRef = useRef(new VirtualFS());
  const cwdRef = useRef("/home/kali");
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily:
        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      theme: {
        background: "#070d09",
        foreground: "#d1e7d9",
        cursor: "#2ddf8e",
        selectionBackground: "#123524",
        brightGreen: "#2ddf8e",
      },
      scrollback: 5000,
    });
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

    term.onData((data) => {
      if (data === "\r") {
        term.write("\r\n");
        const raw = inputBuf.trim();
        inputBuf = "";
        if (raw) {
          historyRef.current.push(raw);
          historyIdxRef.current = historyRef.current.length;
          const res = execute(cwdRef.current, raw, fsRef.current, historyRef.current);
          if (res.clear) {
            term.clear();
          } else {
            vtermWrite(term, res.out);
            if (res.cwd) cwdRef.current = res.cwd;
          }
        }
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
      historyRef.current.push(cmd);
      historyIdxRef.current = historyRef.current.length;
      const res = execute(cwdRef.current, cmd, fsRef.current, historyRef.current);
      if (res.clear) term.clear();
      else {
        vtermWrite(term, res.out);
        if (res.cwd) cwdRef.current = res.cwd;
      }
      printPrompt();
    };
    window.addEventListener("gk-terminal-run", runCmd);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("gk-terminal-run", runCmd);
      ro.disconnect();
      container.removeEventListener("click", focus);
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} className="h-[520px] w-full overflow-hidden rounded-xl bg-[#070d09]" />;
}