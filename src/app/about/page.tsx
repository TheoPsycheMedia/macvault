const scoringDimensions = [
  "Functionality",
  "Usefulness",
  "Visual Quality",
  "Install Ease",
  "Maintenance Health",
  "Documentation Quality",
  "Apple Silicon Support",
  "Privacy & Security",
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/10 bg-[color:var(--surface-elevated)] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/75">About MacVault</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          A curated discovery platform for Mac tools
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
          MacVault helps you find high-quality Mac software faster. We focus on open-source and
          transparent projects where maintainers ship consistently, documentation is clear, and
          installation is straightforward.
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
          <h2 className="font-display text-2xl font-semibold text-white">How tools are evaluated</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Each tool is reviewed against practical workflow value, quality of implementation,
            update activity, and compatibility with modern Apple Silicon Macs. We also verify
            install paths and include commands that can be used immediately.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
          <h2 className="font-display text-2xl font-semibold text-white">Who maintains MacVault</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            MacVault is maintained by a small editorial workflow focused on practical Mac tooling.
            The goal is simple: keep the catalog useful, current, and transparent for builders,
            creators, and power users.
          </p>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
        <h2 className="font-display text-2xl font-semibold text-white">The scoring system</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
          Every tool gets an overall score from 0 to 10, plus eight component scores so you can
          see exactly where a tool is strong or weak. This keeps rankings interpretable instead of
          opaque.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scoringDimensions.map((dimension) => (
            <div
              key={dimension}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80"
            >
              {dimension}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
