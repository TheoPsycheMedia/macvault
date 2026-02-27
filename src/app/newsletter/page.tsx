import { CheckCircle2, Mail, Send } from "lucide-react";
import type { CSSProperties } from "react";

import { NewsletterSignup } from "@/components/NewsletterSignup";

const digestPreviews = [
  {
    issue: "Issue #18",
    date: "February 22, 2026",
    title: "Keyboard-first Mac workflows",
    summary:
      "AeroSpace config tricks, new Raycast extensions for issue triage, and a practical AltTab setup for multi-monitor dev work.",
  },
  {
    issue: "Issue #17",
    date: "February 15, 2026",
    title: "Menu bar cleanup week",
    summary:
      "Ice vs Hidden Bar comparison, Itsycal automation tips, and a minimalist menu bar profile we tested across 3 MacBook setups.",
  },
  {
    issue: "Issue #16",
    date: "February 8, 2026",
    title: "System utility essentials",
    summary:
      "MonitorControl tuning presets, Stats module recommendations, and Pearcleaner rules for clean app removal without mistakes.",
  },
];

const benefits = [
  {
    icon: CheckCircle2,
    title: "What you get",
    description:
      "Curated picks, release context, and practical workflow notes you can apply the same day.",
  },
  {
    icon: Send,
    title: "Cadence",
    description:
      "Sent once per week, usually Sunday evening Pacific time, so you can plan a focused setup refresh.",
  },
  {
    icon: Mail,
    title: "Format",
    description:
      "Short and scannable: standout tools, one deep dive, and a compact changelog.",
  },
];

export default function NewsletterPage() {
  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section
        className="fade-in-section rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-12 text-center md:px-10"
        style={{ "--fade-delay": "0.02s" } as CSSProperties}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          MacVault Digest
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-[48px] font-semibold leading-[1.05] tracking-[-0.02em] text-[color:var(--text)] md:text-[56px]">
          Weekly curation for serious Mac users
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] text-[color:var(--text-muted)]">
          One refined weekly email featuring newly added tools, noteworthy updates, and practical
          setup recommendations.
        </p>
      </section>

      <section
        className="fade-in-section mt-12"
        style={{ "--fade-delay": "0.06s" } as CSSProperties}
      >
        <NewsletterSignup
          title="Join the MacVault newsletter"
          description="One focused email each week. No spam, no recycled links, no filler."
        />
      </section>

      <section
        className="fade-in-section mt-20 grid gap-6 md:grid-cols-3"
        style={{ "--fade-delay": "0.09s" } as CSSProperties}
      >
        {benefits.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6"
          >
            <Icon className="h-5 w-5 text-[color:var(--text-muted)]" />
            <h2 className="mt-4 text-[22px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
              {title}
            </h2>
            <p className="mt-2 text-[15px] text-[color:var(--text-muted)]">{description}</p>
          </article>
        ))}
      </section>

      <section
        className="fade-in-section mt-20"
        style={{ "--fade-delay": "0.12s" } as CSSProperties}
      >
        <h2 className="text-[30px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
          Previous digest previews
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {digestPreviews.map((digest) => (
            <article
              key={digest.issue}
              className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                {digest.issue}
              </p>
              <h3 className="mt-2 text-[22px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
                {digest.title}
              </h3>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">{digest.date}</p>
              <p className="mt-4 text-[15px] text-[color:var(--text-muted)]">{digest.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
