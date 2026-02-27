import Link from "next/link";
import { ExternalLink, Github } from "lucide-react";

import { ScoreBadge } from "@/components/ScoreBadge";
import type { Tool } from "@/lib/types";

interface ToolHeroProps {
  tool: Tool;
}

export function ToolHero({ tool }: ToolHeroProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.16),transparent_40%)]" />
        <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-white/55">Preview</p>
        <div className="relative mt-6 grid h-[210px] place-items-center rounded-xl border border-white/10 bg-black/25">
          <p className="font-display text-4xl font-semibold text-white/75">{tool.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">
              {tool.categoryName}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
              {tool.name}
            </h1>
            <p className="mt-3 text-sm text-white/70">{tool.summary}</p>
          </div>
          <ScoreBadge score={tool.overallScore} size="md" />
        </div>

        <p className="mt-5 text-sm leading-7 text-white/75">{tool.description}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={tool.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/7 px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/25"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
          <Link
            href={tool.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/7 px-4 py-2.5 text-sm font-medium text-white transition hover:border-white/25"
          >
            <ExternalLink className="h-4 w-4" />
            Website
          </Link>
        </div>
      </div>
    </section>
  );
}
