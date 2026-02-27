"use client";

import { ArrowRight, MailCheck } from "lucide-react";
import { useState } from "react";

interface NewsletterSignupProps {
  title?: string;
  description?: string;
}

export function NewsletterSignup({
  title = "Get the weekly MacVault digest",
  description = "New tools, trending repos, and practical setup workflows for your Mac.",
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
    <section className="rounded-3xl border border-white/10 bg-[linear-gradient(140deg,rgba(34,211,238,0.18),rgba(37,99,235,0.12)_45%,rgba(2,6,23,0.7)_90%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-8">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">
          <MailCheck className="h-3.5 w-3.5" />
          Newsletter
        </p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-sm text-white/75 sm:text-base">{description}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="h-12 flex-1 rounded-xl border border-white/20 bg-black/30 px-4 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/25"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:opacity-80"
        >
          {isSubmitting ? "Joining..." : "Join digest"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {message ? (
        <p className={`mt-3 text-sm ${success ? "text-emerald-200" : "text-rose-200"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
