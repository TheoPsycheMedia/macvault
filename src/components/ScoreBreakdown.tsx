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
    <section className="rounded-2xl border border-white/10 bg-[color:var(--surface-elevated)] p-6">
      <h3 className="font-display text-2xl font-semibold text-white">Score Breakdown</h3>
      <p className="mt-2 text-sm text-white/65">
        Eight weighted dimensions make up the overall MacVault score.
      </p>

      <div className="mt-6 grid gap-4">
        {scoreItems.map((item) => {
          const value = Number(tool[item.key]);
          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{item.label}</span>
                <span className="font-medium text-cyan-100">{value.toFixed(1)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500"
                  style={{ width: `${Math.max(0, Math.min(100, value * 10))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
