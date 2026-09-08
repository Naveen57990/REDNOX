import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  TOOLS,
  TOOL_CATEGORIES,
  getToolBySlug,
  getToolsByCategory,
  type EnrichedTool,
} from "@/data/tools";
import { CopyButton } from "@/components/common/CopyButton";
import { ToolCard } from "@/components/tools/ToolCard";
import { StarRating } from "@/components/explorer/StarRating";
import {
  Star,
  Battery,
  MonitorSmartphone,
  Sparkles,
  BookOpenText,
} from "lucide-react";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  props: PageProps<"/tools/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool)
    return { title: "Tool not found — GO KALI" };
  return {
    title: `${tool.name} — ${tool.summary.slice(0, 60)} — GO KALI`,
    description: tool.summary,
  };
}

function DifficultyBadge({ tool }: { tool: EnrichedTool }) {
  const cls =
    tool.difficulty === "Beginner"
      ? "border-accent/40 bg-accent/10 text-accent"
      : tool.difficulty === "Intermediate"
        ? "border-warn/40 bg-warn/10 text-warn"
        : "border-red-400/40 bg-red-400/10 text-red-400";
  return <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{tool.difficulty}</span>;
}

export default async function ToolDetailPage(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;
  const tool: EnrichedTool | undefined = getToolBySlug(slug);
  if (!tool) notFound();

  const category = TOOL_CATEGORIES.find((c) => c.id === tool.cat);
  const related = getToolsByCategory(tool.cat)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mono text-xs text-dim">
        <Link href="/tools" className="transition-colors hover:text-accent">
          tools
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mut">{tool.slug}</span>
      </nav>

      <div className="g-border fade-up mt-6 rounded-xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mono text-2xl font-bold text-fg">
              <span className="text-accent">$</span> {tool.name}
            </h1>
            <p className="mt-2 text-sm text-mut">{tool.summary}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {category && (
              <Link
                href={`/tools?cat=${category.id}`}
                className="rounded-full border border-edge bg-panel2 px-3 py-1.5 text-xs text-mut transition-colors hover:border-accent/50 hover:text-accent"
              >
                {category.icon} {category.label}
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs">
          <DifficultyBadge tool={tool} />
          <span className="flex items-center gap-1.5 rounded border border-line bg-abyss px-2 py-0.5 text-[11px] text-mut">
            <MonitorSmartphone size={11} className="text-accent2" />
            {tool.platform}
          </span>
          {tool.featured && (
            <span className="flex items-center gap-1 rounded-full border border-amber/50 bg-amber/15 px-2 py-0.5 text-[11px] font-semibold text-amber">
              <Star size={10} className="fill-amber" /> Popular
            </span>
          )}
          <span className="flex items-center gap-1">
            <StarRating stars={tool.stars} size={12} />
          </span>
        </div>
      </div>

      {/* In plain English */}
      <section className="g-border-soft fade-up mt-4 rounded-xl p-5 sm:p-6" style={{ animationDelay: "0.06s" }}>
        <p className="font-hand flex items-center gap-2 text-lg text-accent">
          <Sparkles size={16} /> in plain english
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-mut">
          {tool.plainExplain}
        </p>
      </section>

      <div className="fade-up mt-4 grid gap-3 sm:grid-cols-2" style={{ animationDelay: "0.1s" }}>
        <div className="rounded-lg border border-edge bg-panel p-4 transition-all duration-300 hover:border-accent/40">
          <h2 className="mono text-[11px] uppercase tracking-widest text-dim">
            Install
          </h2>
          <div className="mt-2 flex items-start gap-2">
            <p className="mono min-w-0 flex-1 break-words text-sm text-cyber">
              {tool.install}
            </p>
            <CopyButton text={tool.install} />
          </div>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-4 transition-all duration-300 hover:border-accent/40">
          <h2 className="mono text-[11px] uppercase tracking-widest text-dim">
            Tags
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tool.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-panel2 px-2 py-1 text-[11px] text-mut transition-colors hover:text-accent"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {tool.commandExplains.length > 0 && (
        <section className="fade-up mt-8" style={{ animationDelay: "0.14s" }}>
          <div className="flex items-center gap-2">
            <BookOpenText size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-fg">
              {tool.commandExplains.length > 1
                ? "Commands — what each one does"
                : "Command — what it does"}
            </h2>
          </div>
          <p className="mt-1 text-xs text-dim">
            Every command below is explained in plain English. Start with the
            bold steps and read the notes before you run anything.
          </p>
          <div className="mt-4 space-y-3">
            {tool.commandExplains.map((spec, i) => (
              <div
                key={i}
                className="card-lift group rounded-lg border border-edge bg-panel p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-[11px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <code className="mono min-w-0 flex-1 break-words text-[13px] leading-relaxed text-accent/90">
                        {spec.cmd}
                      </code>
                      <CopyButton text={spec.cmd} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-mut">
                      <span className="mr-1 font-semibold text-fg">→</span>
                      {spec.explain}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-dim">
            ⚠️ Run tools only against systems you own or are authorized to
            test. Always confirm scope before scanning.
          </p>
        </section>
      )}

      <section className="fade-up mt-8 rounded-lg border border-accent/20 bg-accent/5 p-4" style={{ animationDelay: "0.18s" }}>
        <p className="flex items-center gap-2 text-xs font-semibold text-fg">
          <Battery size={14} className="text-accent" /> Stuck on an output or a
          flag?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-mut">
          Ask the{" "}
          <Link href="/assistant" className="text-accent underline-offset-2 transition-colors hover:underline">
            AI Assistant
          </Link>{" "}
          — paste any command or its output here and it explains the results,
          understands the flags, and helps you plan the next step.
        </p>
      </section>

      {related.length > 0 && (
        <div className="fade-up mt-12" style={{ animationDelay: "0.2s" }}>
          <h2 className="mb-4 text-lg font-semibold text-fg">
            Related {category?.label.toLowerCase() ?? "tools"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}