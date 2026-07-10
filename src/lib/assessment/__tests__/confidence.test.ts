import { describe, it, expect } from "vitest";
import { AssessmentEngine } from "../engine";
import { loadFramework } from "../../framework/config";

const config = loadFramework("v2.0");
const evidenceInput = (dimensionId: string, criterionId?: string, strength = 0.5) => ({
  text: "e", source: "conversation" as const, dimensionId, criterionId, strength,
});

describe("criterion confidence model", () => {
  it("grows criterion confidence as evidence accumulates for that criterion", () => {
    const engine = new AssessmentEngine();
    // digital_vision needs 3 strength-units to hit confidence 1 (threshold rounds to 3).
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 0.5));
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 0.5));
    engine.updateDimensionScore("strategy", { digital_vision: 3 }, []);
    const dim = engine.getSession().dimensions.strategy;
    // 2 × 0.5 = 1.0 strength-units / 3 threshold = ~0.33
    expect(dim.criterionConfidence.digital_vision).toBeCloseTo(1 / 3, 1);
  });

  it("caps criterion confidence at 1", () => {
    const engine = new AssessmentEngine();
    for (let i = 0; i < 6; i++) engine.addEvidence(evidenceInput("strategy", "digital_vision", 1.0));
    engine.updateDimensionScore("strategy", { digital_vision: 5 }, []);
    expect(engine.getSession().dimensions.strategy.criterionConfidence.digital_vision).toBe(1);
  });

  it("document evidence contributes more strength than conversation evidence", () => {
    const engine = new AssessmentEngine();
    engine.addEvidence({ text: "doc", source: "document", dimensionId: "strategy", criterionId: "digital_vision", strength: 0.8 });
    engine.updateDimensionScore("strategy", { digital_vision: 4 }, []);
    const conf = engine.getSession().dimensions.strategy.criterionConfidence.digital_vision;
    // 0.8 / 3 = ~0.27
    expect(conf).toBeGreaterThan(0.25);
    expect(conf).toBeLessThan(0.3);
  });

  it("dimension confidence weights criteria coverage 0.6 and evidence volume 0.4", () => {
    const engine = new AssessmentEngine();
    // 2 of 4 criteria scored → coverage 0.5
    // 6 evidence across the dim with strength 0.5 → 3.0 units / (4 criteria × 3 threshold) → volume factor 0.25
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 0.5));
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 0.5));
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 0.5));
    engine.addEvidence(evidenceInput("strategy", "executive_sponsorship", 0.5));
    engine.addEvidence(evidenceInput("strategy", "executive_sponsorship", 0.5));
    engine.addEvidence(evidenceInput("strategy", "executive_sponsorship", 0.5));
    engine.updateDimensionScore("strategy", { digital_vision: 4, executive_sponsorship: 4 }, []);
    const conf = engine.getSession().dimensions.strategy.confidence;
    // coverage 0.5 × 0.6 + volume 0.25 × 0.4 = 0.3 + 0.1 = 0.4
    expect(conf).toBeCloseTo(0.4, 1);
  });
});
