import type { FrameworkConfig } from "../framework/types";
import type { AssessmentDelta } from "./types";

export type AssessmentProgressLabel = "Collecting" | "Ready" | "Improving";

export interface AssessmentProgress {
  percent: number;
  informationRemaining: number;
  dimensionsAssessed: number;
  totalDimensions: number;
  label: AssessmentProgressLabel;
}

export function getAssessmentProgress(
  delta: AssessmentDelta | null,
  config: FrameworkConfig
): AssessmentProgress {
  const threshold = Math.max(1, Math.round(config.evidenceThreshold));
  const totalDimensions = config.dimensions.length;
  const requiredEvidence = totalDimensions * threshold;

  if (!delta) {
    return {
      percent: 0,
      informationRemaining: requiredEvidence,
      dimensionsAssessed: 0,
      totalDimensions,
      label: "Collecting",
    };
  }

  let creditedEvidence = 0;
  let remainingEvidence = 0;
  for (const dimension of config.dimensions) {
    const evidenceCount = delta.dimensions[dimension.id]?.evidence.length ?? 0;
    creditedEvidence += Math.min(evidenceCount, threshold);
    remainingEvidence += Math.max(0, threshold - evidenceCount);
  }

  const isComplete =
    delta.dimensionsRemaining === 0 || delta.dimensionsAssessed >= totalDimensions;
  const percent = isComplete
    ? 100
    : Math.min(99, Math.round((creditedEvidence / requiredEvidence) * 100));
  const hasExtraEvidence = delta.signalsCollected > requiredEvidence;

  return {
    percent,
    informationRemaining: isComplete ? 0 : remainingEvidence,
    dimensionsAssessed: delta.dimensionsAssessed,
    totalDimensions,
    label: isComplete && hasExtraEvidence ? "Improving" : isComplete ? "Ready" : "Collecting",
  };
}
