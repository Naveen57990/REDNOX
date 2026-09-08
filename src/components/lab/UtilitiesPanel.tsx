"use client";

import { useMemo, useState } from "react";

// Compact MD5 implementation (public-domain style)
function md5(input: string): string {
  const s = unescape(encodeURIComponent(input));
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
  const bitlen = bytes.length * 8;
  const padded = [...bytes, 0x80];
  while (padded.length % 64 !== 56) padded.push(0);
  const buf = new DataView(new Uint8Array([...padded, 0, 0, 0, 0, 0, 0, 0, 0]).buffer);
  for (let i = 0; i < 2; i++) buf.setUint32(padded.length + i * 4, bitlen >>> (i * 32));

  const rot = (x: number, c: number) => (x << c) | (x >>> (32 - c));
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) & 0xffffffff);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let off = 0; off < buf.byteLength; off += 64) {
    const M = Array.from({ length: 16 }, (_, i) => buf.getUint32(off + i * 4, true));
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F = 0, g = 0;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) & 0xffffffff;
      A = D; D = C; C = B;
      B = (B + rot(F, S[i])) & 0xffffffff;
    }
    a0 = (a0 + A) & 0xffffffff; b0 = (b0 + B) & 0xffffffff;
    c0 = (c0 + C) & 0xffffffff; d0 = (d0 + D) & 0xffffffff;
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

const TABS = ["Hashes", "Hash ID", "Encode", "Subnet", "Bases"] as const;
type Tab = (typeof TABS)[number];

const PATTERNS: { name: string; test: (h: string) => boolean }[] = [
  { name: "MD5", test: (h) => /^[a-f0-9]{32}$/i.test(h) },
  { name: "SHA-1", test: (h) => /^[a-f0-9]{40}$/i.test(h) },
  { name: "SHA-256", test: (h) => /^[a-f0-9]{64}$/i.test(h) },
  { name: "SHA-512 / Whirlpool", test: (h) => /^[a-f0-9]{128}$/i.test(h) },
  { name: "SHA-384", test: (h) => /^[a-f0-9]{96}$/i.test(h) },
  { name: "SHA-224", test: (h) => /^[a-f0-9]{56}$/i.test(h) },
  { name: "MySQL 3.x", test: (h) => /^[a-f0-9]{16}$/i.test(h) },
  { name: "LM / NT hash", test: (h) => /^[a-f0-9]{32}$/i.test(h) && /[^a-f0-9]/i.test("") === false },
  { name: "bcrypt (likely)", test: (h) => h.startsWith("$2a$") || h.startsWith("$2b$") || h.startsWith("$2y$") },
  { name: "Argon2 (likely)", test: (h) => h.startsWith("$argon2") },
  { name: "SHA-512-crypt", test: (h) => h.startsWith("$6$") },
  { name: "SHA-256-crypt", test: (h) => h.startsWith("$5$") },
  { name: "MD5-crypt", test: (h) => h.startsWith("$1$") },
];

export function UtilitiesPanel() {
  const [tab, setTab] = useState<Tab>("Hashes");

  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="flex flex-wrap gap-2 border-b border-line p-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              tab === t
                ? "bg-neon font-semibold text-black"
                : "text-muted hover:bg-abyss hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-5">
        {tab === "Hashes" && <Hashes />}
        {tab === "Hash ID" && <HashId />}
        {tab === "Encode" && <Encode />}
        {tab === "Subnet" && <Subnet />}
        {tab === "Bases" && <Bases />}
      </div>
    </div>
  );
}

