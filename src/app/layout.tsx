import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "CyberLab AI — Everything In One Place",
  description:
    "Learn cybersecurity, explore authorized tools, practice Linux concepts, follow structured roadmaps, and build skills in a safe environment.",
  keywords:
    "cybersecurity, Linux, Kali Linux, penetration testing, learning, wordlist generator, terminal sandbox, AI assistant, roadmap, CTF",
  openGraph: {
    title: "CyberLab AI — Everything In One Place",
    description:
      "Learn cybersecurity, explore tools, practice Linux, follow roadmaps, and build skills in a safe environment.",
  },
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("cyberlab-theme");var w=window.matchMedia("(prefers-color-scheme: dark)").matches;"undefined"===t&&(t="neon");document.documentElement.setAttribute("data-theme",t||"neon");}catch(e){document.documentElement.setAttribute("data-theme","neon");}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-abyss text-fg">
        <div className="grain" aria-hidden="true" />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}