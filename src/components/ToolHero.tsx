import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { ScoreBadge } from "@/components/ScoreBadge";
import type { Tool } from "@/lib/types";

interface ToolHeroProps {
  tool: Tool;
}

export function ToolHero({ tool }: ToolHeroProps) {
  const screenshotUrl = tool.screenshotUrls[0];

  return (
    <section className="fade-in-section" style={{ "--fade-delay": "0.02s" } as CSSProperties}>
      <div className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--card-shadow)]">
        <div className="relative aspect-[16/7] border-b border-[color:var(--border)] bg-[color:var(--bg-soft)]">
          {screenshotUrl ? (
            <img
              src={screenshotUrl}
              alt={`${tool.name} screenshot`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                  Tool Preview
                </p>
                <p className="mt-2 text-4xl font-medium tracking-[-0.02em] text-[color:var(--text)]">
                  {tool.name}
                </p>
              </div>
            </div>
          )}

          <span className="absolute left-6 top-6 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text)]">
            {tool.categoryName}
          </span>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:p-8">
          <div>
            <h1 className="text-[38px] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--text)] lg:text-[46px]">
              {tool.name}
            </h1>
            <p className="mt-3 text-[16px] text-[color:var(--text-muted)]">{tool.summary}</p>
            <p className="mt-4 text-[15px] text-[color:var(--text-muted)]">{tool.description}</p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <ScoreBadge score={tool.overallScore} size="lg" />
            <div className="flex flex-wrap gap-2">
              <Link
                href={tool.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text)] transition duration-300 hover:bg-[color:var(--bg-soft)]"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Link>
              <Link
                href={tool.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text)] transition duration-300 hover:bg-[color:var(--bg-soft)]"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
