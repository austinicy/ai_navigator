import { describe, it, expect } from "vitest";
import { getDemoRoadmap, getDemoSession } from "../demo-data";
import { loadFramework } from "../../framework/config";
import type {
  AssessmentSession,
  DimensionAssessment,
} from "../../assessment/types";

// Load the real framework so we can cross-check every criterionId used in the
// demo data against v2.json. A typo here would make the demo report render "—"
// for that criterion, so this is a high-value guard.
const config = loadFramework();

// Build a lookup: dimensionId -> Set of valid criterionIds from v2.json
const validCriteriaByDimension: Record<string, Set<string>> = {};
for (const dim of config.dimensions) {
  validCriteriaByDimension[dim.id] = new Set(dim.criteria.map((c) => c.id));
}

// The 7 dimension ids the framework defines, in order.
const expectedDimensionIds = config.dimensions.map((d) => d.id);

describe("getDemoSession", () => {
  const session = getDemoSession();

  it("returns a Partial<AssessmentSession> with the demo session id", () => {
    expect(session.id).toBe("demo-acme-corp");
    expect(session.frameworkVersion).toBe("2.0");
  });

  it("marks the session as complete", () => {
    expect(session.isComplete).toBe(true);
  });

  it("populates orgProfile with Acme Corporation / Manufacturing", () => {
    expect(session.orgProfile).toBeDefined();
    expect(session.orgProfile!.name).toBe("Acme Corporation");
    expect(session.orgProfile!.industry).toBe("Manufacturing");
    expect(session.orgProfile!.size).toBe("mid-market");
    expect(session.orgProfile!.geography).toBe("Southeast Asia");
    expect(session.orgProfile!.regulatoryEnvironment).toEqual(["PDPA"]);
    expect(session.orgProfile!.existingInitiatives).toEqual([
      "Cloud migration to AWS",
      "Data warehouse modernization",
    ]);
    expect(session.orgProfile!.constraints).toEqual({
      budget: "medium",
      timeline: "moderate",
      talentAvailability: "scarce",
    });
  });

  it("includes all 7 framework dimension keys", () => {
    expect(session.dimensions).toBeDefined();
    const dimKeys = Object.keys(session.dimensions!);
    expect(dimKeys).toHaveLength(7);
    for (const id of expectedDimensionIds) {
      expect(dimKeys).toContain(id);
    }
  });

  it("gives each dimension a score, confidence, evidence, gaps, and criterionScores", () => {
    const dims = session.dimensions as Record<string, DimensionAssessment>;
    for (const id of expectedDimensionIds) {
      const dim = dims[id];
      expect(dim, `dimension ${id} should exist`).toBeDefined();
      expect(typeof dim.score).toBe("number");
      expect(dim.score).toBeGreaterThan(0);
      expect(dim.score).toBeLessThanOrEqual(5);
      expect(typeof dim.confidence).toBe("number");
      expect(dim.confidence).toBeGreaterThan(0);
      expect(dim.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(dim.evidence)).toBe(true);
      expect(dim.evidence.length).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(dim.gaps)).toBe(true);
      expect(dim.gaps.length).toBeGreaterThan(0);
      expect(typeof dim.criterionScores).toBe("object");
      expect(Object.keys(dim.criterionScores).length).toBeGreaterThan(0);
    }
  });

  it("has real values for strategy score (3.2) and dimension keys count (7)", () => {
    const dims = session.dimensions as Record<string, DimensionAssessment>;
    expect(dims.strategy.score).toBe(3.2);
    expect(Object.keys(dims)).toHaveLength(7);
  });

  it("asserts specific real scores for every dimension", () => {
    const dims = session.dimensions as Record<string, DimensionAssessment>;
    expect(dims.strategy.score).toBe(3.2);
    expect(dims.technology.score).toBe(2.8);
    expect(dims.data_ai.score).toBe(2.1);
    expect(dims.ai_governance.score).toBe(1.5);
    expect(dims.culture.score).toBe(3.5);
    expect(dims.operations.score).toBe(2.5);
    expect(dims.customer.score).toBe(3.0);
  });

  it("populates aiReadiness with score 28 and all 6 components", () => {
    expect(session.aiReadiness).toBeDefined();
    expect(session.aiReadiness!.score).toBe(28);
    const components = session.aiReadiness!.components;
    const componentKeys = Object.keys(components);
    expect(componentKeys).toHaveLength(6);
    for (const comp of config.aiReadinessComponents) {
      expect(componentKeys).toContain(comp.id);
      const val = components[comp.id];
      expect(val).not.toBeNull();
      expect(typeof val).toBe("number");
    }
    // Spot-check a couple of real component values
    expect(components.ai_strategy).toBe(40);
    expect(components.governance_readiness).toBe(10);
  });

  it("every criterionScore key in demo data exists in v2.json (no typos)", () => {
    const dims = session.dimensions as Record<string, DimensionAssessment>;
    for (const dimId of expectedDimensionIds) {
      const dim = dims[dimId];
      const validSet = validCriteriaByDimension[dimId];
      for (const criterionId of Object.keys(dim.criterionScores)) {
        expect(
          validSet.has(criterionId),
          `criterionId "${criterionId}" in dimension "${dimId}" does not exist in v2.json`
        ).toBe(true);
      }
    }
  });

  it("every evidence criterionId in demo data exists in v2.json (no typos)", () => {
    const dims = session.dimensions as Record<string, DimensionAssessment>;
    for (const dimId of expectedDimensionIds) {
      const dim = dims[dimId];
      const validSet = validCriteriaByDimension[dimId];
      for (const ev of dim.evidence) {
        if (ev.criterionId) {
          expect(
            validSet.has(ev.criterionId),
            `evidence criterionId "${ev.criterionId}" in dimension "${dimId}" does not exist in v2.json`
          ).toBe(true);
        }
      }
    }
  });

  it("all criterionScores values are integers in 1-5 range", () => {
    const dims = session.dimensions as Record<string, DimensionAssessment>;
    for (const dimId of expectedDimensionIds) {
      const dim = dims[dimId];
      for (const [criterionId, score] of Object.entries(dim.criterionScores)) {
        expect(Number.isInteger(score), `${dimId}.${criterionId} score should be integer`).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(5);
      }
    }
  });

  it("evidence items have well-formed structure (id, text, source, dimensionId, timestamp)", () => {
    const dims = session.dimensions as Record<string, DimensionAssessment>;
    const allEvidence = Object.values(dims).flatMap((d) => d.evidence);
    expect(allEvidence.length).toBeGreaterThanOrEqual(7 * 3); // at least 3 per dimension
    for (const ev of allEvidence) {
      expect(typeof ev.id).toBe("string");
      expect(ev.id.length).toBeGreaterThan(0);
      expect(typeof ev.text).toBe("string");
      expect(ev.text.length).toBeGreaterThan(0);
      expect(ev.source).toBe("conversation");
      expect(ev.dimensionId).toBeDefined();
      expect(ev.criterionId).toBeDefined();
      expect(typeof ev.timestamp).toBe("number");
    }
  });

  it("timestamps: createdAt is before updatedAt", () => {
    expect(session.createdAt).toBeDefined();
    expect(session.updatedAt).toBeDefined();
    expect(session.createdAt!).toBeLessThanOrEqual(session.updatedAt!);
  });

  it("the returned object is structurally assignable to Partial<AssessmentSession>", () => {
    // Compile-time check: if this assignment fails to type-check, the test file
    // itself won't compile. We also assert at runtime that the core shape holds.
    const _typed: Partial<AssessmentSession> = session;
    expect(_typed).toBeDefined();
  });
});

describe("getDemoRoadmap", () => {
  it("returns a pre-generated execution plan for the demo report", () => {
    const roadmap = getDemoRoadmap();

    expect(roadmap.orgName).toBe("Acme Corporation");
    expect(roadmap.industry).toBe("Manufacturing");
    expect(roadmap.phases.length).toBeGreaterThanOrEqual(3);
    expect(roadmap.phases[0].actions.length).toBeGreaterThan(0);
    expect(roadmap.quickWins.length).toBeGreaterThan(0);
    expect(roadmap.criticalGaps.length).toBeGreaterThan(0);
  });
});
