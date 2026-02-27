"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface NewsletterSignupProps {
  title?: string;
  description?: string;
}

export function NewsletterSignup({
  title = "Get the weekly MacVault digest",
  description = "A concise editorial roundup of standout releases, useful updates, and practical setup notes.",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Subscription failed");
      }

      setSuccess(true);
      setMessage(payload.message ?? "Subscribed.");
      setEmail("");
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error ? error.message : "Could not subscribe at this time.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-12 text-center sm:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Newsletter
        </p>
        <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em] text-[color:var(--text)]">
          {title}
        </h2>
        <p className="mt-3 text-[15px] text-[color:var(--text-muted)]">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="mx-auto mt-7 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="h-12 flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] outline-none transition duration-300 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-soft)]"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-6 text-sm font-medium text-[color:var(--accent-contrast)] transition duration-300 hover:opacity-90 disabled:opacity-75"
        >
          {isSubmitting ? "Joining..." : "Join Digest"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {message ? (
        <p className={`mt-4 text-sm ${success ? "text-[color:var(--accent)]" : "text-[#9b4f2b]"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
