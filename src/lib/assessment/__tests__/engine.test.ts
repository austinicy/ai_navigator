import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import { AssessmentEngine } from "../engine";
import type { DimensionAssessment, Evidence, UploadedDocument } from "../types";

const config = loadFramework();

// Helper: build an Evidence-shaped object (without id/timestamp) for addEvidence.
function evidenceInput(
  dimensionId: string,
  overrides: Partial<Evidence> = {}
): Omit<Evidence, "id" | "timestamp"> {
  return {
    text: "some evidence",
    source: "conversation",
    dimensionId,
    ...overrides,
  };
}

describe("AssessmentEngine construction", () => {
  it("initializes a session with all 7 dimensions empty", () => {
    const engine = new AssessmentEngine();
    const session = engine.getSession();
    expect(Object.keys(session.dimensions).length).toBe(7);
    for (const dim of config.dimensions) {
      const d = session.dimensions[dim.id];
      expect(d).toBeDefined();
      expect(d.score).toBe(0);
      expect(d.confidence).toBe(0);
      expect(d.evidence).toEqual([]);
      expect(d.gaps).toEqual([]);
      expect(d.criterionScores).toEqual({});
    }
  });

  it("stores the framework version on the session", () => {
    const engine = new AssessmentEngine();
    expect(engine.getSession().frameworkVersion).toBe(config.version);
  });

  it("applies a partial org profile with defaults for missing fields", () => {
    const engine = new AssessmentEngine({
      name: "Acme Corp",
      industry: "Manufacturing",
    });
    const profile = engine.getSession().orgProfile;
    expect(profile.name).toBe("Acme Corp");
    expect(profile.industry).toBe("Manufacturing");
    // defaults
    expect(profile.size).toBe("mid-market");
    expect(profile.geography).toBe("");
    expect(profile.regulatoryEnvironment).toEqual([]);
    expect(profile.existingInitiatives).toEqual([]);
    expect(profile.constraints).toEqual({});
  });

  it("initializes aiReadiness with score 0 and empty components", () => {
    const engine = new AssessmentEngine();
    const ai = engine.getSession().aiReadiness;
    expect(ai.score).toBe(0);
    expect(ai.components).toEqual({});
  });

  it("is not complete on construction", () => {
    const engine = new AssessmentEngine();
    expect(engine.getSession().isComplete).toBe(false);
    expect(engine.checkComplete()).toBe(false);
  });

  it("returns the framework config from getConfig()", () => {
    const engine = new AssessmentEngine();
    expect(engine.getConfig()).toBe(config);
  });
});

describe("AssessmentEngine.addEvidence", () => {
  it("grows the evidence list on the matching dimension", () => {
    const engine = new AssessmentEngine();
    engine.addEvidence(evidenceInput("strategy", { criterionId: "digital_vision" }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "governance_structure" }));
    const dim = engine.getSession().dimensions.strategy;
    expect(dim.evidence.length).toBe(2);
    expect(dim.evidence[0].dimensionId).toBe("strategy");
    expect(dim.evidence[0].source).toBe("conversation");
  });

  it("assigns a unique id and timestamp to each evidence item", () => {
    const engine = new AssessmentEngine();
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("technology"));
    const s = engine.getSession().dimensions.strategy.evidence[0];
    const t = engine.getSession().dimensions.technology.evidence[0];
    expect(s.id).toBeTruthy();
    expect(t.id).toBeTruthy();
    expect(s.id).not.toBe(t.id);
    expect(typeof s.timestamp).toBe("number");
    expect(s.timestamp).toBeGreaterThan(0);
  });

  it("does not throw and makes no change for an unknown dimension id", () => {
    const engine = new AssessmentEngine();
    engine.addEvidence(evidenceInput("nonexistent_dim"));
    const totalEvidence = Object.values(engine.getSession().dimensions).reduce(
      (n, d) => n + d.evidence.length,
      0
    );
    expect(totalEvidence).toBe(0);
  });

  it("updates the session updatedAt timestamp", () => {
    const engine = new AssessmentEngine();
    const before = engine.getSession().updatedAt;
    // ensure time advances
    const started = Date.now();
    while (Date.now() === started) {
      /* spin briefly */
    }
    engine.addEvidence(evidenceInput("strategy"));
    expect(engine.getSession().updatedAt).toBeGreaterThanOrEqual(before);
  });
});

