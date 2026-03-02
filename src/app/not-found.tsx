import Link from "next/link";

export default function NotFound() {
  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section className="fade-in-section rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-14 md:px-12 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          404 · MacVault
        </p>
        <h1 className="mt-4 max-w-3xl text-[44px] font-semibold leading-[1.03] tracking-[-0.02em] text-[color:var(--text)] md:text-[56px]">
          Page not found on MacVault.
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] text-[color:var(--text-muted)]">
          Sorry, we couldn&apos;t find that page. Head back to the home page to continue exploring
          curated Mac tools.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--accent)] px-6 text-sm font-medium text-[color:var(--accent-contrast)] transition duration-300 hover:opacity-90"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
