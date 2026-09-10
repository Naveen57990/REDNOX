"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Wrench,
  Bot,
  BookOpen,
  Layers,
  Map as MapIcon,
  TerminalSquare,
  Shield,
  Menu,
  ArrowRight,
  X,
  Blocks,
  LibraryBig,
} from "lucide-react";
import { ThemePicker } from "./ThemePicker";

const NAV = [
  { href: "/explorer", label: "Explorer", Icon: Compass },
  { href: "/tools", label: "Tools", Icon: Wrench },
  { href: "/assistant", label: "AI Assistant", Icon: Bot },
  { href: "/learn", label: "Kali Learn", Icon: BookOpen },
  { href: "/guides", label: "Master Guides", Icon: LibraryBig },
  { href: "/wordlist", label: "Word Gen", Icon: Layers },
  { href: "/roadmap", label: "Road Map", Icon: MapIcon },
  { href: "/utilities", label: "Utilities", Icon: Blocks },
  { href: "/terminal", label: "Terminal", Icon: TerminalSquare },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-abyss/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent transition-all duration-300 group-hover:shadow-[0_0_22px_-4px_var(--accent-glow)]">
            <Shield size={18} strokeWidth={2.2} />
          </span>
          <span className="font-display text-[17px] font-bold tracking-tight text-white">
            CyberLab
            <span className="ml-1.5 rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent align-middle">
              AI
            </span>
          </span>
          <span className="font-hand hidden text-base text-dim transition-colors group-hover:text-accent xl:inline">
            everything in one place
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`link-underline flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive(href)
                  ? "active text-accent"
                  : "text-muted hover:bg-panel hover:text-white"
              }`}
            >
              <Icon size={16} className={isActive(href) ? "blink-soft" : ""} />
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <ThemePicker />
          {isActive("/") ? null : (
            <Link
              href="/explorer"
              className="group flex items-center gap-1.5 rounded-lg btn-primary px-4 py-2 text-sm font-semibold"
            >
              Get Started
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg xl:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-abyss px-4 pb-4 xl:hidden">
          <div className="flex flex-col gap-1 py-3">
            {NAV.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(href) ? "bg-accent/12 text-accent" : "text-muted hover:bg-panel hover:text-white"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
            <ThemePicker />
            <Link
              href="/explorer"
              onClick={() => setOpen(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold"
            >
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}