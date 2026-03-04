"use client";

import { useState } from "react";

import {
  getNewsletterEmailValidationMessage,
  normalizeNewsletterEmail,
} from "@/lib/newsletter";

interface NewsletterSignupProps {
  title?: string;
  description?: string;
}

export function NewsletterSignup({
  title = "Stay in the loop",
  description = "New Mac tools, curated weekly. No spam, ever.",
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "warning" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = normalizeNewsletterEmail(email);
    const validationMessage = getNewsletterEmailValidationMessage(normalizedEmail);

    if (validationMessage) {
      setStatus("error");
      setMessage(validationMessage);
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Subscription failed");
      }

      setStatus(response.status === 202 ? "warning" : "success");
      setMessage(payload.message ?? "Subscribed.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not subscribe at this time.");
    }
  };

  return (
    <section className="rounded-[28px] border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Newsletter</p>
        <h2 className="text-[30px] font-medium leading-tight tracking-[-0.02em] text-zinc-100">
          {title}
        </h2>
        <p className="mt-2 text-[15px] text-zinc-400">{description}</p>

        <form onSubmit={onSubmit} className="mt-6 flex w-full flex-col gap-3 md:flex-row">
          <input
            type="email"
            required
            value={email}
            disabled={status === "loading"}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-0 transition focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-100 px-6 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>

        {message ? (
          <p
            role="status"
            aria-live="polite"
            className={`mt-4 text-sm ${
              status === "error"
                ? "text-rose-400"
                : status === "warning"
                  ? "text-amber-300"
                  : "text-emerald-400"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
