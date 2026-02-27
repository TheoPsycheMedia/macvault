import Link from "next/link";
import { Check, Package, Search, Upload, X } from "lucide-react";

import { db } from "@/lib/db";

export default function AdminPage() {
  const totalToolsRow = db.prepare("SELECT COUNT(*) AS count FROM tools").get() as { count: number };

  const queueRows = db
    .prepare("SELECT status, COUNT(*) AS count FROM discovery_queue GROUP BY status")
    .all() as Array<{ status: string; count: number }>;

  const queueByStatus = new Map(
    queueRows.map((row) => [row.status, Number(row.count)]),
  );

  const totalQueue = queueRows.reduce((sum, row) => sum + Number(row.count), 0);
  const pendingCount = queueByStatus.get("pending") ?? 0;
  const approvedCount = queueByStatus.get("approved") ?? 0;
  const rejectedCount = queueByStatus.get("rejected") ?? 0;
  const publishedCount = queueByStatus.get("published") ?? 0;

  return (
    <div className="editorial-shell pb-24 pt-10 md:pt-14">
      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-6 py-10 md:px-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Admin
        </p>
        <h1 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.02em] text-[color:var(--text)] md:text-[46px]">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-[color:var(--text-muted)]">
          Quick snapshot of the catalog and discovery pipeline.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              <Package className="h-4 w-4 text-[color:var(--accent)]" />
              Total Published Tools
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[color:var(--text)]">
              {totalToolsRow.count}
            </p>
          </article>

          <article className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              <Search className="h-4 w-4 text-[color:var(--accent)]" />
              Discovery Queue
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[color:var(--text)]">
              {totalQueue}
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Queue By Status
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                <Search className="h-4 w-4 text-[color:var(--accent)]" />
                Pending
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[color:var(--text)]">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                <Check className="h-4 w-4 text-[color:var(--accent)]" />
                Approved
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[color:var(--text)]">
                {approvedCount}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                <X className="h-4 w-4 text-[color:var(--accent)]" />
                Rejected
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[color:var(--text)]">
                {rejectedCount}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                <Upload className="h-4 w-4 text-[color:var(--accent)]" />
                Published
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[color:var(--text)]">
                {publishedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin/discovery"
            className="inline-flex items-center rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-[color:var(--accent-contrast)] transition hover:opacity-90"
          >
            Open Discovery Queue
          </Link>
        </div>
      </section>
    </div>
  );
}
