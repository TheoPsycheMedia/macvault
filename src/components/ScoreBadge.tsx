import { getScoreTone } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-base",
  lg: "h-20 w-20 text-lg",
} as const;

const toneMap = {
  emerald:
    "border-emerald-400/45 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]",
  amber:
    "border-amber-400/45 bg-amber-500/10 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]",
  rose: "border-rose-400/45 bg-rose-500/10 text-rose-200 shadow-[0_0_0_1px_rgba(244,63,94,0.2)]",
};

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const tone = getScoreTone(score);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full border font-semibold tracking-tight ${sizeMap[size]} ${toneMap[tone]}`}
      aria-label={`Score ${score.toFixed(1)} out of 10`}
    >
      {score.toFixed(1)}
    </div>
  );
}
