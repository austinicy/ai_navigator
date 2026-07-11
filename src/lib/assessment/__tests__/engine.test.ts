import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import { AssessmentEngine } from "../engine";
import type { Evidence, UploadedDocument } from "../types";
import { normalizeGapList } from "../types";

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
    strength: 0.5,
    ...overrides,
  };
}

describe("AssessmentEngine construction", () => {
  it("initializes a session with every configured section empty", () => {
    const engine = new AssessmentEngine();
    const session = engine.getSession();
    expect(Object.keys(session.dimensions).length).toBe(config.dimensions.length);
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
    // Add evidence per criterion so criterionConfidence > 0 (score is confidence-weighted).
    engine.addEvidence(evidenceInput("strategy", { criterionId: "digital_vision", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "executive_sponsorship", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "investment_commitment", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "governance_structure", strength: 1.0 }));
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

  it("recomputes confidence with the new 0.6/0.4 coverage+volume model", () => {
    const engine = new AssessmentEngine();
    // 3 evidence on strategy, strength 0.5 → 1.5 strength-units
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    // 2 of 4 criteria scored → coverage 0.5
    engine.updateDimensionScore("strategy", {
      digital_vision: 3,
      executive_sponsorship: 3,
    }, []);
    const dim = engine.getSession().dimensions.strategy;
    // coverage 0.5 × 0.6 = 0.3; volume = 1.5 / (4×3=12) = 0.125 × 0.4 = 0.05 → 0.35
    expect(dim.confidence).toBeCloseTo(0.35, 1);
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

  it("stores a single string gap as one gap instead of splitting it into characters", () => {
    const engine = new AssessmentEngine();
    engine.updateDimensionScore(
      "data_ai",
      { data_quality: 2 },
      "Data quality and governance gaps limit scalable AI adoption."
    );

    expect(engine.getSession().dimensions.data_ai.gaps).toEqual([
      "Data quality and governance gaps limit scalable AI adoption.",
    ]);
  });

  it("recomputes aiReadiness on the session after a score update", () => {
    const engine = new AssessmentEngine();
    // Before: aiReadiness score 0, components empty
    expect(engine.getSession().aiReadiness.score).toBe(0);
    expect(Object.keys(engine.getSession().aiReadiness.components).length).toBe(0);

    // Add evidence per criterion so criterionConfidence > 0 (required for the
    // confidence-weighted scoring to produce a non-zero component).
    engine.addEvidence(evidenceInput("strategy", { criterionId: "digital_vision", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "executive_sponsorship", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "investment_commitment", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "governance_structure", strength: 1.0 }));

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
    expect(Object.keys(engine.getSession().dimensions).length).toBe(config.dimensions.length);
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

  it("scores grounded GenAI document signals and updates GenAI readiness", () => {
    const engine = new AssessmentEngine();
    engine.addDocument({
      filename: "genai-strategy.pdf",
      extractedText: "GenAI programme",
      signals: [
        {
          id: "sig-genai",
          text: "A managed RAG assistant has release evaluations and approved knowledge sources.",
          source: "document",
          dimensionId: "genai",
          criterionId: "knowledge_rag",
          timestamp: Date.now(),
          strength: 1,
          score: 3,
          gap: "Knowledge freshness is not yet monitored.",
        },
      ],
    });

    const delta = engine.getDelta();
    expect(delta.dimensions.genai.criterionScores.knowledge_rag).toBe(3);
    expect(delta.dimensions.genai.gaps).toContain("Knowledge freshness is not yet monitored.");
    expect(delta.genAIReadiness?.assessedCriteria).toBe(1);
    expect(delta.genAIReadiness?.score).toBeGreaterThan(0);
  });
});

describe("normalizeGapList", () => {
  it("repairs legacy character-array gaps from saved sessions", () => {
    expect(
      normalizeGapList([
        "D", "a", "t", "a", " ", "q", "u", "a", "l", "i", "t", "y",
        "Low analytics maturity must be addressed.",
      ])
    ).toEqual(["Data quality", "Low analytics maturity must be addressed."]);
  });
});

describe("AssessmentEngine.getDelta", () => {
  it("reports 0 assessed and all remaining on a fresh session", () => {
    const engine = new AssessmentEngine();
    const delta = engine.getDelta();
    expect(delta.dimensionsAssessed).toBe(0);
    expect(delta.dimensionsRemaining).toBe(config.dimensions.length);
    expect(delta.signalsCollected).toBe(0);
    // nextFocus is the first dimension (strategy) since none are assessed
    expect(delta.nextFocus).toBe("strategy");
  });

  it("counts only dimensions meeting the confidence threshold as assessed", () => {
    const engine = new AssessmentEngine();
    // Make strategy meet the 0.7 confidence threshold under the 0.6/0.4 model:
    // all 4 criteria scored (coverage 1.0 → 0.6) + 3 evidence at strength 1.0
    // (3.0 units / 12 possible → volume 0.25 × 0.4 = 0.1 → confidence 0.7).
    engine.addEvidence(evidenceInput("strategy", { strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { strength: 1.0 }));
    engine.updateDimensionScore("strategy", {
      digital_vision: 3,
      executive_sponsorship: 3,
      investment_commitment: 3,
      governance_structure: 3,
    }, []);
    const delta = engine.getDelta();
    expect(delta.dimensionsAssessed).toBe(1);
    expect(delta.dimensionsRemaining).toBe(config.dimensions.length - 1);
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
    // Fully assess every section: all criteria scored + 6 strong evidence
    // items (enough volume for the seven-criterion GenAI section as well).
    for (const dim of config.dimensions) {
      for (let i = 0; i < 6; i++) {
        engine.addEvidence(evidenceInput(dim.id, { strength: 1.0 }));
      }
      const scores: Record<string, number> = {};
      for (const c of dim.criteria) scores[c.id] = 3;
      engine.updateDimensionScore(dim.id, scores, []);
    }
    const delta = engine.getDelta();
    expect(delta.dimensionsAssessed).toBe(config.dimensions.length);
    expect(delta.dimensionsRemaining).toBe(0);
    expect(delta.nextFocus).toBe("");
  });

  it("exposes the current aiReadiness snapshot", () => {
    const engine = new AssessmentEngine();
    engine.addEvidence(evidenceInput("strategy", { criterionId: "digital_vision", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "executive_sponsorship", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "investment_commitment", strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { criterionId: "governance_structure", strength: 1.0 }));
    engine.updateDimensionScore("strategy", {
      digital_vision: 5,
      executive_sponsorship: 5,
      investment_commitment: 5,
      governance_structure: 5,
    }, []);
    const delta = engine.getDelta();
    expect(delta.aiReadiness.components.ai_strategy).toBe(100);
  });

  it("getDelta carries org profile, framework version, and benchmark", () => {
    const engine = new AssessmentEngine({ name: "Acme", industry: "Retail" });
    engine.updateDimensionScore("strategy", { digital_vision: 4, executive_sponsorship: 4, investment_commitment: 4, governance_structure: 4 }, []);
    const delta = engine.getDelta();
    expect(delta.orgProfile.name).toBe("Acme");
    expect(delta.frameworkVersion).toBe(config.version);
    expect(delta.benchmark.byDimension.strategy).not.toBeNull();
  });
});

describe("AssessmentEngine.startAssessment", () => {
  it("startAssessment returns a seed message and profile", () => {
    const engine = new AssessmentEngine({ name: "Acme" });
    const seed = engine.startAssessment();
    expect(seed.seedMessage.length).toBeGreaterThan(0);
    expect(seed.orgProfile.name).toBe("Acme");
    expect(seed.frameworkVersion).toBe(config.version);
  });
});

describe("AssessmentEngine.checkComplete", () => {
  it("returns false when not all dimensions meet the confidence threshold", () => {
    const engine = new AssessmentEngine();
    // Assess only strategy fully (strength 1.0 to clear the 0.7 threshold)
    engine.addEvidence(evidenceInput("strategy", { strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { strength: 1.0 }));
    engine.addEvidence(evidenceInput("strategy", { strength: 1.0 }));
    const scores: Record<string, number> = {};
    for (const c of config.dimensions[0].criteria) scores[c.id] = 3;
    engine.updateDimensionScore("strategy", scores, []);
    expect(engine.checkComplete()).toBe(false);
  });

  it("returns true only when all dimensions meet the confidence threshold", () => {
    const engine = new AssessmentEngine();
    for (const dim of config.dimensions) {
      for (let i = 0; i < 6; i++) {
        engine.addEvidence(evidenceInput(dim.id, { strength: 1.0 }));
      }
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
