import { DimensionAssessment } from "@/lib/assessment/types";
import { getDimensionLevel } from "@/lib/assessment/scoring";

interface DimensionBarProps {
  dimensionId: string;
  name: string;
  assessment: DimensionAssessment | undefined;
}

export function DimensionBar({ dimensionId, name, assessment }: DimensionBarProps) {
  const score = assessment?.score ?? 0;
  const confidence = assessment?.confidence ?? 0;
  const level = getDimensionLevel(score);
  const percentage = (score / 5) * 100;

  const gradientColors: Record<string, string> = {
    strategy: "from-indigo-500 to-violet-500",
    technology: "from-blue-500 to-cyan-500",
    data_ai: "from-cyan-500 to-teal-500",
    ai_governance: "from-teal-500 to-emerald-500",
    culture: "from-amber-500 to-orange-500",
    operations: "from-orange-500 to-red-500",
    customer: "from-pink-500 to-rose-500",
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-foreground truncate">
          {name}
        </span>
        <span className="text-xs text-muted-foreground ml-2 shrink-0">
          {score > 0 ? `${score.toFixed(1)}` : "—"} / 5
        </span>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        {score > 0 ? (
          <div
            className={`h-full bg-gradient-to-r ${gradientColors[dimensionId] ?? "from-violet-500 to-pink-500"} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        ) : null}
      </div>
      {score > 0 && (
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-muted-foreground">{level.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {confidence < 0.7 ? "Low confidence" : `${Math.round(confidence * 100)}%`}
          </span>
        </div>
      )}
    </div>
  );
}
