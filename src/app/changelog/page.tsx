import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Changelog | MacVault",
};

const entries = [
  {
    date: "2025-02-18",
    version: "v0.3.0",
    label: "Feature",
    title: "Newsletter & welcome emails",
    description:
      "Subscribers now receive a welcome email via Resend when they sign up. Added a public /api/newsletter endpoint and wired up the newsletter form on the home page.",
  },
  {
    date: "2025-01-30",
    version: "v0.2.0",
    label: "Content",
    title: "Screenshots for all catalog tools",
    description:
      "Populated high-quality screenshots for all 16 tools in the initial catalog. Added an init-turso seed script so contributors can bootstrap a local database in one command.",
  },
  {
    date: "2025-01-12",
    version: "v0.1.0",
    label: "Launch",
    title: "Initial catalog launch",
    description:
      "MacVault goes live with 52 curated open-source Mac tools across 9 categories. Editorial scoring, Homebrew install snippets, trending rankings, and full-text search are all available from day one.",
  },
];

export default function ChangelogPage() {
  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section
        className="fade-in-section rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-12 md:px-12"
        style={{ "--fade-delay": "0.02s" } as CSSProperties}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          What&apos;s new
        </p>
        <h1 className="mt-4 text-[48px] font-semibold leading-[1.03] tracking-[-0.02em] text-[color:var(--text)] md:text-[56px]">
          Changelog
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] text-[color:var(--text-muted)]">
          A running record of meaningful updates to MacVault — new features, content additions, and
          improvements.
        </p>
      </section>

      <section
        className="fade-in-section mt-16"
        style={{ "--fade-delay": "0.05s" } as CSSProperties}
      >
        <ol className="relative border-l border-[color:var(--border)] pl-8">
          {entries.map((entry, i) => (
            <li
              key={i}
              className="mb-12 last:mb-0"
            >
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]" />

              <div className="flex flex-wrap items-center gap-3">
                <time
                  dateTime={entry.date}
                  className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]"
                >
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-0.5 text-xs text-[color:var(--text-muted)]">
                  {entry.version}
                </span>
                <span className="rounded-full bg-[color:var(--bg-soft)] px-3 py-0.5 text-xs font-medium text-[color:var(--text-muted)]">
                  {entry.label}
                </span>
              </div>

              <h2 className="mt-3 text-[22px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
                {entry.title}
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] text-[color:var(--text-muted)]">
                {entry.description}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
