import type { CSSProperties } from "react";

import { CategoryCard } from "@/components/CategoryCard";
import { listCategories } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section
        className="fade-in-section rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-10 md:px-10"
        style={{ "--fade-delay": "0.02s" } as CSSProperties}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Taxonomy
        </p>
        <h1 className="mt-3 text-[48px] font-semibold tracking-[-0.02em] text-[color:var(--text)] md:text-[54px]">
          Categories
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] text-[color:var(--text-muted)]">
          Explore curated Mac tools grouped by workflow, from menu bar utilities to
          security-focused software.
        </p>
      </section>

      <section
        className="fade-in-section mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        style={{ "--fade-delay": "0.06s" } as CSSProperties}
      >
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </section>
    </div>
  );
}
