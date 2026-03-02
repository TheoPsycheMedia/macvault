import type { CSSProperties } from "react";

import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterSidebar } from "@/components/FilterSidebar";
import { ToolCard } from "@/components/ToolCard";
import { listCategories, listTools } from "@/lib/repository";
import type { ToolSort } from "@/lib/types";

export const dynamic = "force-dynamic";

interface BrowsePageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minScore?: string;
    sort?: ToolSort;
  }>;
}

const allowedSorts: ToolSort[] = ["score", "stars", "recent", "votes"];

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;

  const sort = allowedSorts.includes(params.sort ?? "score")
    ? (params.sort as ToolSort)
    : "score";

  const minScoreValue = Number(params.minScore ?? "0");
  const minScore = Number.isFinite(minScoreValue) ? minScoreValue : 0;
  const category = params.category && params.category !== "all" ? params.category : undefined;
  const search = params.search?.trim() || undefined;

  const [categories, tools] = await Promise.all([
    listCategories(),
    listTools({
      category,
      search,
      minScore,
      sort,
      limit: 120,
    }),
  ]);

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section
        className="fade-in-section rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-10 md:px-10"
        style={{ "--fade-delay": "0.02s" } as CSSProperties}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Collection
        </p>
        <h1 className="mt-3 text-[48px] font-semibold leading-[1.03] tracking-[-0.02em] text-[color:var(--text)] md:text-[54px]">
          Browse Tools
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] text-[color:var(--text-muted)]">
          Filter by category, score, and ranking signal to find the right tools for your setup.
        </p>
      </section>

      <div
        className="fade-in-section mt-12 grid gap-8 lg:grid-cols-[300px_1fr]"
        style={{ "--fade-delay": "0.06s" } as CSSProperties}
      >
        <FilterSidebar
          categories={categories}
          currentCategory={category}
          currentMinScore={minScore}
          currentSort={sort}
          currentSearch={search}
        />

        <div>
          <ActiveFilters />

          <p className="mb-5 text-sm text-[color:var(--text-muted)]">
            Showing <span className="font-medium text-[color:var(--text)]">{tools.length}</span> results
          </p>

          {tools.length === 0 ? (
            <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center">
              <h2 className="text-[28px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
                No tools matched
              </h2>
              <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">
                Try lowering minimum score or clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
