import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

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

  const category = getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const sort = allowedSorts.includes(query.sort ?? "score")
    ? (query.sort as ToolSort)
    : "score";

  const minScoreValue = Number(query.minScore ?? "0");
  const minScore = Number.isFinite(minScoreValue) ? minScoreValue : 0;
  const search = query.search?.trim() || undefined;

  const tools = listTools({
    category: slug,
    sort,
    minScore,
    search,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to categories
      </Link>

      <section className="mt-4 rounded-3xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/75">Category</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white">
          {category.name}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/65">{category.description}</p>
      </section>

      <section className="mt-8">
        <p className="mb-4 text-sm text-white/55">
          {tools.length} tools in {category.name}
        </p>

        {tools.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-8 text-center">
            <h2 className="font-display text-2xl font-semibold text-white">No tools in this filter</h2>
            <p className="mt-2 text-sm text-white/65">Try reducing minimum score or removing search terms.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
