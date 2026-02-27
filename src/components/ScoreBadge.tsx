interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { box: 48, radius: 18, stroke: 3, textClass: "text-xs" },
  md: { box: 58, radius: 22, stroke: 3, textClass: "text-sm" },
  lg: { box: 72, radius: 27, stroke: 3.4, textClass: "text-base" },
} as const;

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const clampedScore = Math.max(0, Math.min(10, score));
  const progress = clampedScore / 10;
  const { box, radius, stroke, textClass } = sizeMap[size];
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: box, height: box }}
      aria-label={`Score ${clampedScore.toFixed(1)} out of 10`}
      title={`Score ${clampedScore.toFixed(1)} / 10`}
    >
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${box} ${box}`} aria-hidden>
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span
        className={`pointer-events-none absolute font-medium tracking-[-0.01em] text-[color:var(--text)] ${textClass}`}
      >
        {clampedScore.toFixed(1)}
      </span>
    </div>
  );
}
