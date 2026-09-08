import { VirtualFS } from "./fs";

export type LineKind = "out" | "dim" | "ok" | "warn" | "err" | "cyan" | "title";

export interface Line {
  t: string;
  c?: LineKind;
}

export interface ExecResult {
  out: Line[];
  cwd?: string;
  clear?: boolean;
  running?: string[];
}

function splitArgs(input: string): string[] {
  const args: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) args.push(m[1] ?? m[2] ?? m[3]);
  return args;
}

function simNmap(target: string): Line[] {
  const ip = target === "localhost" ? "127.0.0.1" : target === "target.co" ? "10.0.0.12" : target;
  const safe =
    ip === "127.0.0.1" || ip === "localhost" || ip === "target.co" || ip === "10.0.0.12";
  if (!safe) {
    return [
      { t: "⚠ Sandbox: live scanning of that host is blocked for safety.", c: "warn" },
      { t: "Try: nmap target.co  (a simulated host we let you scan)", c: "dim" },
      { t: "Or ask the AI Assistant for scanning methodology.", c: "dim" },
    ];
  }
  return [
    { t: "Starting Nmap 7.94 ( https://nmap.org ) at 09 08 17:00 UTC", c: "dim" },
    { t: `Nmap scan report for ${target} (${ip === "localhost" ? "127.0.0.1" : ip})` },
    { t: "Host is up (0.0012s latency).", c: "dim" },
    { t: "PORT    STATE SERVICE VERSION" },
    { t: "22/tcp  open  ssh     OpenSSH 9.2p1", c: "ok" },
    { t: "80/tcp  open  http    nginx 1.24.0", c: "ok" },
    { t: "443/tcp open  ssl/http nginx 1.24.0", c: "ok" },
    { t: "|_http-title: Target Corp Login", c: "dim" },
    { t: "MAC Address: 08:00:27:2B:3F:91 (Oracle VirtualBox)", c: "dim" },
    { t: "", c: "dim" },
    { t: "Nmap done: 1 IP address (1 host up) scanned in 2.41 seconds", c: "dim" },
  ];
}

function simPing(target: string): Line[] {
  const safe = ["127.0.0.1", "localhost", "target.co", "10.0.0.12"].includes(target);
  if (!safe) {
    return [
      { t: `PING ${target} (blocked): sandbox does not allow live pings.`, c: "warn" },
      { t: "Try: ping target.co", c: "dim" },
    ];
  }
  const ip = target === "target.co" ? "10.0.0.12" : "127.0.0.1";
  return [
    { t: `PING ${target} (${ip}) 56(84) bytes of data.`, c: "dim" },
    { t: `64 bytes from ${ip}: icmp_seq=1 ttl=64 time=0.412 ms`, c: "ok" },
    { t: `64 bytes from ${ip}: icmp_seq=2 ttl=64 time=0.361 ms`, c: "ok" },
    { t: `64 bytes from ${ip}: icmp_seq=3 ttl=64 time=0.387 ms`, c: "ok" },
    { t: `--- ${target} ping statistics ---`, c: "dim" },
    { t: "3 packets transmitted, 3 received, 0% packet loss", c: "dim" },
  ];
}

