import type { Tool } from "@/lib/types";

interface ScoreBreakdownProps {
  tool: Tool;
}

const scoreItems: Array<{ key: keyof Tool; label: string }> = [
  { key: "functionality", label: "Functionality" },
  { key: "usefulness", label: "Usefulness" },
  { key: "visualQuality", label: "Visual Quality" },
  { key: "installEase", label: "Install Ease" },
  { key: "maintenanceHealth", label: "Maintenance Health" },
  { key: "documentationQuality", label: "Documentation Quality" },
  { key: "appleSiliconSupport", label: "Apple Silicon Support" },
  { key: "privacySecurity", label: "Privacy & Security" },
];

export function ScoreBreakdown({ tool }: ScoreBreakdownProps) {
  return (
    <section className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
      <h3 className="text-[28px] font-medium tracking-[-0.01em] text-[color:var(--text)]">
        Score Breakdown
      </h3>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">
        Eight transparent dimensions contribute to the final score.
      </p>

      <div className="mt-6 grid gap-4">
        {scoreItems.map((item) => {
          const value = Number(tool[item.key]);
          const width = Math.max(0, Math.min(100, value * 10));

          return (
            <div key={item.key} className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[color:var(--text)]">{item.label}</span>
                <span className="font-medium text-[color:var(--text-muted)]">{value.toFixed(1)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bg-soft)]">
                <div
                  className="h-full rounded-full bg-[color:var(--accent)]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
