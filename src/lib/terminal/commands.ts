import { VirtualFS } from "./fs";
import type { Line, ExecResult } from "./types";
import {
  CATALOG,
  findPkg,
  pkgByBin,
  pkgInstalled,
  installedPkgs,
  missingDeps,
  type PkgDef,
} from "./packages";
import { runTool, pkgMan } from "./practice";

export type { Line, LineKind, ExecResult } from "./types";

function splitArgs(input: string): string[] {
  const args: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) args.push(m[1] ?? m[2] ?? m[3]);
  return args;
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

function aptNames(args: string[]): string[] {
  let started = false;
  const names: string[] = [];
  for (const a of args) {
    if (started) {
      if (a.startsWith("-")) continue;
      names.push(a);
    } else if (!a.startsWith("-")) {
      started = true;
    }
  }
  return names;
}

function installPkg(pkg: PkgDef, fs: VirtualFS): void {
  for (const b of pkg.bins) {
    if (!fs.hasBin(b)) fs.write("/usr/bin/" + b, "ELF\u0000");
  }
}

function removePkg(pkg: PkgDef, fs: VirtualFS): void {
  for (const b of pkg.bins) fs.rm("/usr/bin/" + b);
}

function aptOp(sub: string, args: string[], fs: VirtualFS, elevated: boolean, out: Line[]) {
  switch (sub) {
    case "update": {
      out.push(
        { t: "Hit:1 http://kali.download/kali kali-rolling InRelease", c: "dim" },
        { t: "Hit:2 http://kali.download/kali kali-rolling/main amd64 Packages", c: "dim" },
        { t: "Get:1 http://security.kali.org/kali-security kali-security InRelease 7,221 B", c: "dim" },
        { t: "Fetched 7,221 B in 1s (7,004 B/s)", c: "dim" },
        { t: "Reading package lists... Done", c: "ok" },
        { t: "Building dependency tree... Done", c: "dim" },
        { t: "All packages are up to date.", c: "ok" },
      );
      break;
    }
    case "install": {
      const names = aptNames(args);
      if (names.length === 0) {
        out.push({ t: "E: apt install requires a package name (e.g. sudo apt install nmap)", c: "err" });
        break;
      }
      if (!elevated) {
        out.push(
          { t: "E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)", c: "err" },
          { t: "E: Unable to acquire the dpkg frontend lock. You are not allowed to run 'apt install' as user kali.", c: "err" },
          { t: "Use:  sudo apt install <tool>", c: "ok" },
        );
        break;
      }
      const toInstall: PkgDef[] = [];
      const unknown: string[] = [];
      for (const n of names) {
        const p = findPkg(n);
        if (!p) unknown.push(n);
        else if (!pkgInstalled(p, fs)) toInstall.push(p);
      }
      for (const n of unknown) {
        out.push(
          { t: `E: Unable to locate package ${n}`, c: "err" },
          { t: "Try: apt search <keyword>  ·  or check the Tools database", c: "dim" },
        );
      }
      if (toInstall.length > 0) {
        const total = toInstall.reduce((a, p) => a + (parseInt(p.size, 10) || 0), 0);
        const totalInst = toInstall.reduce((a, p) => a + (parseFloat(p.installedSize) || 0), 0);
        out.push(
          { t: "Reading package lists... Done", c: "dim" },
          { t: "Building dependency tree... Done", c: "dim" },
          { t: "Reading state information... Done", c: "dim" },
          { t: "The following NEW packages will be installed:", c: "ok" },
        );
        for (const p of toInstall) {
          const extraDeps = missingDeps(p, fs);
          if (extraDeps.length > 0) out.push({ t: `  ${p.name}  ${extraDeps.join(", ")}`, c: "ok" });
          out.push({ t: `  ${p.name}`, c: "ok" });
        }
        out.push(
          { t: `0 upgraded, ${toInstall.length} newly installed, 0 to remove and 0 not upgraded.`, c: "dim" },
          { t: `Need to get ${total} kB of archives.`, c: "dim" },
          { t: `After this operation, ${totalInst % 1 === 0 ? totalInst : totalInst.toFixed(1)} MB of additional disk space will be used.`, c: "dim" },
        );
        for (const p of toInstall) {
          out.push(
            { t: `Get:1 http://kali.download/kali kali-rolling/main amd64 ${p.name} ${p.version} [${p.size}]`, c: "dim" },
            { t: `Unpacking ${p.name} (${p.version}) ...`, c: "dim" },
            { t: `Setting up ${p.name} (${p.version}) ...`, c: "ok" },
            { t: `Processing triggers for libc-bin (2.36-9+deb12u7) ...`, c: "dim" },
          );
          installPkg(p, fs);
        }
      } else if (unknown.length === 0) {
        out.push(
          { t: names.map((n) => `${n} is already the newest version.`).join(" "), c: "dim" },
          { t: "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.", c: "ok" },
        );
      }
      break;
    }
    case "remove":
    case "purge": {
      const names = aptNames(args);
      if (!elevated) {
        out.push({ t: `E: Unable to acquire the dpkg frontend lock — use sudo apt ${sub} <tool>`, c: "err" });
        break;
      }
      const toRemove: PkgDef[] = [];
      for (const n of names) {
        const p = findPkg(n);
        if (!p) out.push({ t: `E: Unable to locate package ${n}`, c: "err" });
        else if (pkgInstalled(p, fs)) toRemove.push(p);
        else out.push({ t: `Package '${n}' is not installed, so not removed`, c: "dim" });
      }
      for (const p of toRemove) {
        out.push(
          { t: `Reading package lists... Done`, c: "dim" },
          { t: `Removing ${p.name} (${p.version}) ...`, c: "dim" },
          { t: `Processing triggers for libc-bin (2.36-9+deb12u7) ...`, c: "dim" },
        );
        removePkg(p, fs);
      }
      break;
    }
    case "autoremove": {
      out.push(
        { t: "Reading package lists... Done", c: "dim" },
        { t: "Building dependency tree... Done", c: "dim" },
        { t: "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.", c: "ok" },
      );
      break;
    }
    case "upgrade": {
      out.push(
        { t: "Reading package lists... Done", c: "dim" },
        { t: "Building dependency tree... Done", c: "dim" },
        { t: "Calculating upgrade... Done", c: "dim" },
        { t: "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.", c: "ok" },
      );
      break;
    }
    case "list": {
      const onlyInstalled = args.includes("--installed");
      const names = args.filter((a) => !a.startsWith("-"));
      out.push({ t: "Listing... Done", c: "dim" });
      const pkgs = installedPkgs(fs);
      if (onlyInstalled) {
        if (pkgs.length === 0) out.push({ t: "(no tools installed yet — try: sudo apt install nmap)", c: "dim" });
        for (const p of pkgs) out.push({ t: `ii  ${p.name} ${p.version}  amd64 [installed,automatic] [${p.desc}]`, c: "ok" });
      } else {
        const filter = names[0] ? names[0].toLowerCase() : "";
        const rows = (filter ? CATALOG.filter((p) => p.name.includes(filter)) : CATALOG).slice(0, 30);
        for (const p of rows) {
          out.push({ t: `${p.name}/${p.section} ${p.version} amd64 ${pkgInstalled(p, fs) ? `[installed]` : ""}`, c: "out" });
        }
      }
      break;
    }
    case "search": {
      const q = aptNames(args)[0]?.toLowerCase() ?? "";
      if (!q) {
        out.push({ t: `Usage: apt search <keyword>`, c: "err" });
        break;
      }
      const found = CATALOG.filter((p) => p.name.includes(q) || p.desc.toLowerCase().includes(q));
      if (found.length === 0) {
        out.push({ t: `Sorting... Done`, c: "dim" });
        out.push({ t: `Full Text Search... Done`, c: "dim" });
        out.push({ t: `(no results for '${q}')`, c: "dim" });
      } else {
        out.push({ t: `Sorting... Done`, c: "dim" });
        out.push({ t: `Full Text Search... Done`, c: "dim" });
        for (const p of found) {
          out.push({ t: `${p.name}/${p.section} ${p.version} amd64`, c: "ok" });
          out.push({ t: `  ${p.desc}`, c: "dim" });
        }
      }
      break;
    }
    case "show": {
      const n = aptNames(args)[0] ?? "";
      const p = findPkg(n);
      if (!p) out.push({ t: `Package: ${n}`, c: "err" }, { t: `  no package found for '${n}'`, c: "err" });
      else {
        out.push(
          { t: `Package: ${p.name}`, c: "ok" },
          { t: `Version: ${p.version}`, c: "dim" },
          { t: `Section: ${p.section}`, c: "dim" },
          { t: `Installed-Size: ${p.installedSize}`, c: "dim" },
          { t: `Download-Size: ${p.size}`, c: "dim" },
          { t: `Depends: ${(p.deps ?? ["libc6 (>= 2.36)"]).join(", ")}`, c: "dim" },
          { t: `Homepage: https://tools.gokali.dev/${p.name}`, c: "dim" },
          { t: `Description: ${p.desc}`, c: "dim" },
        );
      }
      break;
    }
    default:
      out.push(
        { t: "apt 2.6.1 (amd64 print build)", c: "dim" },
        { t: "Usage: apt [options] command", c: "dim" },
        { t: "Common commands: update · install <pkg> · remove <pkg> · list · search <kw> · show <pkg>", c: "ok" },
      );
  }
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

  const redirMatch = /^([\s\S]+?)\s+(>>|>)\s*(\S+)$/.exec(line);
  let redir: { path: string; append: boolean } | null = null;
  if (redirMatch) {
    redir = { path: redirMatch[3], append: redirMatch[2] === ">>" };
    line = redirMatch[1].trim();
  }

  const args = splitArgs(line);
  const cmd = args.shift()?.toLowerCase() ?? "";
  const out: Line[] = [];
  const result: ExecResult = { out };

  const argFor = (i: number) => args[i] ?? "";
  const targetPath = (arg: string) =>
    arg.startsWith("/") ? fs.resolve(arg) : fs.resolve(cwd + "/" + arg);

  switch (cmd) {
    case "clear":
      return { out: [], clear: true };

    case "help":
      out.push({ t: "GO KALI virtual terminal — available commands:", c: "title" });
      for (const [c, d] of [
        ["help, clear, exit", "session controls"],
        ["ls, cd, pwd, mkdir, touch, cat, echo, rm, cp, mv, tree", "filesystem"],
        ["whoami, id, hostname, uname, date", "system info"],
        ["neofetch, banner", "showcase output"],
        ["ifconfig / ip a", "network interfaces"],
        ["ping, nmap, traceroute", "simulated lab network (target.co, db01.internal)"],
        ["sudo apt install <tool>", "virtually install (nmap, sqlmap, hydra, hashcat, …)"],
        ["dpkg -l · pip3 list · which <tool> · man <tool>", "package & tool info"],
        ["history", "command history"],
        ["sudo ...", "simulate running as root"],
      ]) {
        out.push({ t: `  ${c.padEnd(30)} ${d}`, c: c.startsWith("sudo") ? "ok" : "dim" });
      }
      out.push({ t: "Lab hosts: target.co (10.0.0.12) · db01.internal (10.0.0.5) · gitlab.internal · localhost", c: "warn" });
      out.push({ t: "Everything is simulated — nothing touches a real network or system.", c: "dim" });
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
      const rawArg = argFor(0);
      const target = rawArg
        ? rawArg.startsWith("/")
          ? fs.resolve(rawArg)
          : fs.resolve(cwd + "/" + rawArg)
        : cwd;
      if (!fs.isDir(target)) {
        if (fs.isFile(target)) out.push({ t: fs.read(target) ?? "", c: "dim" });
        else out.push({ t: `ls: cannot access '${rawArg}': No such file or directory`, c: "err" });
        break;
      }
      const entries = fs.list(target);
      const detail = args.includes("-l") || args.includes("-la") || args.includes("-al");
      if (entries.length === 0) {
        out.push({ t: "(empty)" , c: "dim" });
      }
      for (const e of entries) {
        if (detail) {
          const perms = e.type === "dir" ? "drwxr-xr-x" : "-rwxr-xr-x";
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
      const content = fs.read(targetPath(target));
      if (content === null) {
        out.push({ t: `cat: ${target}: No such file or directory`, c: "err" });
      } else if (content.startsWith("ELF")) {
        out.push({ t: `cat: ${target}: Input/output error (binary executable in the sandbox)`, c: "dim" });
        out.push({ t: "Tip: use 'ls -l' or 'which' — or read text files like /home/kali/hashes.md5", c: "cyan" });
      } else {
        for (const l of content.split("\n")) out.push({ t: l });
      }
      break;
    }

    case "mkdir": {
      const target = argFor(0);
      if (!target) return { out: [{ t: "mkdir: missing operand", c: "err" }] };
      const err = fs.mkdir(targetPath(target));
      if (err) out.push({ t: `mkdir: cannot create directory '${target}': ${err}`, c: "err" });
      break;
    }

    case "touch": {
      const target = argFor(0);
      if (!target) return { out: [{ t: "touch: missing operand", c: "err" }] };
      const err = fs.write(targetPath(target), "");
      if (err) out.push({ t: `touch: ${err}`, c: "err" });
      break;
    }

    case "rm": {
      const target = argFor(0);
      const force = args.includes("-rf") || args.includes("-f");
      if (!target) return { out: [{ t: "rm: missing operand", c: "err" }] };
      const err = fs.rm(targetPath(target));
      if (err && !force) out.push({ t: `rm: cannot remove '${target}': ${err}`, c: "err" });
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
      const content = fs.read(targetPath(src));
      if (content === null) {
        out.push({ t: `${cmd}: '${src}': No such file`, c: "err" });
        break;
      }
      const err = fs.write(targetPath(dst), content);
      if (err) out.push({ t: `${cmd}: ${err}`, c: "err" });
      else {
        if (cmd === "mv") fs.rm(targetPath(src));
        out.push({ t: `${cmd}'d ${src} → ${dst}`, c: "ok" });
      }
      break;
    }

    case "tree": {
      const target = argFor(0) ? targetPath(argFor(0)) : cwd;
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

    case "history":
      history.forEach((h, i) => out.push({ t: `  ${i + 1}  ${h}`, c: "dim" }));
      if (history.length === 0) out.push({ t: "(no history yet)", c: "dim" });
      break;

    case "apt":
    case "apt-get": {
      const sub = args.find((a) => !a.startsWith("-") && !a.startsWith(".")) ?? "";
      aptOp(sub, args, fs, elevated, out);
      break;
    }

    case "dpkg": {
      if (args[0] === "-l" || args[0] === "--list") {
        out.push({ t: "Desired=Unknown/Install/Remove/Purge/Hold", c: "dim" });
        out.push({ t: "| Status=Not/Inst/Conf-files/Unpackp/halF-conf/Half-inst/trig-aWait/Trig-pend", c: "dim" });
        out.push({ t: "|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)", c: "dim" });
        out.push({ t: "||/ Name                            Version          Architecture Description", c: "dim" });
        const rows: [string, string, string][] = [
          ["bash", "5.2.21-2kali1", "amd64"],
          ["coreutils", "9.4-1kali1", "amd64"],
          ["libc6", "2.36-9+deb12u7", "amd64"],
          ["kali-tools-top10", "2026.1", "all"],
          ["openssh-client", "1:9.6p1-1", "amd64"],
          ["curl", "8.6.0-1", "amd64"],
          ["wget", "1.21.4-2", "amd64"],
          ["git", "2.43.0-1", "amd64"],
          ["python3", "3.11.5-1", "amd64"],
          ["python3-pip", "23.2.1+dfsg", "amd64"],
          ["nmap", "7.94-1", "amd64"],
        ];
        for (const p of installedPkgs(fs)) {
          if (!rows.some((r) => r[0] === p.name)) rows.push([p.name, p.version, "amd64"]);
        }
        for (const [n, v, arch] of rows) {
          out.push({ t: `ii  ${n.padEnd(29)} ${v.padEnd(15)} ${arch.padEnd(10)} ${CATALOG.find((p) => p.name === n)?.desc ?? "essential tools"}`, c: "ok" });
        }
      } else if (args[0] === "-s" || args[0] === "--status") {
        const n = args[1] ?? "";
        const p = findPkg(n);
        const inst = p && pkgInstalled(p, fs);
        out.push(
          { t: `Package: ${n}`, c: "dim" },
          { t: `Status: ${inst ? "install ok installed" : "deinstall ok config-files"}`, c: inst ? "ok" : "err" },
          { t: `Version: ${p?.version ?? "1:unknown-1"}`, c: "dim" },
        );
      } else if (args[0] === "-L" || args[0] === "--listfiles") {
        const n = args[1] ?? "";
        const p = findPkg(n);
        if (!p) out.push({ t: `dpkg-query: no packages found matching ${n}`, c: "err" });
        else {
          out.push({ t: `/usr/bin/${p.bins.join("\n/usr/bin/")}`, c: "dim" });
          out.push({ t: `/usr/share/doc/${p.name}`, c: "dim" });
          out.push({ t: `/usr/share/man/man1/${p.bins[0]}.1.gz`, c: "dim" });
        }
      } else {
        out.push(
          { t: "usage: dpkg -l | -s <pkg> | -L <pkg>", c: "dim" },
          { t: "  -l  list installed packages · -s status · -L installed files", c: "ok" },
        );
      }
      break;
    }

    case "pip":
    case "pip3": {
      const sub = argFor(0);
      if (sub === "install") {
        const pkgName = args.slice(1).find((a) => !a.startsWith("-"));
        if (!pkgName) out.push({ t: "ERROR: You must give at least one requirement to install", c: "err" });
        else if (!elevated) {
          out.push(
            { t: `error: externally-managed-environment`, c: "err" },
            { t: `Hint: use 'sudo pip3 install ${pkgName}' in the sandbox.`, c: "ok" },
          );
        } else {
          const ver = "x.y.z";
          out.push(
            { t: `Collecting ${pkgName}`, c: "dim" },
            { t: `  Downloading ${pkgName}-${ver}-py3-none-any.whl (2.4 MB)`, c: "dim" },
            { t: `Installing collected packages: ${pkgName}`, c: "dim" },
            { t: `Successfully installed ${pkgName}-${ver}`, c: "ok" },
            { t: "(virtual) packages install locally — they do not affect your real machine.", c: "dim" },
          );
        }
      } else if (sub === "list") {
        out.push({ t: "Package    Version", c: "dim" });
        for (const p of [["pip", "23.2.1"], ["requests", "2.31.0"], ["setuptools", "68.1.2"], ["sqlmap", "1.7.2"]]) {
          out.push({ t: p[0].padEnd(11) + p[1], c: "ok" });
        }
      } else if (sub === "--version") {
        out.push({ t: "pip 23.2.1 from /usr/lib/python3/dist-packages/pip (python 3.11)", c: "ok" });
      } else {
        out.push(
          { t: "Usage: pip3 install <pkg> | list | --version", c: "dim" },
          { t: "Python package manager (virtual).", c: "ok" },
        );
      }
      break;
    }

    case "which": {
      const targets = args.filter((a) => !a.startsWith("-"));
      for (const t of targets) {
        if (fs.hasBin(t)) out.push({ t: `/usr/bin/${t}`, c: "ok" });
      }
      if (targets.length === 0) out.push({ t: "Usage: which <tool>", c: "err" });
      break;
    }

    case "whereis": {
      const t = args[0] ?? "";
      if (!t) out.push({ t: "Usage: whereis <tool>", c: "err" });
      else if (fs.hasBin(t)) {
        out.push({ t: `${t}: /usr/bin/${t} /usr/share/man/man1/${t}.1.gz`, c: "dim" });
      } else {
        out.push({ t: `${t}:`, c: "dim" });
      }
      break;
    }

    case "man": {
      const t = args[0] ?? "";
      const p = pkgByBin(t);
      if (!t) out.push({ t: "What manual page do you want?  For example, try 'man nmap'.", c: "err" });
      else if (p && !pkgInstalled(p, fs)) {
        out.push(
          { t: `No manual entry for ${t}`, c: "err" },
          { t: `Install ${p.name} first:  sudo apt install ${p.name}`, c: "ok" },
        );
      } else if (p) out.push(...pkgMan(p));
      else if (fs.hasBin(t)) {
        out.push(
          { t: `MAN(1)`, c: "dim" },
          { t: `NAME`, c: "title" },
          { t: `  ${t} - system utility (sandbox build)`, c: "dim" },
          { t: `SYNOPSIS`, c: "title" },
          { t: `  ${t} [options]`, c: "dim" },
          { t: `DESCRIPTION`, c: "title" },
          { t: `  See 'help' or ask the AI Assistant for usage.`, c: "dim" },
        );
      } else {
        out.push({ t: `No manual entry for ${t}`, c: "err" });
      }
      break;
    }

    case "sudo":
      out.push({ t: "usage: sudo <command>", c: "err" });
      break;

    default: {
      const sim = runTool(cmd, args, fs);
      if (sim) {
        out.push(...sim);
        break;
      }
      out.push(
        { t: `${cmd}: command not found (sandbox)`, c: "err" },
        { t: "Type 'help' for available commands.", c: "dim" },
        { t: "Want a tool? Try: apt search <keyword> · sudo apt install <tool>", c: "cyan" },
      );
    }
  }

  if (redir && out.length > 0) {
    const path = redir.path.startsWith("/") ? redir.path : cwd + "/" + redir.path;
    const text = out
      .map((l) => l.t)
      .filter((l) => l.trim() !== "")
      .join("\n");
    const err2 = fs.write(path, redir.append ? (fs.read(path) ?? "") + "\n" + text : text);
    if (!err2) out.push({ t: `▶ wrote: ${redir.path}`, c: "dim" });
  }

  return result;
}