function Field({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        readOnly
        value={value}
        className={`mt-1 w-full rounded-lg border border-line bg-abyss px-3 py-2 text-sm text-neon outline-none ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function Hashes() {
  const [text, setText] = useState("gokali");
  const [salted, setSalted] = useState(false);
  const [salt, setSalt] = useState("salt");

  const input = salted ? `${text}${salt}` : text;
  const hashes = useMemo(() => {
    const base = md5(input);
    return {
      "MD5": base,
      "SHA-1": base.slice(0, 40),
      "SHA-256": base.slice(2, 2 + 64),
      "SHA-512": base.repeat(4).slice(0, 128),
    };
  }, [input]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs text-muted">Input text</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-abyss px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon/60"
        />
      </label>
      <div className="flex items-center gap-4 text-sm text-muted">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={salted} onChange={(e) => setSalted(e.target.checked)} className="accent-neon" />
          Prepend salt
        </label>
        {salted && (
          <input
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            className="rounded-lg border border-line bg-abyss px-3 py-1 font-mono text-sm text-white outline-none focus:border-neon/60"
          />
        )}
      </div>
      {Object.entries(hashes).map(([name, val]) => (
        <Field key={name} label={`${name} (${val.length} hex)`} value={val} />
      ))}
      <p className="text-xs text-muted">
        <span className="text-warn">Heads up:</span> SHA algorithms here are
        simulated for education. Use real tools (<span className="font-mono">openssl dgst</span>)
        for authentic values.
      </p>
    </div>
  );
}

function HashId() {
  const [hash, setHash] = useState("e99a18c428cb38d5f260853678922e03");
  const matches = PATTERNS.filter((p) => p.test(hash.trim()));
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs text-muted">Paste a hash</span>
        <input
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-abyss px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon/60"
        />
      </label>
      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="text-sm text-warn">No match — could be a custom or salted format.</p>
        ) : (
          matches.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-lg border border-line bg-abyss px-3 py-2 text-sm">
              <span className="text-white">{m.name}</span>
              <span className="text-neon">likely ✓</span>
            </div>
          ))
        )}
      </div>
      <p className="text-xs text-muted">
        Real-world tip: feed this to <span className="font-mono">hashcat --identify</span> or
        <span className="font-mono"> hashid</span> on Kali for precise detection.
      </p>
    </div>
  );
}

function Encode() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [type, setType] = useState<"base64" | "url">("base64");
  const [text, setText] = useState("hello gokali!");

  const result = useMemo(() => {
    try {
      if (mode === "encode") {
        return type === "base64" ? btoa(unescape(encodeURIComponent(text))) : encodeURIComponent(text);
      }
      return type === "base64" ? decodeURIComponent(escape(atob(text.trim()))) : decodeURIComponent(text);
    } catch {
      return "(invalid input for decode)";
    }
  }, [mode, type, text]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <select value={type} onChange={(e) => setType(e.target.value as "base64" | "url")} className="rounded-lg border border-line bg-abyss px-3 py-2 text-white outline-none">
          <option value="base64">Base64</option>
          <option value="url">URL encode</option>
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value as "encode" | "decode")} className="rounded-lg border border-line bg-abyss px-3 py-2 text-white outline-none">
          <option value="encode">Encode</option>
          <option value="decode">Decode</option>
        </select>
      </div>
      <label className="block">
        <span className="text-xs text-muted">{mode === "encode" ? "Plain text" : "Encoded text"}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-line bg-abyss px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon/60"
        />
      </label>
      <Field label="Output" value={result} />
    </div>
  );
}

function Subnet() {
  const [ip, setIp] = useState("192.168.1.0");
  const [cidr, setCidr] = useState("24");

  const calc = useMemo(() => {
    try {
      const mask = 0xffffffff << (32 - Number(cidr));
      const parts = ip.split(".").map(Number);
      if (parts.some((p) => isNaN(p) || p < 0 || p > 255)) throw new Error();
      const ipInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
      const network = ipInt & mask;
      const broadcast = network | ~mask >>> 0;
      const toIp = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
      const hosts = 2 ** (32 - Number(cidr)) - 2;
      return {
        network: toIp(network),
        broadcast: toIp(broadcast),
        netmask: toIp(mask),
        first: toIp(network + 1),
        last: toIp(broadcast - 1),
        hosts: hosts > 0 ? hosts : 0,
      };
    } catch {
      return null;
    }
  }, [ip, cidr]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex-1">
          <span className="text-xs text-muted">IP address</span>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-abyss px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon/60"
          />
        </label>
        <label className="w-28">
          <span className="text-xs text-muted">CIDR</span>
          <input
            value={cidr}
            onChange={(e) => setCidr(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-abyss px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon/60"
          />
        </label>
      </div>
      {calc ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Network" value={calc.network} />
          <Field label="Netmask" value={calc.netmask} />
          <Field label="Broadcast" value={calc.broadcast} />
          <Field label="Usable hosts" value={calc.hosts.toLocaleString()} mono={false} />
          <Field label="First usable" value={calc.first} />
          <Field label="Last usable" value={calc.last} />
        </div>
      ) : (
        <p className="text-sm text-warn">Invalid IP or CIDR.</p>
      )}
    </div>
  );
}

function Bases() {
  const [dec, setDec] = useState("255");
  const decVal = parseInt(dec, 10);
  const valid = !isNaN(decVal) && decVal >= 0;
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs text-muted">Decimal</span>
        <input
          value={dec}
          onChange={(e) => setDec(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-abyss px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon/60"
        />
      </label>
      {valid ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Hexadecimal" value={"0x" + decVal.toString(16)} />
          <Field label="Binary" value={decVal.toString(2)} />
          <Field label="Octal" value={"0o" + decVal.toString(8)} />
          <Field label="ASCII" value={decVal >= 32 && decVal <= 126 ? String.fromCharCode(decVal) : "(not printable)"} />
          <Field label="URL-encoded byte" value={decVal <= 255 ? "%" + decVal.toString(16).toUpperCase().padStart(2, "0") : "(>255)"} />
          <Field label="IP octet" value={decVal <= 255 ? `10.0.0.${decVal}` : "(>255)"} />
        </div>
      ) : (
        <p className="text-sm text-warn">Enter a positive integer.</p>
      )}
    </div>
  );
}