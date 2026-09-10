import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MASTER_GUIDES,
  getMasterGuide,
  getToolBySlug,
  TOOL_CATEGORIES,
} from "@/data/tools";
import { GuideMarkdown } from "@/components/guides/GuideMarkdown";
import { ArrowLeft, ArrowRight, Sparkles, BookOpenText } from "lucide-react";

export function generateStaticParams() {
  return MASTER_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(
  props: PageProps<"/guides/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const guide = getMasterGuide(slug);
  if (!guide) return { title: "Guide not found — GO KALI" };
  const tool = getToolBySlug(slug);
  return {
    title: `${tool?.name ?? guide.slug} Master Guide — GO KALI`,
    description: `${guide.tagline} — a deep walkthrough.`,
  };
}

export default async function MasterGuidePage(props: PageProps<"/guides/[slug]">) {
  const { slug } = await props.params;
  const guide = getMasterGuide(slug);
  if (!guide) notFound();

  const tool = getToolBySlug(slug);
  const cat = TOOL_CATEGORIES.find((c) => c.id === tool?.cat);
  const idx = MASTER_GUIDES.findIndex((g) => g.slug === slug);
  const prev = idx > 0 ? MASTER_GUIDES[idx - 1] : undefined;
  const next = idx < MASTER_GUIDES.length - 1 ? MASTER_GUIDES[idx + 1] : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mono text-xs text-dim">
        <Link href="/guides" className="transition-colors hover:text-accent">
          master guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mut">{guide.slug}</span>
      </nav>

      <div className="g-border fade-up mt-6 rounded-xl p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mono text-2xl font-bold text-fg">
              <span className="text-accent">$</span>{" "}
              {tool?.name ?? guide.slug}
            </h1>
            <p className="mt-1.5 text-sm text-mut">{guide.tagline}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {cat && (
              <Link
                href={`/tools?cat=${cat.id}`}
                className="rounded-full border border-edge bg-panel2 px-3 py-1.5 text-xs text-mut transition-colors hover:border-accent/50 hover:text-accent"
              >
                {cat.icon} {cat.label}
              </Link>
            )}
            <span className="rounded-full border border-edge bg-panel2 px-3 py-1.5 text-[11px] text-dim">
              {guide.sections.length} sections
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {guide.sections.map((s, i) => (
            <a
              key={s.title}
              href={`#sec-${i}`}
              className="mono rounded border border-line bg-abyss px-2 py-1 text-[10.5px] text-dim transition-colors hover:border-accent/50 hover:text-accent"
            >
              {String(i + 1).padStart(2, "0")}
            </a>
          ))}
        </div>

        {tool && (
          <Link
            href={`/tools/${tool.slug}`}
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-accent underline-offset-2 transition-colors hover:underline"
          >
            View the {tool.name} tool page <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <section
        className="g-border-soft fade-up mt-5 rounded-xl p-5 sm:p-6"
        style={{ animationDelay: "0.06s" }}
      >
        <p className="font-hand flex items-center gap-2 text-lg text-accent">
          <Sparkles size={16} /> the guide
        </p>
        <div className="mt-2">
          <GuideMarkdown markdown={guide.intro} />
        </div>
      </section>

      {guide.sections.map((sec, i) => (
        <section
          id={`sec-${i}`}
          key={sec.title}
          className="fade-up mt-5 rounded-xl border border-edge bg-panel/60 p-5 sm:p-6"
          style={{ animationDelay: `${0.08 + i * 0.03}s` }}
        >
          <div className="flex items-start gap-3">
            <span className="mono mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-[12px] font-bold text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-fg">{sec.title}</h2>
              <div className="mt-2">
                <GuideMarkdown markdown={sec.md} />
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="fade-up mt-8 rounded-lg border border-accent/20 bg-accent/5 p-4" style={{ animationDelay: "0.2s" }}>
        <p className="flex items-center gap-2 text-xs font-semibold text-fg">
          <BookOpenText size={14} className="text-accent" /> Stuck mid-guide?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-mut">
          Paste a command, an error, or a flag into the{" "}
          <Link href="/assistant" className="text-accent underline-offset-2 transition-colors hover:underline">
            AI Assistant
          </Link>{" "}
          and it explains what&apos;s happening — no account needed.
        </p>
      </section>

      <nav className="mt-10 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/guides/${prev.slug}`}
            className="card-lift group rounded-xl border border-edge bg-panel p-4 transition-all duration-300 hover:border-accent/40"
          >
            <span className="flex items-center gap-1 text-[11px] text-dim">
              <ArrowLeft size={12} /> previous guide
            </span>
            <span className="mono mt-1 block text-sm font-semibold text-fg group-hover:text-accent">
              {(getToolBySlug(prev.slug)?.name ?? prev.slug)}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/guides/${next.slug}`}
            className="card-lift group rounded-xl border border-edge bg-panel p-4 text-right transition-all duration-300 hover:border-accent/40"
          >
            <span className="flex items-center justify-end gap-1 text-[11px] text-dim">
              next guide <ArrowRight size={12} />
            </span>
            <span className="mono mt-1 block text-sm font-semibold text-fg group-hover:text-accent">
              {(getToolBySlug(next.slug)?.name ?? next.slug)}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}