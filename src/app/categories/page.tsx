import { CategoryCard } from "@/components/CategoryCard";
import { listCategories } from "@/lib/repository";

export default function CategoriesPage() {
  const categories = listCategories();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-white">Categories</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          Explore curated Mac tools grouped by workflow, from menu bar utilities to
          security-focused apps.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </section>
    </div>
  );
}
