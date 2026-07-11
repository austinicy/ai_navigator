import { FrameworkConfig } from "../framework/types";
import { DimensionAssessment, AIReadinessBreakdown, GenAIReadinessBreakdown } from "./types";

/**
 * Confidence-weighted dimension score.
 * Each criterion contributes score × weight × criterionConfidence; we divide by
 * the sum of (weight × criterionConfidence) over SCORED criteria. Unscored or
 * zero-confidence criteria contribute nothing, so a partially-probed dimension
 * reflects only what was actually assessed.
 */
export function calculateDimensionScore(
  dimension: DimensionAssessment,
  config: FrameworkConfig
): number {
  const dimConfig = config.dimensions.find((d) => d.id === dimension.dimensionId);
  if (!dimConfig) return 0;

  let numerator = 0;
  let denominator = 0;
  for (const [criterionId, score] of Object.entries(dimension.criterionScores)) {
    const criterion = dimConfig.criteria.find((c) => c.id === criterionId);
    if (!criterion) continue;
    const conf = dimension.criterionConfidence?.[criterionId] ?? 0;
    if (conf <= 0) continue;
    numerator += score * criterion.weight * conf;
    denominator += criterion.weight * conf;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

export function calculateOverallScore(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): number {
  const assessed = Object.values(dimensions).filter(
    (d) => d.confidence >= config.confidenceThreshold
  );
  if (assessed.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (const dimAssessment of assessed) {
    const dimConfig = config.dimensions.find((d) => d.id === dimAssessment.dimensionId);
    if (dimConfig?.includeInOverall === false) continue;
    const weight = dimConfig?.weight ?? 1;
    num += dimAssessment.score * weight;
    den += weight;
  }
  return den > 0 ? num / den : 0;
}

/** Cross-cutting GenAI and agentic readiness score (0–100), introduced in v3. */
export function calculateGenAIReadinessScore(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): GenAIReadinessBreakdown {
  const definitions = config.genAIReadinessComponents ?? [];
  const components: Record<string, number | null> = {};
  let assessedCriteria = 0;
  let totalCriteria = 0;

  for (const component of definitions) {
    const relevant = config.dimensions.flatMap((dimension) =>
      dimension.criteria
        .filter((criterion) => criterion.genAIReadinessComponent === component.id)
        .map((criterion) => ({
          dimensionId: dimension.id,
          criterionId: criterion.id,
          weight: criterion.weight,
        }))
    );
    totalCriteria += relevant.length;
    let numerator = 0;
    let denominator = 0;
    for (const item of relevant) {
      const assessment = dimensions[item.dimensionId];
      const score = assessment?.criterionScores?.[item.criterionId];
      const confidence = assessment?.criterionConfidence?.[item.criterionId] ?? 0;
      if (score === undefined || confidence <= 0) continue;
      assessedCriteria++;
      numerator += score * item.weight * confidence;
      denominator += item.weight * confidence;
    }
    components[component.id] = denominator > 0
      ? (numerator / denominator / 5) * 100
      : null;
  }

  let numerator = 0;
  let denominator = 0;
  for (const component of definitions) {
    const value = components[component.id];
    if (value === null || value === undefined) continue;
    const weight = component.weight ?? 1;
    numerator += value * weight;
    denominator += weight;
  }

  return {
    score: denominator > 0 ? Math.round(numerator / denominator) : 0,
    components,
    assessedCriteria,
    totalCriteria,
  };
}

/**
 * Component-weighted AI Readiness score (0–100). Each component is the
 * confidence-weighted criterion average, normalized 1–5 → 0–100. Components
 * with no scored criteria are excluded (null), not counted as 0.
 */
export function calculateAIReadinessScore(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): AIReadinessBreakdown {
  const components: Record<string, number | null> = {};

  for (const comp of config.aiReadinessComponents) {
    const relevant = config.dimensions.flatMap((d) =>
      d.criteria
        .filter((c) => c.aiReadinessComponent === comp.id)
        .map((c) => ({ dimensionId: d.id, criterionId: c.id, weight: c.weight }))
    );
    if (relevant.length === 0) {
      components[comp.id] = null;
      continue;
    }
    let num = 0;
    let den = 0;
    let any = false;
    for (const rc of relevant) {
      const dim = dimensions[rc.dimensionId];
      const score = dim?.criterionScores?.[rc.criterionId];
      const conf = dim?.criterionConfidence?.[rc.criterionId] ?? 0;
      if (score === undefined || conf <= 0) continue;
      num += score * rc.weight * conf;
      den += rc.weight * conf;
      any = true;
    }
    components[comp.id] = any && den > 0 ? (num / den / 5) * 100 : null;
  }

  // Weighted average over scored components using component.weight (default 1).
  let num = 0;
  let den = 0;
  for (const comp of config.aiReadinessComponents) {
    const v = components[comp.id];
    if (v === null || v === undefined) continue;
    const w = comp.weight ?? 1;
    num += v * w;
    den += w;
  }
  const score = den > 0 ? num / den : 0;
  return { score: Math.round(score), components };
}

export function getDimensionLevel(score: number): { level: number; name: string } {
  const levels = [
    { level: 1, name: "Ad Hoc" },
    { level: 2, name: "Emerging" },
    { level: 3, name: "Defined" },
    { level: 4, name: "Advanced" },
    { level: 5, name: "Leading" },
  ];
  const idx = Math.max(1, Math.min(5, Math.round(score)));
  return levels[idx - 1];
}

/** Signed difference between a score and its benchmark target (0 if no target). */
export function calculateBenchmarkDelta(score: number, benchmarkTarget: number | undefined): number {
  if (benchmarkTarget === undefined) return 0;
  return Math.round((score - benchmarkTarget) * 10) / 10;
}

export interface DependencyGap {
  dimensionId: string;
  criterionId: string;
  unmetDependencies: string[];
}

/**
 * Find criteria whose declared dependencies are not yet at level ≥ 3.
 * Used by roadmap generation to sequence actions (don't scale AI before data
 * foundations are solid).
 */
export function checkDependencyGaps(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): DependencyGap[] {
  const gaps: DependencyGap[] = [];
  for (const dim of config.dimensions) {
    const dimAssessment = dimensions[dim.id];
    for (const criterion of dim.criteria) {
      if (!criterion.dependsOn || criterion.dependsOn.length === 0) continue;
      // Only consider criteria the org is actually attempting (has a score).
      if (dimAssessment?.criterionScores?.[criterion.id] === undefined) continue;
      const unmet: string[] = [];
      for (const depId of criterion.dependsOn) {
        const [depDimId, depCritId] = depId.split(".");
        const depScore = dimensions[depDimId]?.criterionScores?.[depCritId];
        if (depScore === undefined || depScore < 3) unmet.push(depId);
      }
      if (unmet.length > 0) {
        gaps.push({ dimensionId: dim.id, criterionId: criterion.id, unmetDependencies: unmet });
      }
    }
  }
  return gaps;
}
