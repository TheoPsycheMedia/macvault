import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import { ToolCard } from "@/components/ToolCard";
import { getCategoryBySlug, listTools } from "@/lib/repository";
import type { ToolSort } from "@/lib/types";

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: ToolSort; minScore?: string; search?: string }>;
}

const allowedSorts: ToolSort[] = ["score", "stars", "recent", "votes"];

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const sort = allowedSorts.includes(query.sort ?? "score")
    ? (query.sort as ToolSort)
    : "score";

  const minScoreValue = Number(query.minScore ?? "0");
  const minScore = Number.isFinite(minScoreValue) ? minScoreValue : 0;
  const search = query.search?.trim() || undefined;

  const tools = await listTools({
    category: slug,
    sort,
    minScore,
    search,
  });

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 text-sm text-[color:var(--text-muted)] transition duration-300 hover:text-[color:var(--text)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to categories
      </Link>

      <section
        className="fade-in-section mt-5 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-10 md:px-10"
        style={{ "--fade-delay": "0.02s" } as CSSProperties}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Category
        </p>
        <h1 className="mt-3 text-[44px] font-semibold tracking-[-0.02em] text-[color:var(--text)] md:text-[52px]">
          {category.name}
        </h1>
        <p className="mt-3 max-w-3xl text-[16px] text-[color:var(--text-muted)]">{category.description}</p>
      </section>

      <section
        className="fade-in-section mt-10"
        style={{ "--fade-delay": "0.06s" } as CSSProperties}
      >
        <p className="mb-5 text-sm text-[color:var(--text-muted)]">
          {tools.length} tools in {category.name}
        </p>

        {tools.length === 0 ? (
          <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center">
            <h2 className="text-[28px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
              No tools in this filter
            </h2>
            <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">
              Try reducing minimum score or removing search terms.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
