import { FrameworkConfig } from "../framework/types";
import { DimensionAssessment, AIReadinessBreakdown, OrgProfile } from "./types";

export function calculateDimensionScore(
  dimension: DimensionAssessment,
  config: FrameworkConfig
): number {
  const dimConfig = config.dimensions.find(
    (d) => d.id === dimension.dimensionId
  );
  if (!dimConfig) return 0;

  const totalWeight = dimConfig.criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = Object.entries(dimension.criterionScores).reduce(
    (sum, [criterionId, score]) => {
      const criterion = dimConfig.criteria.find((c) => c.id === criterionId);
      const weight = criterion?.weight ?? 0;
      return sum + score * weight;
    },
    0
  );

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function calculateOverallScore(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): number {
  const assessedDims = Object.values(dimensions).filter(
    (d) => d.confidence >= config.confidenceThreshold
  );
  if (assessedDims.length === 0) return 0;

  const totalWeight = config.dimensions.reduce((sum, d) => sum + d.weight, 0);
  const weightedSum = assessedDims.reduce((sum, dimAssessment) => {
    const dimConfig = config.dimensions.find(
      (d) => d.id === dimAssessment.dimensionId
    );
    const weight = dimConfig?.weight ?? 1;
    return sum + dimAssessment.score * weight;
  }, 0);

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function calculateAIReadinessScore(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): AIReadinessBreakdown {
  const components: Record<string, number | null> = {};

  for (const comp of config.aiReadinessComponents) {
    const relevantCriteria = config.dimensions.flatMap((d) =>
      d.criteria
        .filter((c) => c.aiReadinessComponent === comp.id)
        .map((c) => ({ dimensionId: d.id, criterionId: c.id, weight: c.weight }))
    );

    if (relevantCriteria.length === 0) {
      components[comp.id] = null;
      continue;
    }

    let totalScore = 0;
    let totalWeight = 0;
    let hasAnyScore = false;

    for (const rc of relevantCriteria) {
      const dim = dimensions[rc.dimensionId];
      if (dim && dim.criterionScores[rc.criterionId] !== undefined) {
        totalScore += dim.criterionScores[rc.criterionId] * rc.weight;
        totalWeight += rc.weight;
        hasAnyScore = true;
      }
    }

    components[comp.id] = hasAnyScore && totalWeight > 0
      ? (totalScore / totalWeight / 5) * 100 // normalize 1-5 → 0-100
      : null;
  }

  const scoredComponents = Object.values(components).filter(
    (v): v is number => v !== null
  );
  const score =
    scoredComponents.length > 0
      ? scoredComponents.reduce((a, b) => a + b, 0) / scoredComponents.length
      : 0;

  return { score: Math.round(score), components };
}

export function getDimensionLevel(score: number): {
  level: number;
  name: string;
} {
  const levels = [
    { level: 1, name: "Ad Hoc" },
    { level: 2, name: "Emerging" },
    { level: 3, name: "Defined" },
    { level: 4, name: "Advanced" },
    { level: 5, name: "Leading" },
  ];
  const roundedLevel = Math.max(1, Math.min(5, Math.round(score)));
  return levels[roundedLevel - 1];
}
