import Link from "next/link";
import { CalendarClock, Star } from "lucide-react";

import { ScoreBadge } from "@/components/ScoreBadge";
import { VoteButtons } from "@/components/VoteButtons";
import type { Tool } from "@/lib/types";
import { formatCompactNumber, formatDate } from "@/lib/utils";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const screenshotUrl = tool.screenshotUrls[0];

  return (
    <article className="group overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_8px_18px_rgba(26,26,26,0.05)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg">
      <Link href={`/tools/${tool.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-[color:var(--border)]">
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt={`${tool.name} screenshot`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[color:var(--bg-soft)] px-6 text-center">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                  Curated Preview
                </p>
                <p className="mt-2 text-2xl font-medium tracking-[-0.02em] text-[color:var(--text)]">
                  {tool.name}
                </p>
              </div>
            </div>
          )}

          <span className="absolute left-4 top-4 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--text)]">
            {tool.subcategory}
          </span>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                {tool.categoryName}
              </p>
              <h3 className="mt-2 text-[20px] font-medium leading-tight tracking-[-0.01em] text-[color:var(--text)]">
                {tool.name}
              </h3>
            </div>
            <ScoreBadge score={tool.overallScore} size="sm" />
          </div>

          <p className="mt-3 line-clamp-1 text-[15px] text-[color:var(--text-muted)]">{tool.summary}</p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[color:var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              {formatCompactNumber(tool.starCount)} stars
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Updated {formatDate(tool.lastCommitDate)}
            </span>
          </div>
        </div>
      </Link>

      <div className="border-t border-[color:var(--border)] px-6 py-4">
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
