import Link from "next/link";

import type { Category, ToolSort } from "@/lib/types";

interface FilterSidebarProps {
  categories: Category[];
  currentCategory?: string;
  currentMinScore?: number;
  currentSort?: ToolSort;
  currentSearch?: string;
}

const sortOptions: Array<{ value: ToolSort; label: string }> = [
  { value: "score", label: "Top Score" },
  { value: "stars", label: "Most Stars" },
  { value: "recent", label: "Recently Added" },
  { value: "votes", label: "Most Votes" },
];

export function FilterSidebar({
  categories,
  currentCategory,
  currentMinScore = 0,
  currentSort = "score",
  currentSearch,
}: FilterSidebarProps) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5 lg:sticky lg:top-24">
      <h2 className="font-display text-xl font-semibold text-white">Filters</h2>

      <form className="mt-4 grid gap-4" action="/browse" method="get">
        <div>
          <label htmlFor="search" className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={currentSearch}
            placeholder="tool, feature, or keyword"
            className="h-10 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-cyan-300/60"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={currentCategory ?? "all"}
            className="h-10 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="minScore"
            className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50"
          >
            Minimum Score
          </label>
          <input
            id="minScore"
            name="minScore"
            type="range"
            min={0}
            max={10}
            step={0.1}
            defaultValue={currentMinScore}
            className="w-full accent-cyan-400"
          />
          <p className="mt-1 text-sm text-white/65">{currentMinScore.toFixed(1)}+</p>
        </div>

        <div>
          <label htmlFor="sort" className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/50">
            Sort By
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={currentSort}
            className="h-10 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 pt-1">
          <button
            type="submit"
            className="h-10 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 text-sm font-semibold text-slate-950 transition hover:brightness-105"
          >
            Apply filters
          </button>
          <Link
            href="/browse"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-sm font-medium text-white/80 transition hover:border-white/25"
          >
            Clear all
          </Link>
        </div>
      </form>
    </aside>
  );
}