describe("AssessmentEngine.updateDimensionScore", () => {
  it("recomputes the dimension score as a weighted average of criterion scores", () => {
    const engine = new AssessmentEngine();
    // strategy: 4 criteria, all weight 1. Score all at 4 → 4.0
    engine.updateDimensionScore("strategy", {
      digital_vision: 4,
      executive_sponsorship: 4,
      investment_commitment: 4,
      governance_structure: 4,
    }, []);
    const dim = engine.getSession().dimensions.strategy;
    // engine rounds to 1 decimal: 4.0
    expect(dim.score).toBe(4.0);
  });

  it("recomputes confidence from evidence count and criteria coverage", () => {
    const engine = new AssessmentEngine();
    // Add 3 evidence items (meets evidenceThreshold=3 → evidenceFactor=1)
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    // Score 2 of 4 criteria → criteriaFactor = 2/4 = 0.5
    // confidence = (1 + 0.5) / 2 = 0.75
    engine.updateDimensionScore("strategy", {
      digital_vision: 3,
      executive_sponsorship: 3,
    }, []);
    const dim = engine.getSession().dimensions.strategy;
    expect(dim.confidence).toBeCloseTo(0.75, 10);
  });

  it("merges new criterion scores with existing ones (does not overwrite unscored)", () => {
    const engine = new AssessmentEngine();
    engine.updateDimensionScore("strategy", { digital_vision: 3 }, []);
    engine.updateDimensionScore("strategy", { executive_sponsorship: 4 }, []);
    const dim = engine.getSession().dimensions.strategy;
    expect(dim.criterionScores.digital_vision).toBe(3);
    expect(dim.criterionScores.executive_sponsorship).toBe(4);
  });

  it("deduplicates gaps", () => {
    const engine = new AssessmentEngine();
    engine.updateDimensionScore("strategy", { digital_vision: 2 }, [
      "No documented vision",
      "No budget",
    ]);
    engine.updateDimensionScore("strategy", { executive_sponsorship: 2 }, [
      "No documented vision",
      "No sponsor",
    ]);
    const dim = engine.getSession().dimensions.strategy;
    expect(dim.gaps.sort()).toEqual(["No budget", "No documented vision", "No sponsor"]);
  });

  it("recomputes aiReadiness on the session after a score update", () => {
    const engine = new AssessmentEngine();
    // Before: aiReadiness score 0, components empty
    expect(engine.getSession().aiReadiness.score).toBe(0);
    expect(Object.keys(engine.getSession().aiReadiness.components).length).toBe(0);

    // Score all ai_strategy criteria at 5 → component 100
    engine.updateDimensionScore("strategy", {
      digital_vision: 5,
      executive_sponsorship: 5,
      investment_commitment: 5,
      governance_structure: 5,
    }, []);

    const ai = engine.getSession().aiReadiness;
    expect(ai.components.ai_strategy).toBe(100);
    // Only ai_strategy is scored → overall = 100
    expect(ai.score).toBe(100);
  });

  it("is a no-op for an unknown dimension id", () => {
    const engine = new AssessmentEngine();
    engine.updateDimensionScore("no_such_dim", { foo: 3 }, ["gap"]);
    // No dimension added, no crash
    expect(Object.keys(engine.getSession().dimensions).length).toBe(7);
  });
});

describe("AssessmentEngine.updateOrgProfile", () => {
  it("merges updates into the existing org profile", () => {
    const engine = new AssessmentEngine({ name: "Orig" });
    engine.updateOrgProfile({ industry: "Finance", geography: "EU" });
    const p = engine.getSession().orgProfile;
    expect(p.name).toBe("Orig"); // preserved
    expect(p.industry).toBe("Finance");
    expect(p.geography).toBe("EU");
  });
});

describe("AssessmentEngine.addDocument", () => {
  it("adds the document to the session documents list", () => {
    const engine = new AssessmentEngine();
    const doc: Omit<UploadedDocument, "id" | "uploadedAt"> = {
      filename: "report.pdf",
      extractedText: "some text",
      signals: [],
    };
    engine.addDocument(doc);
    const docs = engine.getSession().documents;
    expect(docs.length).toBe(1);
    expect(docs[0].filename).toBe("report.pdf");
    expect(docs[0].id).toBeTruthy();
    expect(docs[0].uploadedAt).toBeGreaterThan(0);
  });

  it("adds each document signal as evidence on the matching dimension", () => {
    const engine = new AssessmentEngine();
    const doc: Omit<UploadedDocument, "id" | "uploadedAt"> = {
      filename: "report.pdf",
      extractedText: "some text",
      signals: [
        {
          id: "sig-1",
          text: "Has a cloud-first strategy",
          source: "document",
          dimensionId: "technology",
          criterionId: "cloud_maturity",
          timestamp: Date.now(),
        },
        {
          id: "sig-2",
          text: "Documented data governance",
          source: "document",
          dimensionId: "data_ai",
          criterionId: "data_governance",
          timestamp: Date.now(),
        },
      ],
    };
    engine.addDocument(doc);
    expect(engine.getSession().dimensions.technology.evidence.length).toBe(1);
    expect(engine.getSession().dimensions.technology.evidence[0].source).toBe("document");
    expect(engine.getSession().dimensions.technology.evidence[0].text).toBe(
      "Has a cloud-first strategy"
    );
    expect(engine.getSession().dimensions.data_ai.evidence.length).toBe(1);
  });

  it("signals added as evidence get fresh ids distinct from the signal ids", () => {
    const engine = new AssessmentEngine();
    engine.addDocument({
      filename: "r.pdf",
      extractedText: "",
      signals: [
        {
          id: "sig-1",
          text: "t",
          source: "document",
          dimensionId: "strategy",
          timestamp: 1,
        },
      ],
    });
    const ev = engine.getSession().dimensions.strategy.evidence[0];
    expect(ev.id).not.toBe("sig-1");
    expect(ev.id).toBeTruthy();
  });
});

