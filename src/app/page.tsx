import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

export default function Home() {
  const featuredTools = listFeaturedTools(4);
  const trendingTools = listTrendingTools(6);
  const categoryList = listCategories();
  const recentlyAdded = listRecentTools(4);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="hero-gradient rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.88),rgba(30,41,59,0.76))] p-6 shadow-[0_25px_80px_rgba(2,6,23,0.35)] sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/75">MacVault</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Discover the best open-source Mac tools
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
          Curated, scored, and installation-ready. MacVault surfaces practical open-source apps
          that make macOS faster, cleaner, and more enjoyable.
        </p>
        <div className="mt-8 max-w-2xl">
          <SearchBar size="lg" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
          <span className="rounded-full border border-white/15 bg-white/7 px-3 py-1.5">
            16 curated tools
          </span>
          <span className="rounded-full border border-white/15 bg-white/7 px-3 py-1.5">
            Transparent scoring
          </span>
          <span className="rounded-full border border-white/15 bg-white/7 px-3 py-1.5">
            Homebrew-ready installs
          </span>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
              Featured Tools
            </h2>
            <p className="mt-1 text-sm text-white/65">Hand-picked standouts with strong momentum.</p>
          </div>
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex snap-x gap-4 overflow-x-auto pb-2">
          {featuredTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="group relative min-w-[290px] flex-1 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:border-white/20"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.15),transparent_40%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">{tool.categoryName}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-white">{tool.name}</h3>
                </div>
                <ScoreBadge score={tool.overallScore} size="sm" />
              </div>
              <p className="relative mt-4 line-clamp-3 text-sm leading-6 text-white/75">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
              Trending This Week
            </h2>
            <p className="mt-1 text-sm text-white/65">Most active projects by votes, score, and fresh updates.</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trendingTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white">Browse Categories</h2>
            <p className="mt-1 text-sm text-white/65">Explore tools by focus area and workflow style.</p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
          >
            All categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryList.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white">Recently Added</h2>
            <p className="mt-1 text-sm text-white/65">Latest tools added to the MacVault catalog.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {recentlyAdded.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <NewsletterSignup />
      </section>
    </div>
  );
}