export function execute(
  cwd: string,
  rawLine: string,
  fs: VirtualFS,
  history: string[],
): ExecResult {
  const original = rawLine.trim();
  if (!original) return { out: [] };

  let elevated = false;
  let line = original;
  if (line.startsWith("sudo ")) {
    elevated = true;
    line = line.slice(5).trim();
    if (/^rm\s+-rf\s+\/?$/.test(line) || line === "rm -rf /") {
      return {
        out: [
          { t: "Nice try. This is a sandbox, not a kamikaze drill 😄", c: "warn" },
          { t: "The / filesystem refuses to be deleted.", c: "dim" },
        ],
      };
    }
  }

  const args = splitArgs(line);
  const cmd = args.shift()?.toLowerCase() ?? "";
  const out: Line[] = [];
  const result: ExecResult = { out };

  const argFor = (i: number) => args[i] ?? "";

  switch (cmd) {
    case "clear":
      return { out: [], clear: true };

    case "help":
      out.push({ t: "GO KALI virtual terminal — available commands:", c: "title" });
      for (const [c, d] of [
        ["help", "show this help"],
        ["ls, cd, pwd, mkdir, touch, cat, echo, rm, cp, mv, tree", "filesystem"],
        ["whoami, id, hostname, uname, date, pwd", "system info"],
        ["neofetch, banner", "showcase output"],
        ["ifconfig / ip a", "network interfaces"],
        ["ping <host>", "simulated ping (localhost / target.co)"],
        ["nmap <host>", "simulated scan (localhost / target.co)"],
        ["history", "command history"],
        ["clear, exit", "session controls"],
        ["sudo ...", "simulate running as root"],
      ]) {
        out.push({ t: `  ${c.padEnd(28)} ${d}`, c: c.startsWith("sudo") ? "ok" : "dim" });
      }
      out.push({ t: "Live attacks are blocked. Use the AI Assistant for methodology.", c: "warn" });
      break;

    case "exit":
      out.push({ t: "(The sandbox has no exit. 😄 Use the nav bar to leave.)", c: "dim" });
      break;

    case "whoami":
      out.push({ t: elevated ? "root" : "kali" });
      break;

    case "id":
      out.push({
        t: elevated
          ? "uid=0(root) gid=0(root) groups=0(root)"
          : "uid=1000(kali) gid=1000(kali) groups=1000(kali),27(sudo)",
      });
      break;

    case "hostname":
      out.push({ t: "gokali" });
      break;

    case "uname":
      out.push({ t: args.includes("-a") ? "Linux gokali 6.1.0-kali9-amd64 #1 SMP x86_64 GNU/Linux" : "Linux" });
      break;

    case "date":
      out.push({ t: "Tue Sep  8 17:00:00 UTC 2026" });
      break;

    case "echo":
      out.push({ t: args.join(" ") || "" });
      break;

    case "pwd":
      out.push({ t: cwd });
      break;

    case "ls": {
      const target = argFor(0) ? fs.resolve(cwd + "/" + argFor(0)) : cwd;
      if (!fs.isDir(target)) {
        if (fs.isFile(target)) out.push({ t: fs.read(target) ?? "", c: "dim" });
        else out.push({ t: `ls: cannot access '${argFor(0)}': No such file or directory`, c: "err" });
        break;
      }
      const entries = fs.list(target);
      const detail = args.includes("-l") || args.includes("-la") || args.includes("-al");
      if (entries.length === 0) {
        out.push({ t: "(empty)" , c: "dim" });
      }
      for (const e of entries) {
        if (detail) {
          const perms = e.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
          out.push({ t: `${perms} kali kali ${String(e.type === "dir" ? 4096 : Math.min(4096, (fs.read(target + "/" + e.name)?.length ?? 0) * 3))} Sep  8 17:00  ${e.name}`, c: e.type === "dir" ? "cyan" : "out" });
        } else {
          out.push({ t: e.name, c: e.type === "dir" ? "cyan" : "out" });
        }
      }
      break;
    }

    case "cd": {
      const arg = argFor(0) || "~";
      const target = arg.startsWith("/")
        ? fs.resolve(arg)
        : arg === "~"
          ? fs.resolve("/home/kali")
          : fs.resolve(cwd + "/" + arg);
      if (!fs.isDir(target)) {
        out.push({ t: `cd: no such file or directory: ${arg}`, c: "err" });
        break;
      }
      result.cwd = target;
      break;
    }

    case "cat": {
      const target = argFor(0);
      if (!target) {
        out.push({ t: "cat: missing operand", c: "err" });
        break;
      }
      const content = fs.read(cwd + "/" + target);
      if (content === null) {
        out.push({ t: `cat: ${target}: No such file or directory`, c: "err" });
      } else {
        for (const line of content.split("\n")) out.push({ t: line });
      }
      break;
    }

    case "mkdir": {
      const target = argFor(0);
      if (!target) return { out: [{ t: "mkdir: missing operand", c: "err" }] };
      const err = fs.mkdir(cwd + "/" + target);
      if (err) out.push({ t: `mkdir: cannot create '${target}': ${err}`, c: "err" });
      break;
    }

    case "touch": {
      const target = argFor(0);
      if (!target) return { out: [{ t: "touch: missing operand", c: "err" }] };
      const err = fs.write(cwd + "/" + target, "");
      if (err) out.push({ t: `touch: ${err}`, c: "err" });
      break;
    }

    case "rm": {
      const target = argFor(0);
      if (!target) return { out: [{ t: "rm: missing operand", c: "err" }] };
      const err = fs.rm(cwd + "/" + target);
      if (err) out.push({ t: `rm: cannot remove '${target}': ${err}`, c: "err" });
      break;
    }

    case "cp":
    case "mv": {
      const src = argFor(0);
      const dst = argFor(1);
      if (!src || !dst) {
        out.push({ t: `${cmd}: expected src and dst`, c: "err" });
        break;
      }
      const content = fs.read(cwd + "/" + src);
      if (content === null) {
        out.push({ t: `${cmd}: '${src}': No such file`, c: "err" });
        break;
      }
      const err = fs.write(cwd + "/" + dst, content);
      if (err) out.push({ t: `${cmd}: ${err}`, c: "err" });
      else {
        if (cmd === "mv") fs.rm(cwd + "/" + src);
        out.push({ t: `${cmd}'d ${src} → ${dst}`, c: "ok" });
      }
      break;
    }

    case "tree": {
      const target = argFor(0) ? fs.resolve(cwd + "/" + argFor(0)) : cwd;
      const walk = (dir: string, prefix: string) => {
        if (prefix.length > 120) return;
        const entries = fs.list(dir);
        entries.forEach((e, i) => {
          const last = i === entries.length - 1;
          const branch = last ? "└── " : "├── ";
          out.push({
            t: prefix + branch + e.name,
            c: e.type === "dir" ? "cyan" : "out",
          });
          if (e.type === "dir") walk(dir + "/" + e.name, prefix + (last ? "    " : "│   "));
        });
      };
      walk(target, "");
      break;
    }

    case "neofetch":
      out.push(
        { t: "      ▄▄▄▄▄▄▄▄▄          kali@gokali", c: "ok" },
        { t: "    ████████████         -------------", c: "cyan" },
        { t: "   ██████████████▌      OS: Kali GNU/Linux Rolling", c: "ok" },
        { t: "  ▐███████████████▌     Kernel: 6.1.0-kali9-amd64", c: "dim" },
        { t: "  ▐███████▌ ██████▌     Shell: bash 5.2+", c: "dim" },
        { t: "   ███████ ▐█████▌      Terminal: xterm (sandbox)", c: "dim" },
        { t: "    ██████▌▐████▌       Uptime: 1 sky cycle", c: "dim" },
        { t: "      ▀▀▀▀▀▀▀███▀      Learning: 100% free forever", c: "warn" },
      );
      break;

    case "banner":
      out.push(
        { t: "", c: "dim" },
        { t: "   ▄████  ▒█████   ██░ ██  ▄▄▄       ██▓     ██▓", c: "ok" },
        { t: "  ██▒ ▀█▒▒██▒  ██▒▓██░ ██▒▒████▄    ▓██▒    ▓██▒", c: "ok" },
        { t: " ▒██░▄▄▄░▒██░  ██▒▒██▀▀██░▒██  ▀█▄  ▒██░    ▒██░", c: "ok" },
        { t: " ░▓█  ██▓▒██   ██░░▓█ ░██ ░██▄▄▄▄██ ▒██░    ▒██░", c: "ok" },
        { t: " ░▒▓███▀▒░ ████▓▒░░▓█▒░██▓ ▓█   ▓██▒░██████▒░██████▒", c: "ok" },
        { t: "  ░▒   ▒ ░ ▒░▒░▒░  ░ ▒░ ▒ ▒  ▒▒   ▓▒█░░ ▒░▒░▒░ ░ ▒░▒░▒░", c: "ok" },
        { t: "   ░   ░   ░ ▒ ▒░    ░ ░░ ░ ▒   ▒   ▒▒ ░  ░ ▒ ▒░   ░ ▒ ▒░", c: "ok" },
        { t: "", c: "dim" },
        { t: "CYBERSECURITY COPILOT — FREE FOREVER", c: "title" },
      );
      break;

    case "ifconfig":
    case "ip": {
      if (cmd === "ip" && args[0] === "a") {
        out.push(
          { t: "1: lo: <LOOPBACK,UP> mtu 65536", c: "dim" },
          { t: "    inet 127.0.0.1/8 scope host lo", c: "ok" },
          { t: "2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500", c: "dim" },
          { t: "    inet 192.168.1.100/24 brd 192.168.1.255", c: "ok" },
          { t: "    ether 08:00:27:ab:cd:ef", c: "dim" },
        );
      } else {
        out.push(
          { t: "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500", c: "dim" },
          { t: "    inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255", c: "ok" },
          { t: "    ether 08:00:27:ab:cd:ef  txqueuelen 1000", c: "dim" },
          { t: "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536", c: "dim" },
          { t: "    inet 127.0.0.1  netmask 255.0.0.0", c: "ok" },
        );
      }
      break;
    }

    case "ping": {
      const target = argFor(0) || "localhost";
      out.push(...simPing(target));
      break;
    }

    case "nmap":
    case "masscan": {
      if (args.includes("--help") || args.includes("-h") || args.length === 0) {
        out.push(
          { t: `Usage: ${cmd} <target>   (we only allow localhost / target.co)`, c: "dim" },
          { t: "Examples:", c: "title" },
          { t: `  ${cmd} target.co`, c: "ok" },
          { t: `  ${cmd} localhost`, c: "ok" },
          { t: `  ${cmd} -sV -sC --script vuln target.co   (flags accepted)`, c: "ok" },
        );
        break;
      }
      const target = args.filter((a) => !a.startsWith("-"))[0] || "target.co";
      out.push(...simNmap(target));
      break;
    }

    case "hydra":
    case "aircrack-ng":
    case "sqlmap":
    case "msfconsole":
    case "msfvenom":
    case "hashcat":
    case "john":
    case "wpscan":
    case "nikto":
    case "gobuster":
    case "ffuf":
      out.push(
        { t: `⚠ ${cmd} performs live attacks and is blocked in the sandbox.`, c: "warn" },
        { t: "Why? This sandbox is safe-by-design — real attacks need real targets.", c: "dim" },
        { t: "Next steps:", c: "title" },
        { t: "  • Read the tool's page in the 600+ Tools database", c: "ok" },
        { t: "  • Ask the AI Assistant for exact commands and methodology", c: "ok" },
        { t: "  • Practice safely on HackTheBox / TryHackMe (free labs)", c: "ok" },
      );
      break;

    case "history":
      history.forEach((h, i) => out.push({ t: `  ${i + 1}  ${h}`, c: "dim" }));
      if (history.length === 0) out.push({ t: "(no history yet)", c: "dim" });
      break;

    case "sudo":
      out.push({ t: "usage: sudo <command>", c: "err" });
      break;

    case "":
      break;

    default:
      out.push(
        { t: `${cmd}: command not found (sandbox)`, c: "err" },
        { t: "Type 'help' for available commands.", c: "dim" },
      );
  }

  return result;
}