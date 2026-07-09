import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import { AssessmentEngine } from "../engine";
import { buildSystemPrompt } from "../agent";

const config = loadFramework();

describe("buildSystemPrompt", () => {
  it("interpolates all 7 dimension names with their criteria", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);

    for (const dim of config.dimensions) {
      expect(prompt).toContain(dim.name);
      // Each criterion name appears inside the dimension listing
      for (const criterion of dim.criteria) {
        expect(prompt).toContain(criterion.name);
      }
    }
  });

  it("shows 0 assessed and 7 remaining for a fresh engine", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);

    expect(prompt).toContain("Dimensions assessed so far: 0");
    expect(prompt).toContain("Dimensions remaining: 7");
  });

  it("points the next focus at the first dimension (strategy) for a fresh engine", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);

    expect(prompt).toContain("Next focus: strategy");
  });

  it("shows 'Not yet gathered' when no org profile is set", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);

    expect(prompt).toContain("Not yet gathered");
  });

  it("renders the org profile when it has been populated", () => {
    const engine = new AssessmentEngine({
      name: "Acme Corp",
      industry: "Manufacturing",
      size: "enterprise",
    });
    const prompt = buildSystemPrompt(engine);

    expect(prompt).toContain("Name: Acme Corp");
    expect(prompt).toContain("Industry: Manufacturing");
    expect(prompt).toContain("Size: enterprise");
    expect(prompt).not.toContain("Not yet gathered");
  });

  it("lists every dimension id with its score in the Current Scores section", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);

    for (const dim of config.dimensions) {
      // Fresh engine → score 0 → "not yet assessed"
      expect(prompt).toContain(`${dim.id}: not yet assessed (confidence: 0%)`);
    }
  });

  it("reflects an updated dimension score in the Current Scores section", () => {
    const engine = new AssessmentEngine();

    // Add evidence + criterion scores for the strategy dimension so it gets a
    // real (non-zero) score and non-zero confidence.
    engine.addEvidence({
      text: "We have a CDO.",
      source: "conversation",
      dimensionId: "strategy",
      criterionId: "executive_sponsorship",
    });
    engine.updateDimensionScore("strategy", { executive_sponsorship: 3 }, []);

    const prompt = buildSystemPrompt(engine);

    // The score line should no longer say "not yet assessed" for strategy.
    expect(prompt).not.toContain("strategy: not yet assessed");
    // It should show the computed score (3.0 for a single criterion scored 3).
    expect(prompt).toContain("strategy: 3.0 (confidence:");
  });

  it("advances assessed/remaining counts and next focus after a dimension is fully assessed", () => {
    const engine = new AssessmentEngine();
    const strategy = config.dimensions.find((d) => d.id === "strategy")!;

    // Add enough evidence (>= evidenceThreshold of 3) and score all criteria.
    for (let i = 0; i < 3; i++) {
      engine.addEvidence({
        text: `evidence ${i}`,
        source: "conversation",
        dimensionId: "strategy",
        criterionId: strategy.criteria[i].id,
      });
    }
    const scores: Record<string, number> = {};
    for (const c of strategy.criteria) scores[c.id] = 4;
    engine.updateDimensionScore("strategy", scores, []);

    const prompt = buildSystemPrompt(engine);

    expect(prompt).toContain("Dimensions assessed so far: 1");
    expect(prompt).toContain("Dimensions remaining: 6");
    // Next unassessed dimension is the second one (technology).
    const nextId = config.dimensions[1].id;
    expect(prompt).toContain(`Next focus: ${nextId}`);
  });

  it("leaves no unresolved placeholder tokens in the prompt", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);

    expect(prompt).not.toContain("{FRAMEWORK_DIMENSIONS}");
    expect(prompt).not.toContain("{DIMENSIONS_ASSESSED}");
    expect(prompt).not.toContain("{DIMENSIONS_REMAINING}");
    expect(prompt).not.toContain("{NEXT_FOCUS}");
    expect(prompt).not.toContain("{ORG_PROFILE}");
    expect(prompt).not.toContain("{CURRENT_SCORES}");
  });
});
