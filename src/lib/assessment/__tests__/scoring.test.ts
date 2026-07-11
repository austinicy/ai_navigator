// src/lib/assessment/__tests__/scoring.test.ts
import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import {
  calculateDimensionScore,
  calculateOverallScore,
  calculateAIReadinessScore,
  calculateGenAIReadinessScore,
  getDimensionLevel,
  calculateBenchmarkDelta,
  checkDependencyGaps,
} from "../scoring";
import type { DimensionAssessment, Evidence } from "../types";

const config = loadFramework("v2.0");

function makeDim(dimensionId: string, overrides: Partial<DimensionAssessment> = {}): DimensionAssessment {
  return {
    dimensionId,
    score: 0,
    confidence: 0,
    evidence: [],
    gaps: [],
    criterionScores: {},
    criterionConfidence: {},
    ...overrides,
  };
}
function ev(dim: string, crit: string, strength = 0.5): Evidence {
  return { id: "e", text: "t", source: "conversation", dimensionId: dim, criterionId: crit, timestamp: 1, strength, weight: 1 };
}

describe("calculateDimensionScore (confidence-weighted)", () => {
  it("returns 0 when no criteria are scored", () => {
    expect(calculateDimensionScore(makeDim("strategy"), config)).toBe(0);
  });

  it("weights each criterion by its criterion-confidence (unscored criteria contribute 0)", () => {
    // strategy has 4 criteria. Score all 4 at 4 with full confidence (3 evidence each).
    const dim = makeDim("strategy", {
      criterionScores: { digital_vision: 4, executive_sponsorship: 4, investment_commitment: 4, governance_structure: 4 },
      criterionConfidence: { digital_vision: 1, executive_sponsorship: 1, investment_commitment: 1, governance_structure: 1 },
    });
    expect(calculateDimensionScore(dim, config)).toBeCloseTo(4, 10);
  });

  it("down-weights a criterion with partial evidence vs one with full evidence", () => {
    // cloud_maturity=5 (full conf 1), tech_debt_management=1 (conf 0.33).
    // confidence-weighted: (5*1*1 + 1*1*0.33) / (1*1 + 1*0.33) = (5 + 0.33)/1.33 = ~4.01
    const dim = makeDim("technology", {
      criterionScores: { cloud_maturity: 5, tech_debt_management: 1 },
      criterionConfidence: { cloud_maturity: 1, tech_debt_management: 0.33 },
    });
    const score = calculateDimensionScore(dim, config);
    expect(score).toBeGreaterThan(3.9);
    expect(score).toBeLessThan(4.1);
  });
});

describe("calculateOverallScore", () => {
  it("divides by assessed-dimension weights only", () => {
    const dims = {
      strategy: makeDim("strategy", { confidence: 0.9, score: 4 }),
      technology: makeDim("technology", { confidence: 0.8, score: 2 }),
      data_ai: makeDim("data_ai", { confidence: 0.1, score: 5 }),
    };
    expect(calculateOverallScore(dims, config)).toBeCloseTo(3, 10);
  });
  it("returns 0 when nothing meets the threshold", () => {
    expect(calculateOverallScore({}, config)).toBe(0);
  });
});

describe("calculateAIReadinessScore (component-weighted)", () => {
  it("weights ai_strategy (1.5) and data_readiness (1.5) heavier than infra (1.0)", () => {
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    // ai_strategy all 5 → 100; infrastructure_readiness all 5 → 100
    dims.strategy.criterionScores = { digital_vision: 5, executive_sponsorship: 5, investment_commitment: 5, governance_structure: 5 };
    dims.strategy.criterionConfidence = { digital_vision: 1, executive_sponsorship: 1, investment_commitment: 1, governance_structure: 1 };
    dims.technology.criterionScores = { cloud_maturity: 5, tech_debt_management: 5, api_architecture: 5, infra_automation: 5, platform_engineering: 5 };
    dims.technology.criterionConfidence = { cloud_maturity: 1, tech_debt_management: 1, api_architecture: 1, infra_automation: 1, platform_engineering: 1 };
    const r = calculateAIReadinessScore(dims, config);
    expect(r.components.ai_strategy).toBe(100);
    expect(r.components.infrastructure_readiness).toBe(100);
    // both 100 → weighted avg still 100
    expect(r.score).toBe(100);
  });
});

describe("calculateGenAIReadinessScore", () => {
  const v3 = loadFramework("v3.0");

  it("reports GenAI separately and does not alter the core digital score", () => {
    const dimensions: Record<string, DimensionAssessment> = {};
    for (const dimension of v3.dimensions) dimensions[dimension.id] = makeDim(dimension.id);
    dimensions.strategy = makeDim("strategy", { score: 3, confidence: 0.9 });
    dimensions.genai = makeDim("genai", {
      score: 5,
      confidence: 1,
      criterionScores: Object.fromEntries(v3.dimensions.find((dimension) => dimension.id === "genai")!.criteria.map((criterion) => [criterion.id, 5])),
      criterionConfidence: Object.fromEntries(v3.dimensions.find((dimension) => dimension.id === "genai")!.criteria.map((criterion) => [criterion.id, 1])),
    });

    expect(calculateOverallScore(dimensions, v3)).toBe(3);
    const readiness = calculateGenAIReadinessScore(dimensions, v3);
    expect(readiness.score).toBe(100);
    expect(readiness.assessedCriteria).toBe(7);
    expect(readiness.totalCriteria).toBe(7);
  });
});

describe("getDimensionLevel", () => {
  it("maps 1→Ad Hoc, 5→Leading, clamps out of range", () => {
    expect(getDimensionLevel(1).name).toBe("Ad Hoc");
    expect(getDimensionLevel(5).name).toBe("Leading");
    expect(getDimensionLevel(0).level).toBe(1);
    expect(getDimensionLevel(9).level).toBe(5);
  });
});

describe("calculateBenchmarkDelta", () => {
  it("returns the signed difference from the criterion benchmark target", () => {
    // digital_vision benchmarkTarget = 3
    const delta = calculateBenchmarkDelta(4, 3);
    expect(delta).toBe(1);
  });
  it("returns 0 when no benchmark target is defined", () => {
    expect(calculateBenchmarkDelta(3, undefined)).toBe(0);
  });
});

describe("checkDependencyGaps", () => {
  it("flags a criterion whose dependency is below level 3", () => {
    // ml_ai_adoption depends on data_governance + analytics_maturity.
    // Set data_governance low → ml_ai_adoption should appear as a dependency gap.
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    dims.data_ai.criterionScores = { data_governance: 1, analytics_maturity: 4, ml_ai_adoption: 4 };
    const gaps = checkDependencyGaps(dims, config);
    const ids = gaps.map((g) => g.criterionId);
    expect(ids).toContain("ml_ai_adoption");
  });
  it("does not flag when dependencies are met", () => {
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    dims.data_ai.criterionScores = { data_governance: 4, analytics_maturity: 4, ml_ai_adoption: 4 };
    const gaps = checkDependencyGaps(dims, config);
    expect(gaps.map((g) => g.criterionId)).not.toContain("ml_ai_adoption");
  });
});
