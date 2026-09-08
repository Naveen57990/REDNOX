export interface VNode {
  type: "dir" | "file";
  content: string;
}

export class VirtualFS {
  private nodes = new Map<string, VNode>();

  constructor(seed?: Record<string, string>) {
    this.nodes.set("/", { type: "dir", content: "" });
    for (const d of [
      "/bin",
      "/etc",
      "/home",
      "/home/kali",
      "/home/kali/Desktop",
      "/home/kali/Documents",
      "/home/kali/Downloads",
      "/tmp",
      "/usr",
      "/usr/share",
      "/usr/share/wordlists",
      "/root",
      "/var",
      "/var/log",
      "/var/log/apache2",
      "/dev",
      "/etc/ssh",
      "/opt",
    ]) {
      this.nodes.set(d, { type: "dir", content: "" });
    }
    const files: Record<string, string> = {
      "/etc/passwd":
        "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nkali:x:1000:1000:Kali,,,:/home/kali:/bin/bash\nssh:x:105:65534::/run/sshd:/usr/sbin/nologin",
      "/etc/hostname": "gokali",
      "/etc/os-release":
        'PRETTY_NAME="Kali GNU/Linux Rolling"\nVERSION="2026.1"\nID=kali\nID_LIKE=debian',
      "/etc/hosts":
        "127.0.0.1\tlocalhost\n127.0.1.1\tgokali\n10.0.0.5\ttarget.co\n10.0.0.12\tdb01.internal",
      "/etc/resolv.conf": "nameserver 8.8.8.8\nnameserver 1.1.1.1",
      "/home/kali/notes.txt":
        "# Engagement notes\n\n- Target: target.co (10.0.0.12)\n- Scope: web app audit, authorized\n- Found: open ports 22, 80, 443\n- TODO: run nmap script vuln",
      "/home/kali/Desktop/README.txt":
        "Welcome to the GO KALI sandbox!\n\nThis is a SIMULATED Kali environment for learning.\nLive network attacks are blocked for safety.\n\nTry these:\n  help          list commands\n  neofetch      system info\n  nmap target.co\n  ls /usr/share/wordlists\n  cat /etc/passwd\n  sudo apt update",
      "/home/kali/.bashrc":
        '# ~/.bashrc: aliases\nPS1="\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\$ \\[\\033[00m\\]"\nalias ll="ls -la"\nalias hunt="ls -la | grep -i pass"',
      "/usr/share/wordlists/rockyou.txt":
        "letmein\npassword\nadmin123\nsunshine\niloveyou\nmonkey\n12345678\nqwerty\ndragon\nmaster\nthisisweak",
      "/var/log/apache2/access.log":
        '192.168.1.10 - - [08/Sep/2026:08:02:11 +0000] "GET /admin HTTP/1.1" 200 5432\n10.0.0.5 - - [08/Sep/2026:08:03:44 +0000] "GET /wp-login.php HTTP/1.1" 404 321\n192.168.1.10 - - [08/Sep/2026:08:05:02 +0000] "POST /login HTTP/1.1" 302 210',
      "/var/log/syslog":
        "Sep  8 08:01:00 gokali systemd[1]: Started OpenSSH.\nSep  8 08:04:13 gokali cron[512]: (root) CMD (/opt/backup.sh)",
      "/dev/null": "",
      "/etc/ssh/sshd_config":
        "# sshd_config (simulated)\nPermitRootLogin prohibit-password\nPasswordAuthentication yes\nPort 22",
      "/opt/backup.sh":
        "#!/bin/bash\n# daily backup job (simulated)\ntar czf /tmp/backup.tgz /var/www\nscp /tmp/backup.tgz backups@10.0.0.9:/srv/backups",
      "/tmp/flag.txt":
        "sandbox{L34RN-4ND-PR4CT1CE-4ND-BE-3TH1C4L}",
    };
    if (seed) Object.assign(files, seed);
    for (const [p, c] of Object.entries(files)) {
      this.nodes.set(p, { type: "file", content: c });
    }
  }

  resolve(path: string): string {
    // normalize: supports /home/kali, relative like ../x, ~
    const parts: string[] = [];
    for (const seg of path.split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") parts.pop();
      else parts.push(seg);
    }
    return "/" + parts.join("/");
  }

  getNode(path: string): VNode | undefined {
    const resolved = this.resolve(path);
    return this.nodes.get(resolved);
  }

  isDir(path: string): boolean {
    return this.nodes.get(this.resolve(path))?.type === "dir";
  }

  isFile(path: string): boolean {
    return this.nodes.get(this.resolve(path))?.type === "file";
  }

  exists(path: string): boolean {
    return this.nodes.has(this.resolve(path));
  }

  list(dirPath: string): { name: string; type: "dir" | "file" }[] {
    const d = this.resolve(dirPath);
    const out: { name: string; type: "dir" | "file" }[] = [];
    for (const [p, node] of this.nodes) {
      const parent = p.slice(0, p.lastIndexOf("/")) || "/";
      if (parent === d && p !== "/") {
        out.push({ name: p.slice(p.lastIndexOf("/") + 1), type: node.type });
      }
    }
    return out.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1,
    );
  }

  mkdir(path: string): string | null {
    const resolved = this.resolve(path);
    if (this.nodes.has(resolved)) return "already exists";
    const parent = resolved.slice(0, resolved.lastIndexOf("/")) || "/";
    if (!this.nodes.has(parent)) return "no such directory";
    this.nodes.set(resolved, { type: "dir", content: "" });
    return null;
  }

  write(path: string, content: string): string | null {
    const resolved = this.resolve(path);
    const parent = resolved.slice(0, resolved.lastIndexOf("/")) || "/";
    if (!this.nodes.has(parent)) return "no such directory";
    this.nodes.set(resolved, { type: "file", content });
    return null;
  }

  rm(path: string): string | null {
    const resolved = this.resolve(path);
    if (!this.nodes.has(resolved)) return "no such file or directory";
    if (resolved === "/") return "cannot remove root";
    this.nodes.delete(resolved);
    return null;
  }

  read(path: string): string | null {
    const n = this.nodes.get(this.resolve(path));
    if (!n) return null;
    if (n.type === "dir") return null;
    return n.content;
  }
}