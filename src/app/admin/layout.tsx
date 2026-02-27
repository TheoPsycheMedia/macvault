"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

const ADMIN_AUTH_STORAGE_KEY = "macvault-admin-auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    setIsAuthenticated(storedValue === "true");
    setIsReady(true);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.status === 401) {
        setErrorMessage("Invalid password");
        return;
      }

      if (!response.ok) {
        setErrorMessage("Login failed");
        return;
      }

      window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
      setIsAuthenticated(true);
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return <div className="py-16 text-center text-sm text-[color:var(--text-muted)]">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[72vh] bg-[#FAFAF9] px-6 py-14">
        <section className="mx-auto flex min-h-[56vh] max-w-2xl items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--card-shadow)]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              MacVault Admin
            </p>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-[color:var(--text)]">
              Editorial Access
            </h1>

            <form className="mt-7 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-[#FAFAF9] px-4 py-3 text-[15px] outline-none transition focus:border-[#1B4332]"
                placeholder="Password"
              />

              {errorMessage ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#1B4332] px-5 py-3 text-sm font-medium text-[#FAFAF9] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Checking..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
