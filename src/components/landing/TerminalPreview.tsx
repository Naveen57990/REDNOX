"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT: { text: string; prompt?: boolean; out?: boolean }[] = [
  { text: "sudo nmap -sV -sC --script vuln target.co", prompt: true },
  { text: "Starting Nmap 7.94 ( https://nmap.org ) at 2026-09-08 17:00 UTC" },
  { text: "Nmap scan report for target.co (10.0.0.12)" },
  { text: "Host is up (0.0012s latency)." },
  { text: "PORT     STATE SERVICE     VERSION" },
  { text: "22/tcp   open  ssh         OpenSSH 9.2 (protocol 2.0)" },
  { text: "80/tcp   open  http        nginx 1.24.0" },
  { text: "443/tcp  open  ssl/http    nginx 1.24.0" },
  { text: "|_http-title: Target Corp Login", out: true },
  { text: "|_http-vuln-cve2021-44228: POTENTIALLY VULNERABLE", out: true },
  { text: "MAC Address: 08:00:27:2B:3F:91 (Oracle VirtualBox)" },
  { text: "", out: true },
  { text: "Nmap done: 1 IP address (1 host up) scanned in 2.41 seconds" },
];

export function TerminalPreview() {
  const [lineIdx, setLineIdx] = useState(0);
  const [typed, setTyped] = useState(0);
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      const current = SCRIPT[Math.min(lineIdx, SCRIPT.length)];
      if (!current) return;
      if (current.prompt) {
        if (typed < current.text.length) {
          setTyped((t) => t + 1);
        } else {
          setLineIdx((i) => i + 1);
          setTyped(0);
        }
      } else {
        // pause a beat on output lines, then advance
        if (tick.current % 3 === 0) {
          setLineIdx((i) => i + 1);
          setTyped(0);
          tick.current = 0;
        }
      }
      if (lineIdx >= SCRIPT.length) {
        setLineIdx(0);
        setTyped(0);
      }
    }, 90);
    return () => clearInterval(id);
  }, [lineIdx, typed]);

  const current = SCRIPT[Math.min(lineIdx, SCRIPT.length)];
  const typingLine = current?.prompt ? current.text.slice(0, typed) : "";

  return (
    <div className="scanline relative overflow-hidden rounded-xl border border-edge bg-[#0c121a] shadow-[0_30px_80px_-30px_rgba(45,223,142,0.25)]">
      <div className="flex items-center gap-2 border-b border-edge bg-panel px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose/70" />
        <span className="h-3 w-3 rounded-full bg-amber/70" />
        <span className="h-3 w-3 rounded-full bg-neon/70" />
        <span className="ml-3 mono text-xs text-dim">kali@openshell — bash</span>
      </div>
      <div className="mono p-5 text-[13px] leading-6 sm:p-6">
        {SCRIPT.slice(0, lineIdx).map((line, i) => (
          <p
            key={i}
            className={line.out ? "text-rose/90" : line.prompt ? "text-fg" : "text-mut"}
          >
            {line.prompt && <span className="text-neon">kali@gokali:</span>}
            {line.prompt && <span className="text-cyber">~$ </span>}
            {line.prompt ? line.text : line.text || "\u00A0"}
          </p>
        ))}
        <p className="text-fg">
          {current?.prompt && (
            <>
              <span className="text-neon">kali@gokali:</span>
              <span className="text-cyber">~$ </span>
            </>
          )}
          {typingLine}
          <span className="cursor-blink ml-0.5 inline-block h-4 w-[8px] translate-y-[3px] bg-neon" />
        </p>
      </div>
    </div>
  );
}