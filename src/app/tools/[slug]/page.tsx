import { CalendarClock, GitFork, Scale, Star, Vote } from "lucide-react";
import { notFound } from "next/navigation";

import { InstallCommand } from "@/components/InstallCommand";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { ToolCard } from "@/components/ToolCard";
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
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <ToolHero tool={tool} />

      <section className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5 md:grid-cols-5 md:items-center">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">GitHub Stars</p>
          <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-white">
            <Star className="h-4 w-4 text-amber-300" />
            {formatCompactNumber(tool.starCount)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">MacVault Score</p>
          <div className="mt-2">
            <ScoreBadge score={tool.overallScore} size="sm" />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Votes</p>
          <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-white">
            <Vote className="h-4 w-4 text-cyan-200" />
            {tool.voteCount}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">Last Updated</p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-white">
            <CalendarClock className="h-4 w-4 text-cyan-200" />
            {formatDate(tool.lastCommitDate)} ({formatRelativeDate(tool.lastCommitDate)})
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-white/45">License</p>
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-white">
            <Scale className="h-4 w-4 text-cyan-200" />
            {tool.license}
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
          <h2 className="font-display text-2xl font-semibold text-white">MacVault Review</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">{tool.summary}</p>
          <p className="mt-4 text-sm leading-7 text-white/70">{tool.description}</p>
          <div className="mt-5 flex items-center gap-4 text-sm text-white/55">
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-300" />
              {formatCompactNumber(tool.starCount)} stars
            </span>
            <span className="inline-flex items-center gap-2">
              <GitFork className="h-4 w-4 text-blue-300" />
              {formatCompactNumber(tool.forkCount)} forks
            </span>
          </div>
        </article>

        <div className="space-y-6">
          <InstallCommand
            brewCommand={tool.brewCommand}
            websiteUrl={tool.websiteUrl}
            installInstructions={tool.installInstructions}
          />
          <div className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5">
            <h3 className="font-display text-xl font-semibold text-white">Vote</h3>
            <p className="mt-2 text-sm text-white/65">Helpful tools rise faster with your feedback.</p>
            <div className="mt-4">
              <VoteButtons
                slug={tool.slug}
                initialUpvotes={tool.upvotes}
                initialDownvotes={tool.downvotes}
                initialVoteCount={tool.voteCount}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <ScoreBreakdown tool={tool} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white">Similar Tools</h2>
        <p className="mt-2 text-sm text-white/65">More tools in {tool.categoryName} worth trying.</p>

        {similarTools.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-6 text-sm text-white/70">
            No similar tools available yet.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {similarTools.map((item) => (
              <ToolCard key={item.id} tool={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