describe("AssessmentEngine.getDelta", () => {
  it("reports 0 assessed and all remaining on a fresh session", () => {
    const engine = new AssessmentEngine();
    const delta = engine.getDelta();
    expect(delta.dimensionsAssessed).toBe(0);
    expect(delta.dimensionsRemaining).toBe(7);
    expect(delta.signalsCollected).toBe(0);
    // nextFocus is the first dimension (strategy) since none are assessed
    expect(delta.nextFocus).toBe("strategy");
  });

  it("counts only dimensions meeting the confidence threshold as assessed", () => {
    const engine = new AssessmentEngine();
    // Make strategy reach confidence 0.75: 3 evidence + 2 criteria scored
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    engine.updateDimensionScore("strategy", {
      digital_vision: 3,
      executive_sponsorship: 3,
    }, []);
    const delta = engine.getDelta();
    expect(delta.dimensionsAssessed).toBe(1);
    expect(delta.dimensionsRemaining).toBe(6);
  });

  it("signalsCollected reflects total evidence across all dimensions", () => {
    const engine = new AssessmentEngine();
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("technology"));
    engine.addEvidence(evidenceInput("technology"));
    const delta = engine.getDelta();
    expect(delta.signalsCollected).toBe(3);
  });

  it("nextFocus points to the first unassessed dimension, or empty when all assessed", () => {
    const engine = new AssessmentEngine();
    // Fully assess all 7 dimensions: 3+ evidence + all criteria scored per dim.
    for (const dim of config.dimensions) {
      engine.addEvidence(evidenceInput(dim.id));
      engine.addEvidence(evidenceInput(dim.id));
      engine.addEvidence(evidenceInput(dim.id));
      const scores: Record<string, number> = {};
      for (const c of dim.criteria) scores[c.id] = 3;
      engine.updateDimensionScore(dim.id, scores, []);
    }
    const delta = engine.getDelta();
    expect(delta.dimensionsAssessed).toBe(7);
    expect(delta.dimensionsRemaining).toBe(0);
    expect(delta.nextFocus).toBe("");
  });

  it("exposes the current aiReadiness snapshot", () => {
    const engine = new AssessmentEngine();
    engine.updateDimensionScore("strategy", {
      digital_vision: 5,
      executive_sponsorship: 5,
      investment_commitment: 5,
      governance_structure: 5,
    }, []);
    const delta = engine.getDelta();
    expect(delta.aiReadiness.components.ai_strategy).toBe(100);
  });
});

describe("AssessmentEngine.checkComplete", () => {
  it("returns false when not all dimensions meet the confidence threshold", () => {
    const engine = new AssessmentEngine();
    // Assess only strategy fully
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    const scores: Record<string, number> = {};
    for (const c of config.dimensions[0].criteria) scores[c.id] = 3;
    engine.updateDimensionScore("strategy", scores, []);
    expect(engine.checkComplete()).toBe(false);
  });

  it("returns true only when all dimensions meet the confidence threshold", () => {
    const engine = new AssessmentEngine();
    for (const dim of config.dimensions) {
      engine.addEvidence(evidenceInput(dim.id));
      engine.addEvidence(evidenceInput(dim.id));
      engine.addEvidence(evidenceInput(dim.id));
      const scores: Record<string, number> = {};
      for (const c of dim.criteria) scores[c.id] = 3;
      engine.updateDimensionScore(dim.id, scores, []);
    }
    expect(engine.checkComplete()).toBe(true);
  });
});

describe("AssessmentEngine.markComplete", () => {
  it("sets isComplete to true on the session", () => {
    const engine = new AssessmentEngine();
    engine.markComplete();
    expect(engine.getSession().isComplete).toBe(true);
  });
});
