import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ATTACK_PLAYBOOKS, getAttackCategory, getAttackPlaybook } from "@/data/attacks";
import { getToolBySlug } from "@/data/tools";
import { GuideMarkdown } from "@/components/guides/GuideMarkdown";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Eye,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  UserRound,
} from "lucide-react";

export function generateStaticParams() {
  return ATTACK_PLAYBOOKS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/attacks/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const playbook = getAttackPlaybook(slug);
  if (!playbook) return { title: "Playbook not found — GO KALI" };
  return {
    title: `${playbook.title} — Attack Playbook`,
    description: `${playbook.summary} How it works, the tools used, and how to detect and defend against it.`,
  };
}

export default async function AttackPlaybookPage(
  props: PageProps<"/attacks/[slug]">,
) {
  const { slug } = await props.params;
  const playbook = getAttackPlaybook(slug);
  if (!playbook) notFound();

  const cat = getAttackCategory(playbook.category);
  const idx = ATTACK_PLAYBOOKS.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? ATTACK_PLAYBOOKS[idx - 1] : undefined;
  const next =
    idx < ATTACK_PLAYBOOKS.length - 1 ? ATTACK_PLAYBOOKS[idx + 1] : undefined;

  const knownTools = playbook.tools
    .map(getToolBySlug)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mono text-xs text-dim">
        <Link href="/attacks" className="transition-colors hover:text-accent">
          attack playbooks
        </Link>
        <span className="mx-2">/</span>
        <span className="text-mut">{playbook.slug}</span>
      </nav>

      <div className="g-border fade-up mt-6 rounded-xl p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-3xl">{playbook.icon}</span>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-fg">
              {playbook.title}
            </h1>
            <p className="mt-1.5 text-sm text-mut">{playbook.summary}</p>
          </div>
          <Link
            href={`/attacks#${cat.id}`}
            className="shrink-0 rounded-full border border-edge bg-panel2 px-3 py-1.5 text-xs text-accent transition-colors hover:border-accent/50"
          >
            {cat.id} · {cat.label}
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-edge bg-panel2/60 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-dim">
              <UserRound size={12} className="text-accent" /> Who it targets
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-mut">
              {playbook.target}
            </p>
          </div>
          <div className="rounded-lg border border-edge bg-panel2/60 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-dim">
              <Crosshair size={12} className="text-accent" /> What the attacker gains
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-mut">
              {playbook.impact}
            </p>
          </div>
        </div>

        {knownTools.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-semibold text-dim">Tools in this playbook</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {knownTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="mono rounded-full border border-edge bg-panel2 px-3 py-1 text-[11.5px] text-mut transition-colors hover:border-accent/50 hover:text-accent"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <section
        className="g-border-soft fade-up mt-5 rounded-xl p-5 sm:p-6"
        style={{ animationDelay: "0.06s" }}
      >
        <p className="font-hand flex items-center gap-2 text-lg text-accent">
          <Sparkles size={16} /> how the attack unfolds
        </p>
        <div className="mt-2">
          <GuideMarkdown markdown={playbook.introMd} />
        </div>
      </section>

      {playbook.steps.map((step, i) => {
        const stepTools = step.tools
          ? step.tools.map(getToolBySlug).filter((t): t is NonNullable<typeof t> => Boolean(t))
          : [];
        return (
          <section
            key={step.title}
            className="fade-up mt-5 rounded-xl border border-edge bg-panel/60 p-5 sm:p-6"
            style={{ animationDelay: `${0.08 + i * 0.03}s` }}
          >
            <div className="flex items-start gap-3">
              <span className="mono mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-[12px] font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
                  <TerminalSquare size={15} className="text-accent" />
                  {step.title}
                </h2>
                <div className="mt-2">
                  <GuideMarkdown markdown={step.md} />
                </div>
                {stepTools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {stepTools.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/tools/${t.slug}`}
                        className="mono rounded border border-line bg-abyss px-2 py-0.5 text-[10.5px] text-dim transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <section
        className="fade-up mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-5 sm:p-6"
        style={{ animationDelay: "0.18s" }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
          <Eye size={15} className="text-amber-300" /> How to detect it
        </h2>
        <div className="mt-2">
          <GuideMarkdown markdown={playbook.detectionMd} />
        </div>
      </section>

      <section
        className="fade-up mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5 sm:p-6"
        style={{ animationDelay: "0.22s" }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
          <ShieldCheck size={15} className="text-emerald-300" /> How to stop it
        </h2>
        <div className="mt-2">
          <GuideMarkdown markdown={playbook.defenseMd} />
        </div>
      </section>

      <nav className="mt-10 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/attacks/${prev.slug}`}
            className="card-lift group rounded-xl border border-edge bg-panel p-4 transition-all duration-300 hover:border-accent/40"
          >
            <span className="flex items-center gap-1 text-[11px] text-dim">
              <ArrowLeft size={12} /> previous playbook
            </span>
            <span className="mt-1 block text-sm font-semibold text-fg group-hover:text-accent">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/attacks/${next.slug}`}
            className="card-lift group rounded-xl border border-edge bg-panel p-4 text-right transition-all duration-300 hover:border-accent/40"
          >
            <span className="flex items-center justify-end gap-1 text-[11px] text-dim">
              next playbook <ArrowRight size={12} />
            </span>
            <span className="mt-1 block text-sm font-semibold text-fg group-hover:text-accent">
              {next.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}