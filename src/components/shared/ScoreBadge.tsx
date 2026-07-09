interface ScoreBadgeProps {
  score: number;
  max?: number;
  label?: string;
  size?: "sm" | "lg";
}

export function ScoreBadge({ score, max = 5, label, size = "lg" }: ScoreBadgeProps) {
  const percentage = (score / max) * 100;
  const color =
    percentage >= 80
      ? "text-emerald-400"
      : percentage >= 60
        ? "text-amber-400"
        : percentage >= 40
          ? "text-orange-400"
          : "text-red-400";

  return (
    <div className="text-center">
      <div className={`${size === "lg" ? "text-4xl" : "text-2xl"} font-bold ${color}`}>
        {score > 0 ? (max === 100 ? Math.round(score) : score.toFixed(1)) : "—"}
      </div>
      <div className="text-xs text-muted-foreground">
        / {max} {label && <span className="block mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
