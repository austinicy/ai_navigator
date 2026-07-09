import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import {
  calculateDimensionScore,
  calculateOverallScore,
  calculateAIReadinessScore,
  getDimensionLevel,
} from "../scoring";
import type {
  DimensionAssessment,
  Evidence,
} from "../types";

const config = loadFramework();

// Helper: build a DimensionAssessment with sensible defaults.
function makeDim(
  dimensionId: string,
  overrides: Partial<DimensionAssessment> = {}
): DimensionAssessment {
  return {
    dimensionId,
    score: 0,
    confidence: 0,
    evidence: [],
    gaps: [],
    criterionScores: {},
    ...overrides,
  };
}

// Helper: build an Evidence object with required fields.
function makeEvidence(
  dimensionId: string,
  overrides: Partial<Evidence> = {}
): Evidence {
  return {
    id: "ev-" + dimensionId + Math.random(),
    text: "evidence",
    source: "conversation",
    dimensionId,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("calculateDimensionScore", () => {
  it("returns 0 for an unknown dimension id", () => {
    const dim = makeDim("does_not_exist", { criterionScores: { x: 3 } });
    expect(calculateDimensionScore(dim, config)).toBe(0);
  });

  it("returns 0 when no criteria are scored", () => {
    const dim = makeDim("strategy", { criterionScores: {} });
    expect(calculateDimensionScore(dim, config)).toBe(0);
  });

  it("computes a weighted average using framework criterion weights (uniform weights)", () => {
    // strategy has 4 criteria, all weight 1.0.
    // Score 3 on all 4 → weighted avg = 3.
    const dim = makeDim("strategy", {
      criterionScores: {
        digital_vision: 3,
        executive_sponsorship: 3,
        investment_commitment: 3,
        governance_structure: 3,
      },
    });
    expect(calculateDimensionScore(dim, config)).toBeCloseTo(3, 10);
  });

  it("weights criteria by their framework weight", () => {
    // Manually verify weighted average: technology has 5 criteria, all weight 1.
    // Score two criteria: cloud_maturity=5, tech_debt_management=1 → (5+1)/5 = 1.2
    // (totalWeight of all 5 criteria = 5, weightedSum = 5*1 + 1*1 = 6, 6/5 = 1.2)
    const dim = makeDim("technology", {
      criterionScores: {
        cloud_maturity: 5,
        tech_debt_management: 1,
      },
    });
    expect(calculateDimensionScore(dim, config)).toBeCloseTo(1.2, 10);
  });

  it("ignores scored criteria not present in the framework (weight 0)", () => {
    const dim = makeDim("strategy", {
      criterionScores: {
        digital_vision: 4,
        bogus_criterion: 5, // not in framework → weight 0
      },
    });
    // Only digital_vision counts: 4*1 / 4 (total weight of all 4 criteria) = 1.0
    expect(calculateDimensionScore(dim, config)).toBeCloseTo(1.0, 10);
  });
});

describe("calculateOverallScore", () => {
  it("returns 0 when no dimensions meet the confidence threshold", () => {
    const dims = {
      strategy: makeDim("strategy", { confidence: 0.5, score: 3 }),
    };
    // confidenceThreshold is 0.7; 0.5 < 0.7 → excluded
    expect(calculateOverallScore(dims, config)).toBe(0);
  });

  it("returns 0 when the dimensions record is empty", () => {
    expect(calculateOverallScore({}, config)).toBe(0);
  });

  it("averages assessed dimensions but divides by ALL framework dimension weights", () => {
    // Per the brief's formula, totalWeight is the sum of ALL framework dimension
    // weights (7.0), not just the assessed ones. So a partially-assessed org
    // gets a deflated overall score.
    // strategy score 4 (confidence 0.9), technology score 2 (confidence 0.8)
    // weightedSum = 4*1 + 2*1 = 6; totalWeight = 7 → 6/7
    const dims = {
      strategy: makeDim("strategy", { confidence: 0.9, score: 4 }),
      technology: makeDim("technology", { confidence: 0.8, score: 2 }),
      data_ai: makeDim("data_ai", { confidence: 0.1, score: 5 }), // below threshold
    };
    expect(calculateOverallScore(dims, config)).toBeCloseTo(6 / 7, 10);
  });

  it("includes a dimension exactly at the confidence threshold", () => {
    // strategy score 4, totalWeight = 7 → 4/7
    const dims = {
      strategy: makeDim("strategy", { confidence: 0.7, score: 4 }),
    };
    expect(calculateOverallScore(dims, config)).toBeCloseTo(4 / 7, 10);
  });

  it("returns the plain average when all dimensions are assessed (uniform weights)", () => {
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) {
      dims[d.id] = makeDim(d.id, { confidence: 0.9, score: 3 });
    }
    // All 7 assessed at score 3, weights all 1.0 → 21/7 = 3
    expect(calculateOverallScore(dims, config)).toBeCloseTo(3, 10);
  });

  it("uses fallback weight of 1 for an unknown dimension id", () => {
    const dims = {
      unknown_dim: makeDim("unknown_dim", { confidence: 0.9, score: 3 }),
    };
    // totalWeight = sum of all framework dims (7), weightedSum = 3*1 (fallback)
    // → 3 / 7
    expect(calculateOverallScore(dims, config)).toBeCloseTo(3 / 7, 10);
  });
});

describe("calculateAIReadinessScore", () => {
  it("returns null for every component when no criteria are scored", () => {
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    const result = calculateAIReadinessScore(dims, config);
    expect(result.score).toBe(0);
    for (const comp of config.aiReadinessComponents) {
      expect(result.components[comp.id]).toBeNull();
    }
  });

  it("normalizes a 1-5 criterion score to 0-100 for a component", () => {
    // ai_strategy has 4 criteria (all weight 1) in the strategy dimension.
    // Score all 4 at level 5 → (5*1 + 5*1 + 5*1 + 5*1) / 4 / 5 * 100 = 100
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    dims.strategy.criterionScores = {
      digital_vision: 5,
      executive_sponsorship: 5,
      investment_commitment: 5,
      governance_structure: 5,
    };
    const result = calculateAIReadinessScore(dims, config);
    expect(result.components.ai_strategy).toBe(100);
  });

  it("returns null for a component whose criteria have no scores yet", () => {
    // Score only strategy criteria → ai_strategy scored, others null.
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    dims.strategy.criterionScores = { digital_vision: 3 };
    const result = calculateAIReadinessScore(dims, config);
    expect(result.components.ai_strategy).not.toBeNull();
    // infrastructure_readiness lives in technology, which has no scores
    expect(result.components.infrastructure_readiness).toBeNull();
  });

  it("averages component scores into the overall score (rounded)", () => {
    // Score ai_strategy fully (→100) and data_readiness partially.
    // data_readiness criteria: data_quality, data_governance, analytics_maturity,
    // ml_ai_adoption (in data_ai, weight 1 each) + personalization, feedback_loops
    // (in customer, weight 1 each) = 6 criteria.
    // Score all at 3 → (3*6)/(6)/5*100 = 60
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    dims.strategy.criterionScores = {
      digital_vision: 5,
      executive_sponsorship: 5,
      investment_commitment: 5,
      governance_structure: 5,
    };
    dims.data_ai.criterionScores = {
      data_quality: 3,
      data_governance: 3,
      analytics_maturity: 3,
      ml_ai_adoption: 3,
    };
    dims.customer.criterionScores = {
      personalization: 3,
      feedback_loops: 3,
    };
    const result = calculateAIReadinessScore(dims, config);
    expect(result.components.ai_strategy).toBe(100);
    expect(result.components.data_readiness).toBe(60);
    // Only two components scored → (100 + 60) / 2 = 80
    expect(result.score).toBe(80);
  });

  it("handles a component whose criteria span multiple dimensions", () => {
    // operational_readiness spans: mlops_maturity (data_ai), process_digitization,
    // automation_level, delivery_agility, devops_maturity (operations), digital_channels,
    // journey_orchestration (customer) = 7 criteria.
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    // Score all operational_readiness criteria at level 1 → 20
    dims.data_ai.criterionScores = { mlops_maturity: 1 };
    dims.operations.criterionScores = {
      process_digitization: 1,
      automation_level: 1,
      delivery_agility: 1,
      devops_maturity: 1,
    };
    dims.customer.criterionScores = {
      digital_channels: 1,
      journey_orchestration: 1,
    };
    const result = calculateAIReadinessScore(dims, config);
    expect(result.components.operational_readiness).toBe(20);
  });
});

describe("getDimensionLevel", () => {
  it("maps score 1 to Ad Hoc", () => {
    expect(getDimensionLevel(1)).toEqual({ level: 1, name: "Ad Hoc" });
  });

  it("maps score 2 to Emerging", () => {
    expect(getDimensionLevel(2)).toEqual({ level: 2, name: "Emerging" });
  });

  it("maps score 3 to Defined", () => {
    expect(getDimensionLevel(3)).toEqual({ level: 3, name: "Defined" });
  });

  it("maps score 4 to Advanced", () => {
    expect(getDimensionLevel(4)).toEqual({ level: 4, name: "Advanced" });
  });

  it("maps score 5 to Leading", () => {
    expect(getDimensionLevel(5)).toEqual({ level: 5, name: "Leading" });
  });

  it("rounds a decimal score to the nearest level", () => {
    // 2.4 → round → 2 (Emerging); 2.5 → round → 3 (Defined)
    expect(getDimensionLevel(2.4).level).toBe(2);
    expect(getDimensionLevel(2.5).level).toBe(3);
    // 4.49 → 4; 4.5 → 5
    expect(getDimensionLevel(4.49).level).toBe(4);
    expect(getDimensionLevel(4.5).level).toBe(5);
  });

  it("clamps scores below 1 to level 1", () => {
    expect(getDimensionLevel(0)).toEqual({ level: 1, name: "Ad Hoc" });
    expect(getDimensionLevel(-5)).toEqual({ level: 1, name: "Ad Hoc" });
  });

  it("clamps scores above 5 to level 5", () => {
    expect(getDimensionLevel(6)).toEqual({ level: 5, name: "Leading" });
    expect(getDimensionLevel(100)).toEqual({ level: 5, name: "Leading" });
  });
});
