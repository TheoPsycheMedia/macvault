"use client";

import {
  AlertCircle,
  Check,
  Clock,
  ExternalLink,
  GitFork,
  RotateCcw,
  Search,
  Star,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type QueueStatus = "pending" | "approved" | "rejected" | "published";

interface DiscoveryScores {
  design: number;
  performance: number;
  documentation: number;
  maintenance: number;
  integration: number;
  uniqueness: number;
  value: number;
  community: number;
}

interface DiscoveryQueueApiItem {
  id: number;
  githubUrl: string;
  repoFullName: string;
  name: string;
  description: string | null;
  starCount: number;
  forkCount: number;
  language: string | null;
  lastCommitDate: string | null;
  license: string | null;
  topics: string[];
  status: QueueStatus;
  aiSummary: string | null;
  aiScores: DiscoveryScores | null;
  aiCategory: string | null;
  aiSubcategory: string | null;
  aiBrewCommand: string | null;
  aiInstallInstructions: string | null;
  evaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusTabs: Array<{
  status: QueueStatus;
  label: string;
  icon: typeof Clock;
}> = [
  { status: "pending", label: "Pending", icon: Clock },
  { status: "approved", label: "Approved", icon: Check },
  { status: "rejected", label: "Rejected", icon: X },
  { status: "published", label: "Published", icon: Upload },
];

const scoreLabels: Array<{ key: keyof DiscoveryScores; label: string }> = [
  { key: "design", label: "Design" },
  { key: "performance", label: "Performance" },
  { key: "documentation", label: "Documentation" },
  { key: "maintenance", label: "Maintenance" },
  { key: "integration", label: "Integration" },
  { key: "uniqueness", label: "Uniqueness" },
  { key: "value", label: "Value" },
  { key: "community", label: "Community" },
];

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function averageScore(scores: DiscoveryScores | null) {
  if (!scores) {
    return null;
  }

  const values = Object.values(scores);
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

export default function AdminDiscoveryPage() {
  const [activeStatus, setActiveStatus] = useState<QueueStatus>("pending");
  const [items, setItems] = useState<DiscoveryQueueApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const loadQueue = useCallback(async (status: QueueStatus) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/discovery/queue?status=${status}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load queue (${response.status})`);
      }

      const payload = (await response.json()) as {
        items?: DiscoveryQueueApiItem[];
      };
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue(activeStatus);
  }, [activeStatus, loadQueue]);

  const handlePublish = useCallback(
    async (id: number) => {
      setActioningId(id);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/discovery/publish/${id}`, {
          method: "POST",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? `Publish failed (${response.status})`);
        }

        await loadQueue(activeStatus);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Publish failed";
        setErrorMessage(message);
      } finally {
        setActioningId(null);
      }
    },
    [activeStatus, loadQueue],
  );

  const handleReconsider = useCallback(
    async (id: number) => {
      setActioningId(id);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/discovery/reconsider/${id}`, {
          method: "POST",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? `Reconsider failed (${response.status})`);
        }

        await loadQueue(activeStatus);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Reconsider failed";
        setErrorMessage(message);
      } finally {
        setActioningId(null);
      }
    },
    [activeStatus, loadQueue],
  );

  const emptyStateMessage = useMemo(() => {
    if (activeStatus === "approved") {
      return "No approved candidates are waiting for publish.";
    }
    if (activeStatus === "pending") {
      return "No pending candidates in the queue.";
    }
    if (activeStatus === "rejected") {
      return "No rejected candidates yet.";
    }
    return "No published discoveries yet.";
  }, [activeStatus]);

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-10 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              Admin
            </p>
            <h1 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.02em] text-[color:var(--text)] md:text-[46px]">
              Discovery Pipeline
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] text-[color:var(--text-muted)]">
              Review AI-evaluated GitHub candidates and publish approved Mac tools into the
              MacVault catalog.
            </p>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--text-muted)]">
            <p className="inline-flex items-center gap-2 font-medium text-[color:var(--text)]">
              <Search className="h-4 w-4 text-[color:var(--accent)]" />
              Editorial Workflow
            </p>
            <p className="mt-1">Scan + evaluate run via protected cron endpoints.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeStatus === tab.status;

            return (
              <button
                key={tab.status}
                type="button"
                onClick={() => setActiveStatus(tab.status)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {errorMessage ? (
        <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-8 space-y-5">
        {isLoading ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-8 text-sm text-[color:var(--text-muted)]">
            Loading discovery queue…
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-8 text-sm text-[color:var(--text-muted)]">
            {emptyStateMessage}
          </div>
        ) : null}

        {!isLoading
          ? items.map((item) => {
              const avg = averageScore(item.aiScores);

              return (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 md:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[26px] font-medium tracking-[-0.02em] text-[color:var(--text)]">
                          {item.name}
                        </h2>
                        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-2.5 py-0.5 text-xs text-[color:var(--text-muted)]">
                          {item.repoFullName}
                        </span>
                      </div>
                      <a
                        href={item.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-[color:var(--text-muted)] transition hover:text-[color:var(--text)]"
                      >
                        Open repository
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                        AI Category
                      </p>
                      <p className="text-sm font-medium text-[color:var(--text)]">
                        {item.aiCategory ?? "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2.5 text-xs text-[color:var(--text-muted)]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-1.5">
                      <Star className="h-3.5 w-3.5" />
                      {formatCompact(item.starCount)} stars
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-1.5">
                      <GitFork className="h-3.5 w-3.5" />
                      {formatCompact(item.forkCount)} forks
                    </span>
                    <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-1.5">
                      {item.language ?? "Unknown language"}
                    </span>
                    <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-1.5">
                      Last commit {formatDate(item.lastCommitDate)}
                    </span>
                    {avg ? (
                      <span className="rounded-full border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-3 py-1.5 text-[color:var(--text)]">
                        Avg score {avg.toFixed(1)}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-[15px] text-[color:var(--text-muted)]">
                    {item.aiSummary ?? item.description ?? "No AI summary available yet."}
                  </p>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] p-4">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                        AI Score Breakdown
                      </p>
                      {item.aiScores ? (
                        <div className="mt-3 space-y-2.5">
                          {scoreLabels.map((score) => {
                            const value = Number(item.aiScores?.[score.key] ?? 0);
                            const width = Math.max(0, Math.min(100, value * 10));

                            return (
                              <div key={score.key} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[color:var(--text)]">{score.label}</span>
                                  <span className="font-medium text-[color:var(--text-muted)]">
                                    {value.toFixed(1)}
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--surface)]">
                                  <div
                                    className="h-full rounded-full bg-[color:var(--accent)]"
                                    style={{ width: `${width}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                          Scores available after evaluation.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] p-4">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                        Suggested Install
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--text)]">
                        {item.aiBrewCommand || "No brew command suggested"}
                      </p>
                      <p className="mt-3 text-xs text-[color:var(--text-muted)]">
                        {item.aiInstallInstructions || "Install instructions pending evaluation."}
                      </p>
                      <p className="mt-3 text-xs text-[color:var(--text-muted)]">
                        Subcategory: {item.aiSubcategory ?? "General"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    {item.status === "approved" ? (
                      <button
                        type="button"
                        onClick={() => void handlePublish(item.id)}
                        disabled={actioningId === item.id}
                        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--accent-contrast)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Upload className="h-4 w-4" />
                        {actioningId === item.id ? "Publishing…" : "Publish"}
                      </button>
                    ) : null}

                    {item.status === "rejected" ? (
                      <button
                        type="button"
                        onClick={() => void handleReconsider(item.id)}
                        disabled={actioningId === item.id}
                        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text)] transition hover:bg-[color:var(--bg-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {actioningId === item.id ? "Reconsidering…" : "Reconsider"}
                      </button>
                    ) : null}

                    {item.status === "published" ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-medium text-[color:var(--text)]">
                        <Check className="h-4 w-4 text-[color:var(--accent)]" />
                        Published
                      </span>
                    ) : null}

                    <span className="text-xs text-[color:var(--text-muted)]">
                      Updated {formatDate(item.updatedAt)}
                    </span>
                  </div>
                </article>
              );
            })
          : null}
      </section>
    </div>
  );
}
