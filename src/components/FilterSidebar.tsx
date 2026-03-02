"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  currentMinScore = 0,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchParamValue = searchParams.get("search") ?? "";
  const categoryValue = searchParams.get("category") ?? "all";
  const sortParam = searchParams.get("sort") ?? "score";
  const sortValue = sortOptions.some((option) => option.value === sortParam)
    ? (sortParam as ToolSort)
    : "score";

  const minScoreParam = Number(searchParams.get("minScore") ?? "0");
  const minScoreValue = Number.isFinite(minScoreParam) ? minScoreParam : 0;

  const [searchValue, setSearchValue] = useState(searchParamValue);
  const [sliderValue, setSliderValue] = useState(
    Number.isFinite(currentMinScore) ? currentMinScore : 0,
  );

  const pushWithParams = useCallback(
    (updateParams: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updateParams(params);
      const nextQuery = params.toString();
      router.push(nextQuery ? `/browse?${nextQuery}` : "/browse");
    },
    [router, searchParams],
  );

  useEffect(() => {
    setSearchValue(searchParamValue);
  }, [searchParamValue]);

  useEffect(() => {
    setSliderValue(minScoreValue);
  }, [minScoreValue]);

  useEffect(() => {
    const normalizedSearch = searchValue.trim();
    if (normalizedSearch === searchParamValue.trim()) {
      return;
    }

    const timeoutId = setTimeout(() => {
      pushWithParams((params) => {
        if (normalizedSearch) {
          params.set("search", normalizedSearch);
        } else {
          params.delete("search");
        }
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pushWithParams, searchParamValue, searchValue]);

  const onCategoryChange = useCallback(
    (nextCategory: string) => {
      if (nextCategory === categoryValue) {
        return;
      }

      pushWithParams((params) => {
        if (!nextCategory || nextCategory === "all") {
          params.delete("category");
        } else {
          params.set("category", nextCategory);
        }
      });
    },
    [categoryValue, pushWithParams],
  );

  const onMinScoreChange = useCallback(
    (nextMinScore: number) => {
      setSliderValue(nextMinScore);
      if (Math.abs(nextMinScore - minScoreValue) < 0.001) {
        return;
      }

      pushWithParams((params) => {
        if (nextMinScore <= 0) {
          params.delete("minScore");
        } else {
          params.set("minScore", nextMinScore.toFixed(1));
        }
      });
    },
    [minScoreValue, pushWithParams],
  );

  const onSortChange = useCallback(
    (nextSort: ToolSort) => {
      if (nextSort === sortValue) {
        return;
      }

      pushWithParams((params) => {
        if (nextSort === "score") {
          params.delete("sort");
        } else {
          params.set("sort", nextSort);
        }
      });
    },
    [pushWithParams, sortValue],
  );

  const onReset = useCallback(() => {
    setSearchValue("");
    setSliderValue(0);
    router.push("/browse");
  }, [router]);

  return (
    <aside className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 lg:sticky lg:top-24">
      <h2 className="text-[24px] font-medium tracking-[-0.01em] text-[color:var(--text)]">Filters</h2>

      <div className="mt-5 grid gap-5">
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
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
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
            value={categoryValue}
            onChange={(event) => onCategoryChange(event.target.value)}
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
            value={sliderValue}
            onChange={(event) => onMinScoreChange(Number(event.target.value))}
            className="w-full accent-[color:var(--accent)]"
          />
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{sliderValue.toFixed(1)} and up</p>
        </div>

        <div>
          <p className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Sort By
          </p>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSortChange(option.value)}
                className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-sm transition duration-300 ${
                  sortValue === option.value
                    ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                    : "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--bg-soft)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-[color:var(--text-muted)] underline decoration-[color:var(--border)] underline-offset-4 transition duration-300 hover:text-[color:var(--text)]"
          >
            Reset
          </button>
        </div>
      </div>
    </aside>
  );
}
