"use client";

import { AssessmentDelta } from "@/lib/assessment/types";
import { FrameworkConfig } from "@/lib/framework/types";
import { getAssessmentProgress } from "@/lib/assessment/progress";
import { Progress } from "@/components/ui/progress";

interface AssessmentProgressProps {
  delta: AssessmentDelta | null;
  config: FrameworkConfig;
}

export function AssessmentProgress({ delta, config }: AssessmentProgressProps) {
  const progress = getAssessmentProgress(delta, config);
  const message =
    progress.label === "Improving"
      ? "Assessment complete. Additional answers will improve evidence quality."
      : progress.label === "Ready"
        ? "Assessment complete. You can continue to add more detail."
        : `${progress.informationRemaining} more information ${
            progress.informationRemaining === 1 ? "point" : "points"
          } needed to complete the assessment.`;

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-xs font-semibold text-foreground">Assessment Progress</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {progress.dimensionsAssessed}/{progress.totalDimensions} dimensions assessed
          </p>
        </div>
        <span className="text-xs font-semibold text-primary shrink-0">
          {progress.label}
        </span>
      </div>
      <Progress value={progress.percent} className="gap-2" />
      <div className="flex items-center justify-between gap-3 mt-2">
        <p className="text-[11px] text-muted-foreground">{message}</p>
        <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
          {progress.percent}%
        </span>
      </div>
    </div>
  );
}
