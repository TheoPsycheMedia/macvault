import Link from "next/link";

import { getIconByName } from "@/lib/icons";
import type { Category } from "@/lib/types";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = getIconByName(category.icon);

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_6px_16px_rgba(26,26,26,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] text-[color:var(--text-muted)] transition duration-300 group-hover:text-[color:var(--text)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-[20px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
        {category.name}
      </h3>
      <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">{category.description}</p>
      <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        {category.toolCount} tools
      </p>
    </Link>
  );
}
