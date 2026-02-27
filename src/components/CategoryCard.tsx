import Link from "next/link";

import type { Category } from "@/lib/types";
import { getIconByName } from "@/lib/icons";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = getIconByName(category.icon);

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition hover:-translate-y-1 hover:border-white/20"
    >
      <div className="mb-4 inline-flex rounded-xl border border-white/15 bg-white/6 p-2.5 text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{category.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-white/65">{category.description}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-white/45">
        {category.toolCount} tools
      </p>
    </Link>
  );
}
