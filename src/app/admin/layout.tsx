"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { Lock, LogOut, Mail, User } from "lucide-react";

const SESSION_STORAGE_KEY = "macvault-session-token";
const LEGACY_STORAGE_KEY = "macvault-admin-auth";
const SESSION_COOKIE_NAME = "macvault-session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type AuthState = "loading" | "unauthenticated" | "authenticated";
type AuthMode = "login" | "register";

interface AdminProfile {
  id: number;
  email: string;
  name: string | null;
}

interface MeApiResponse {
  ok?: boolean;
  user?: AdminProfile;
  error?: string;
  code?: string;
}

interface LoginApiResponse {
  ok?: boolean;
  token?: string;
  expiresAt?: string;
  error?: string;
}

function setSessionCookie(token: string) {
  document.cookie = `${SESSION_COOKIE_NAME}=${token}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

async function fetchCurrentAdmin(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/admin/me", {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as MeApiResponse | null;
  return {
    ok: response.ok && payload?.ok === true && Boolean(payload.user),
    status: response.status,
    payload,
  };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const clearStoredSession = useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    clearSessionCookie();
  }, []);

  const completeSignIn = useCallback(
    async (token: string) => {
      window.localStorage.setItem(SESSION_STORAGE_KEY, token);
      setSessionCookie(token);

      const meResult = await fetchCurrentAdmin(token);
      if (!meResult.ok || !meResult.payload?.user) {
        clearStoredSession();
        throw new Error(meResult.payload?.error ?? "Unable to load admin profile");
      }

      setUser(meResult.payload.user);
      setAuthMode("login");
      setAuthState("authenticated");
      setErrorMessage("");
    },
    [clearStoredSession],
  );

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json().catch(() => null)) as LoginApiResponse | null;
    if (!response.ok || !payload?.ok || !payload.token) {
      throw new Error(payload?.error ?? "Invalid email or password");
    }

    return payload.token;
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrapAuth = async () => {
      const storedToken = window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "";
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);

      const meResult = await fetchCurrentAdmin(storedToken || undefined);
      if (!active) {
        return;
      }

      if (meResult.ok && meResult.payload?.user) {
        setUser(meResult.payload.user);
        setAuthMode("login");
        setAuthState("authenticated");
        return;
      }

      if (storedToken) {
        clearStoredSession();
      }

      if (meResult.payload?.code === "NO_ADMINS") {
        setAuthMode("register");
      } else {
        setAuthMode("login");
      }

      setAuthState("unauthenticated");
    };

    void bootstrapAuth();

    return () => {
      active = false;
    };
  }, [clearStoredSession]);

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const token = await loginWithCredentials(loginEmail.trim(), loginPassword);
      await completeSignIn(token);
      setLoginPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const trimmedEmail = registerEmail.trim();
    const trimmedName = registerName.trim();

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const registerResponse = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: registerPassword,
          name: trimmedName || undefined,
        }),
      });

      const registerPayload = (await registerResponse.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
          }
        | null;

      if (!registerResponse.ok || !registerPayload?.ok) {
        throw new Error(registerPayload?.error ?? "Registration failed");
      }

      const token = await loginWithCredentials(trimmedEmail, registerPassword);
      await completeSignIn(token);
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setUser(null);
    setAuthMode("login");
    setAuthState("unauthenticated");
    setErrorMessage("");
  };

  if (authState === "loading") {
    return <div className="py-16 text-center text-sm text-[color:var(--text-muted)]">Loading...</div>;
  }

  if (authState !== "authenticated") {
    const isRegisterMode = authMode === "register";

    return (
      <div className="min-h-[72vh] bg-[#FAFAF9] px-6 py-14">
        <section className="mx-auto flex min-h-[56vh] max-w-2xl items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--card-shadow)]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              MacVault Admin
            </p>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-[color:var(--text)]">
              {isRegisterMode ? "Create First Admin Account" : "Sign In"}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              {isRegisterMode
                ? "Set up the first MacVault admin account."
                : "Use your admin account credentials to continue."}
            </p>

            {isRegisterMode ? (
              <form className="mt-7 space-y-4" onSubmit={(event) => void handleRegisterSubmit(event)}>
                <label className="block">
                  <span className="sr-only">Name</span>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                    <input
                      id="admin-register-name"
                      type="text"
                      autoComplete="name"
                      value={registerName}
                      onChange={(event) => setRegisterName(event.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[#FAFAF9] py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-[#1B4332]"
                      placeholder="Name (optional)"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="sr-only">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                    <input
                      id="admin-register-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={registerEmail}
                      onChange={(event) => setRegisterEmail(event.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[#FAFAF9] py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-[#1B4332]"
                      placeholder="Email address"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="sr-only">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                    <input
                      id="admin-register-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={registerPassword}
                      onChange={(event) => setRegisterPassword(event.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[#FAFAF9] py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-[#1B4332]"
                      placeholder="Password (min 8 characters)"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="sr-only">Confirm Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                    <input
                      id="admin-register-confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={registerConfirmPassword}
                      onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[#FAFAF9] py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-[#1B4332]"
                      placeholder="Confirm password"
                    />
                  </div>
                </label>

                {errorMessage ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#1B4332] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Creating account..." : "Create Admin Account"}
                </button>
              </form>
            ) : (
              <form className="mt-7 space-y-4" onSubmit={(event) => void handleLoginSubmit(event)}>
                <label className="block">
                  <span className="sr-only">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                    <input
                      id="admin-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[#FAFAF9] py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-[#1B4332]"
                      placeholder="Email address"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="sr-only">Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                    <input
                      id="admin-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[#FAFAF9] py-3 pl-11 pr-4 text-[15px] outline-none transition focus:border-[#1B4332]"
                      placeholder="Password"
                    />
                  </div>
                </label>

                {errorMessage ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#1B4332] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Checking..." : "Sign In"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[#FAFAF9]/95 backdrop-blur">
        <div className="editorial-shell flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              MacVault Admin
            </p>
            <p className="text-sm text-[color:var(--text)]">{user?.name || user?.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text)] transition hover:border-[#1B4332] hover:text-[#1B4332]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}
