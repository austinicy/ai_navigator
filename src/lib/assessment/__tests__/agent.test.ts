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

    expect(prompt).toContain("Dimensions assessed: 0/7");
    expect(prompt).toContain("Dimensions remaining: 7");
  });

  it("includes the framework version and all 7 dimensions", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toContain("Framework v2.0");
    expect(prompt).toContain("Strategy & Leadership");
    expect(prompt).toContain("Customer Experience");
  });

  it("instructs the agent to lead the conversation and ask the first question", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toMatch(/lead the conversation/i);
    expect(prompt).toMatch(/ask.*first.*question|first.*targeted.*question/i);
  });

  it("surfaces the org profile when known", () => {
    const engine = new AssessmentEngine({ name: "Acme", industry: "Retail" });
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("Retail");
  });

  it("includes the dependency-map guidance", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toMatch(/dependenc/i);
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
    // Use strength 1.0 so the dimension clears the 0.7 confidence threshold
    // under the 0.6/0.4 coverage+volume model.
    for (let i = 0; i < 3; i++) {
      engine.addEvidence({
        text: `evidence ${i}`,
        source: "conversation",
        dimensionId: "strategy",
        criterionId: strategy.criteria[i].id,
        strength: 1.0,
      });
    }
    const scores: Record<string, number> = {};
    for (const c of strategy.criteria) scores[c.id] = 4;
    engine.updateDimensionScore("strategy", scores, []);

    const prompt = buildSystemPrompt(engine);

    expect(prompt).toContain("Dimensions assessed: 1/7");
    expect(prompt).toContain("Dimensions remaining: 6");
    // Next unassessed dimension is the second one (technology).
    const nextId = config.dimensions[1].id;
    expect(prompt).toContain(`Next focus: ${nextId}`);
  });

  it("leaves no unresolved placeholder tokens in the prompt", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);

    expect(prompt).not.toContain("{FRAMEWORK_VERSION}");
    expect(prompt).not.toContain("{FRAMEWORK_DIMENSIONS}");
    expect(prompt).not.toContain("{DIMENSIONS_ASSESSED}");
    expect(prompt).not.toContain("{DIMENSIONS_REMAINING}");
    expect(prompt).not.toContain("{NEXT_FOCUS}");
    expect(prompt).not.toContain("{ORG_PROFILE}");
    expect(prompt).not.toContain("{CURRENT_SCORES}");
    expect(prompt).not.toContain("{INDUSTRY_BENCHMARK}");
  });
});
