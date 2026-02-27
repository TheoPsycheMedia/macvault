import { FilterSidebar } from "@/components/FilterSidebar";
import { ToolCard } from "@/components/ToolCard";
import { listCategories, listTools } from "@/lib/repository";
import type { ToolSort } from "@/lib/types";

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

  const [categories, tools] = [
    listCategories(),
    listTools({
      category,
      search,
      minScore,
      sort,
      limit: 120,
    }),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-3xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-white">Browse Tools</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          Filter by category, score, and ranking signal to find Mac tools that match your setup.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          categories={categories}
          currentCategory={category}
          currentMinScore={minScore}
          currentSort={sort}
          currentSearch={search}
        />

        <div>
          <p className="mb-4 text-sm text-white/55">
            Showing <span className="font-semibold text-white">{tools.length}</span> results
          </p>

          {tools.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-8 text-center">
              <h2 className="font-display text-2xl font-semibold text-white">No tools matched</h2>
              <p className="mt-2 text-sm text-white/65">
                Try lowering minimum score or clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
