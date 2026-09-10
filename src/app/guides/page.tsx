import type { Metadata } from "next";
import Link from "next/link";
import { MASTER_GUIDES, getToolBySlug, TOOL_CATEGORIES } from "@/data/tools";
import { BookOpenText, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Master Guides — GO KALI",
  description:
    "Deep, in-depth 'become a master' walkthroughs for the most popular Kali Linux tools.",
};

export default function MasterGuidesIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mono text-xs text-dim">
        <Link href="/" className="transition-colors hover:text-accent">
          home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mut">master guides</span>
      </nav>

      <div className="mt-6">
        <p className="font-hand text-lg text-accent">
          go deep, master the tool
        </p>
        <h1 className="mt-1 text-3xl font-bold text-fg">
          Master Guides
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mut">
          Long-form, section-by-section guides for the tools that win
          engagements: theory, exact commands, detection &amp; defense, and the
          habits that separate script kids from craftsmen. Each guide is self
          contained — start fresh, finish knowing the tool.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MASTER_GUIDES.map((guide) => {
          const tool = getToolBySlug(guide.slug);
          const cat = TOOL_CATEGORIES.find((c) => c.id === tool?.cat);
          return (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="card-lift group flex flex-col rounded-xl border border-edge bg-panel p-5 transition-all duration-300 hover:border-accent/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="mono text-[11px] text-dim">
                  {cat ? `${cat.icon} ${cat.label}` : "guide"}
                </span>
                <span className="mono text-[11px] text-dim">
                  {guide.sections.length} sections
                </span>
              </div>
              <h2 className="mono mt-3 text-lg font-bold text-fg group-hover:text-accent">
                <span className="text-accent">$</span> {tool?.name ?? guide.slug}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-mut">
                {guide.tagline}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-transform duration-300 group-hover:translate-x-1">
                Read the master guide <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>

      <section className="g-border-soft fade-up mt-10 rounded-xl p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <BookOpenText size={16} className="text-accent" /> More guides coming
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-mut">
          New master guides land regularly. Want to see a specific tool covered
          in depth? Ask the{" "}
          <Link
            href="/assistant"
            className="text-accent underline-offset-2 transition-colors hover:underline"
          >
            AI Assistant
          </Link>{" "}
          while you work, or send feedback and it gets queued.
        </p>
      </section>
    </div>
  );
}