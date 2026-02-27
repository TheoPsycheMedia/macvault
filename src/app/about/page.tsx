import type { CSSProperties } from "react";

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
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section
        className="fade-in-section rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-12 md:px-10"
        style={{ "--fade-delay": "0.02s" } as CSSProperties}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          About MacVault
        </p>
        <h1 className="mt-4 max-w-4xl text-[48px] font-semibold leading-[1.05] tracking-[-0.02em] text-[color:var(--text)] md:text-[56px]">
          A curated discovery platform for Mac tools
        </h1>
        <p className="mt-5 max-w-3xl text-[16px] text-[color:var(--text-muted)]">
          MacVault helps you find high-quality Mac software faster. We focus on open-source and
          transparent projects where maintainers ship consistently, documentation is clear, and
          installation is straightforward.
        </p>
      </section>

      <section
        className="fade-in-section mt-16 grid gap-6 md:grid-cols-2"
        style={{ "--fade-delay": "0.06s" } as CSSProperties}
      >
        <article className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-7">
          <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
            How tools are evaluated
          </h2>
          <p className="mt-3 text-[15px] text-[color:var(--text-muted)]">
            Each tool is reviewed against practical workflow value, quality of implementation,
            update activity, and compatibility with modern Apple Silicon Macs. We also verify
            install paths and include commands that can be used immediately.
          </p>
        </article>

        <article className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-7">
          <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
            Who maintains MacVault
          </h2>
          <p className="mt-3 text-[15px] text-[color:var(--text-muted)]">
            MacVault is maintained by a small editorial workflow focused on practical Mac tooling.
            The goal is simple: keep the catalog useful, current, and transparent for builders,
            creators, and power users.
          </p>
        </article>
      </section>

      <section
        className="fade-in-section mt-16 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-7"
        style={{ "--fade-delay": "0.1s" } as CSSProperties}
      >
        <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
          The scoring system
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] text-[color:var(--text-muted)]">
          Every tool gets an overall score from 0 to 10, plus eight component scores so you can
          see exactly where a tool is strong or weak.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scoringDimensions.map((dimension) => (
            <div
              key={dimension}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-sm text-[color:var(--text)]"
            >
              {dimension}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
