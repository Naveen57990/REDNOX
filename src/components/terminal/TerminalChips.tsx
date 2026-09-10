"use client";

const CHIPS = [
  ["sudo apt update", "refresh the (virtual) repos"],
  ["sudo apt install -y sqlmap", "installs sqlmap"],
  ["sqlmap -u http://target.co/login.php?id=1 --dbs", "practice SQLi on the lab"],
  ["sudo apt install -y hydra hashcat", "installs hydra + hashcat"],
  ["hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://target.co", "practice cred brute"],
  ["hashcat -m 0 /home/kali/hashes.md5 /usr/share/wordlists/rockyou.txt", "practice hash cracking"],
  ["gobuster dir -u http://target.co -w /usr/share/wordlists/dirb-common.txt", "practice dir busting"],
  ["nmap -sV -sC --script vuln target.co", "practice scanning the lab"],
  ["which nmap", "find an installed binary"],
  ["dpkg -l", "list (virtual) installed packages"],
  ["man nmap", "read the man page"],
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