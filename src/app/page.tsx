import { ArrowRight, CalendarClock, Star } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { CategoryCard } from "@/components/CategoryCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SearchBar } from "@/components/SearchBar";
import { ToolCard } from "@/components/ToolCard";
import {
  listCategories,
  listFeaturedTools,
  listRecentTools,
  listTrendingTools,
} from "@/lib/repository";
import { formatCompactNumber, formatDate } from "@/lib/utils";

export default async function Home() {
  const [featuredTools, trendingTools, categoryList, recentlyAdded] = await Promise.all([
    listFeaturedTools(4),
    listTrendingTools(6),
    listCategories(),
    listRecentTools(4),
  ]);

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section
        className="fade-in-section rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-12 md:px-12"
        style={{ "--fade-delay": "0.02s" } as CSSProperties}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Curated Mac Software
        </p>
        <h1 className="mt-4 max-w-4xl text-[48px] font-semibold leading-[1.03] tracking-[-0.02em] text-[color:var(--text)] md:text-[56px]">
          Discover the best open-source Mac tools.
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] text-[color:var(--text-muted)]">
          MacVault is an editorial catalog for people who care about practical software quality,
          maintainability, and taste.
        </p>
        <div className="mt-8 max-w-3xl">
          <SearchBar size="lg" />
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-1.5 text-sm text-[color:var(--text-muted)]">
            52 curated tools
          </span>
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-1.5 text-sm text-[color:var(--text-muted)]">
            Transparent scoring
          </span>
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-1.5 text-sm text-[color:var(--text-muted)]">
            Homebrew-ready installs
          </span>
        </div>
      </section>

      <section
        className="fade-in-section mt-24"
        style={{ "--fade-delay": "0.05s" } as CSSProperties}
      >
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
              Featured Tools
            </h2>
            <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">
              Editorial picks with standout utility and polish.
            </p>
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--text-muted)] transition duration-300 hover:text-[color:var(--text)]"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {featuredTools.map((tool) => {
            const screenshotUrl = tool.screenshotUrls[0];

            return (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="group overflow-hidden rounded-[26px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_8px_20px_rgba(26,26,26,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <article className="grid h-full md:grid-cols-[3fr_2fr]">
                  <div className="relative min-h-[220px] border-b border-[color:var(--border)] bg-[color:var(--bg-soft)] md:border-b-0 md:border-r">
                    {screenshotUrl ? (
                      <img
                        src={screenshotUrl}
                        alt={`${tool.name} screenshot`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center px-6 text-center">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                            Editorial Preview
                          </p>
                          <p className="mt-2 text-3xl font-medium tracking-[-0.02em] text-[color:var(--text)]">
                            {tool.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between p-6">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                        {tool.categoryName}
                      </p>
                      <div className="mt-3 flex items-start justify-between gap-4">
                        <h3 className="text-[28px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
                          {tool.name}
                        </h3>
                        <ScoreBadge score={tool.overallScore} size="sm" />
                      </div>
                      <p className="mt-3 text-[15px] text-[color:var(--text-muted)]">{tool.summary}</p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4 text-xs text-[color:var(--text-muted)]">
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
                </article>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="fade-in-section mt-24"
        style={{ "--fade-delay": "0.08s" } as CSSProperties}
      >
        <div className="mb-7">
          <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
            Trending This Week
          </h2>
          <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">
            Most active projects by votes, score, and fresh updates.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trendingTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section
        className="fade-in-section mt-24"
        style={{ "--fade-delay": "0.1s" } as CSSProperties}
      >
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
              Browse Categories
            </h2>
            <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">
              Explore tools by workflow and specialization.
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--text-muted)] transition duration-300 hover:text-[color:var(--text)]"
          >
            All categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryList.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section
        className="fade-in-section mt-24"
        style={{ "--fade-delay": "0.12s" } as CSSProperties}
      >
        <div className="mb-7">
          <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
            Recently Added
          </h2>
          <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">
            New additions to the MacVault catalog.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {recentlyAdded.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section
        className="fade-in-section mt-24"
        style={{ "--fade-delay": "0.14s" } as CSSProperties}
      >
        <NewsletterSignup />
      </section>
    </div>
  );
}
