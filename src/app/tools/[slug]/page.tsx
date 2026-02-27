import { CalendarClock, Scale, Star, Vote } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";

import { InstallCommand } from "@/components/InstallCommand";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { ToolHero } from "@/components/ToolHero";
import { VoteButtons } from "@/components/VoteButtons";
import { getToolBySlug, listSimilarTools } from "@/lib/repository";
import { formatCompactNumber, formatDate, formatRelativeDate } from "@/lib/utils";

interface ToolDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const similarTools = listSimilarTools(tool, 3);

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <ToolHero tool={tool} />

      <section
        className="fade-in-section mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]"
        style={{ "--fade-delay": "0.06s" } as CSSProperties}
      >
        <article className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-7">
          <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
            MacVault Review
          </h2>
          <p className="mt-4 text-[16px] text-[color:var(--text-muted)]">{tool.summary}</p>
          <p className="mt-4 text-[15px] text-[color:var(--text-muted)]">{tool.description}</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-sm text-[color:var(--text-muted)]">
              <span className="block text-[11px] uppercase tracking-[0.15em]">GitHub Stars</span>
              <span className="mt-1 block text-[18px] font-medium text-[color:var(--text)]">
                {formatCompactNumber(tool.starCount)}
              </span>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-sm text-[color:var(--text-muted)]">
              <span className="block text-[11px] uppercase tracking-[0.15em]">Forks</span>
              <span className="mt-1 block text-[18px] font-medium text-[color:var(--text)]">
                {formatCompactNumber(tool.forkCount)}
              </span>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] p-5">
            <h3 className="text-[22px] font-medium tracking-[-0.01em] text-[color:var(--text)]">Vote</h3>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Helpful tools rise faster with community feedback.
            </p>
            <div className="mt-4">
              <VoteButtons
                slug={tool.slug}
                initialUpvotes={tool.upvotes}
                initialDownvotes={tool.downvotes}
                initialVoteCount={tool.voteCount}
              />
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <InstallCommand
            brewCommand={tool.brewCommand}
            websiteUrl={tool.websiteUrl}
            installInstructions={tool.installInstructions}
          />

          <section className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-[24px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
                Quick Stats
              </h3>
              <ScoreBadge score={tool.overallScore} size="sm" />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-2.5 text-[color:var(--text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Stars
                </span>
                <span className="font-medium text-[color:var(--text)]">
                  {formatCompactNumber(tool.starCount)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-2.5 text-[color:var(--text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <Vote className="h-4 w-4" />
                  Votes
                </span>
                <span className="font-medium text-[color:var(--text)]">{tool.voteCount}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-2.5 text-[color:var(--text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Last Updated
                </span>
                <span className="font-medium text-[color:var(--text)]">
                  {formatDate(tool.lastCommitDate)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-2.5 text-[color:var(--text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  License
                </span>
                <span className="font-medium text-[color:var(--text)]">{tool.license}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-[color:var(--text-muted)]">
              Updated {formatRelativeDate(tool.lastCommitDate)}
            </p>
          </section>

          <ScoreBreakdown tool={tool} />

          <section className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <h3 className="text-[24px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
              Similar Tools
            </h3>
            {similarTools.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">No similar tools available yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {similarTools.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/tools/${item.slug}`}
                      className="block rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 transition duration-300 hover:bg-[color:var(--surface)]"
                    >
                      <p className="text-sm font-medium text-[color:var(--text)]">{item.name}</p>
                      <p className="text-xs text-[color:var(--text-muted)]">{item.categoryName}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}
