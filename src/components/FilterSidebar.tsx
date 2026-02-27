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
    <aside className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 lg:sticky lg:top-24">
      <h2 className="text-[24px] font-medium tracking-[-0.01em] text-[color:var(--text)]">Filters</h2>

      <form className="mt-5 grid gap-5" action="/browse" method="get">
        <div>
          <label
            htmlFor="search"
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]"
          >
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={currentSearch}
            placeholder="Tool, feature, or keyword"
            className="h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] outline-none transition duration-300 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={currentCategory ?? "all"}
            className="h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text)] outline-none transition duration-300 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
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
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]"
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
            className="w-full accent-[color:var(--accent)]"
          />
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{currentMinScore.toFixed(1)} and up</p>
        </div>

        <div>
          <label
            htmlFor="sort"
            className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]"
          >
            Sort By
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={currentSort}
            className="h-11 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm text-[color:var(--text)] outline-none transition duration-300 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
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
            className="h-11 rounded-full bg-[color:var(--accent)] text-sm font-medium text-[color:var(--accent-contrast)] transition duration-300 hover:opacity-90"
          >
            Apply Filters
          </button>
          <Link
            href="/browse"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--text-muted)] transition duration-300 hover:text-[color:var(--text)]"
          >
            Clear All
          </Link>
        </div>
      </form>
    </aside>
  );
}
