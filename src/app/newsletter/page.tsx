import { CheckCircle2, Mail, Send } from "lucide-react";

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

export default function NewsletterPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/10 bg-[color:var(--surface-elevated)] p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3 py-1 text-xs font-medium text-cyan-100">
          <Mail className="h-3.5 w-3.5" />
          MacVault Digest
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Weekly curation for serious Mac users
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-white/65 sm:text-base">
          A concise weekly email featuring newly added tools, high-signal updates, and
          practical setup recommendations.
        </p>
      </section>

      <section className="mt-8">
        <NewsletterSignup
          title="Join the MacVault newsletter"
          description="One focused email every week. No spam, no recycled links, and no fluff."
        />
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5">
          <CheckCircle2 className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-3 font-display text-xl font-semibold text-white">What you will get</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>Curated tool picks with context on who each app is best for.</li>
            <li>New releases worth your attention and why they matter.</li>
            <li>Actionable install and setup workflows you can use immediately.</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5">
          <Send className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-3 font-display text-xl font-semibold text-white">Cadence</h2>
          <p className="mt-3 text-sm text-white/70">
            Delivered once per week, typically on Sunday evening Pacific time, so you can plan
            your tool stack updates for the week ahead.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5">
          <Mail className="h-5 w-5 text-cyan-200" />
          <h2 className="mt-3 font-display text-xl font-semibold text-white">Format</h2>
          <p className="mt-3 text-sm text-white/70">
            Short and scannable. Usually 5-7 tools, one setup deep dive, and a compact changelog.
          </p>
        </article>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
          Previous digest previews
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {digestPreviews.map((digest) => (
            <article
              key={digest.issue}
              className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-5"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">{digest.issue}</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-white">{digest.title}</h3>
              <p className="mt-1 text-xs text-white/50">{digest.date}</p>
              <p className="mt-3 text-sm text-white/70">{digest.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
