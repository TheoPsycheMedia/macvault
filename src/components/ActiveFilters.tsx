"use client";

import { X } from "lucide-react";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ToolSort } from "@/lib/types";

const sortLabels: Record<ToolSort, string> = {
  score: "Top Score",
  stars: "Most Stars",
  recent: "Recently Added",
  votes: "Most Votes",
};

export function ActiveFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category");
  const search = searchParams.get("search")?.trim();
  const minScoreRaw = Number(searchParams.get("minScore") ?? "0");
  const minScore = Number.isFinite(minScoreRaw) ? minScoreRaw : 0;
  const sort = (searchParams.get("sort") ?? "score") as ToolSort;

  const chips: Array<{ key: "category" | "search" | "minScore" | "sort"; label: string }> = [];

  if (category && category !== "all") {
    chips.push({ key: "category", label: `Category: ${category}` });
  }

  if (search) {
    chips.push({ key: "search", label: `Search: ${search}` });
  }

  if (minScore > 0) {
    chips.push({ key: "minScore", label: `Min score: ${minScore.toFixed(1)}+` });
  }

  if (sort !== "score" && sort in sortLabels) {
    chips.push({ key: "sort", label: `Sort: ${sortLabels[sort]}` });
  }

  const onRemove = useCallback(
    (key: "category" | "search" | "minScore" | "sort") => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      const nextQuery = params.toString();
      router.push(nextQuery ? `/browse?${nextQuery}` : "/browse");
    },
    [router, searchParams],
  );

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-xs text-[color:var(--text)]"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[color:var(--text-muted)] transition duration-300 hover:text-[color:var(--text)]"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
