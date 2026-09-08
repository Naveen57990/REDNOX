"use client";

const CHIPS = [
  ["nmap target.co", "simulated port scan"],
  ["cat /etc/passwd", "read system files"],
  ["ls /usr/share/wordlists", "browse wordlists"],
  ["neofetch", "system showcase"],
  ["sudo apt update", "simulate as root"],
  ["tree /usr/share", "browse the tree"],
  ["ifconfig", "network info"],
  ["cat /tmp/flag.txt", "find the easter egg"],
] as const;

export function TerminalChips() {
  const run = (cmd: string) => {
    window.dispatchEvent(new CustomEvent("gk-terminal-run", { detail: cmd }));
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {CHIPS.map(([cmd, hint]) => (
        <button
          key={cmd}
          onClick={() => run(cmd)}
          className="group rounded-lg border border-line bg-panel px-4 py-3 text-left transition hover:border-neon/50 hover:bg-[#0d1511]"
        >
          <div className="font-mono text-sm text-neon">{cmd}</div>
          <div className="mt-0.5 text-xs text-muted">{hint}</div>
        </button>
      ))}
    </div>
  );
}