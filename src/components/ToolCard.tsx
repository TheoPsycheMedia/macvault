import Link from "next/link";
import { GitFork, Star } from "lucide-react";

import { ScoreBadge } from "@/components/ScoreBadge";
import { VoteButtons } from "@/components/VoteButtons";
import type { Tool } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-white/20">
      <Link href={`/tools/${tool.slug}`} className="block">
        <div className="relative h-44 overflow-hidden border-b border-white/8 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_40%)]" />
          <div className="absolute left-4 top-4 rounded-md border border-white/15 bg-black/25 px-2 py-1 text-xs font-medium text-white/70">
            {tool.subcategory}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight text-white">
                {tool.name}
              </h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">
                {tool.categoryName}
              </p>
            </div>
            <ScoreBadge score={tool.overallScore} size="sm" />
          </div>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/70">{tool.summary}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/55">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-300" />
              {formatCompactNumber(tool.starCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5 text-blue-300" />
              {formatCompactNumber(tool.forkCount)}
            </span>
          </div>
        </div>
      </Link>

      <div className="border-t border-white/8 px-5 py-3">
        <VoteButtons
          slug={tool.slug}
          initialUpvotes={tool.upvotes}
          initialDownvotes={tool.downvotes}
          initialVoteCount={tool.voteCount}
          compact
        />
      </div>
    </article>
  );
}
