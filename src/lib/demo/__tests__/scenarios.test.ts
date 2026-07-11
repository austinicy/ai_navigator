import { describe, expect, it } from "vitest";
import { AssessmentEngine } from "../../assessment/engine";
import { demoScenarios, getDemoScenario, seedDemoScenario } from "../scenarios";

describe("continue-ready demo scenarios", () => {
  it("defines multiple distinct, public scenarios", () => {
    expect(demoScenarios).toHaveLength(3);
    expect(new Set(demoScenarios.map((scenario) => scenario.industry)).size).toBe(3);
  });

  it("seeds company context, documents, conversation, and GenAI scoring", () => {
    const scenario = getDemoScenario("northstar-manufacturing");
    expect(scenario).toBeDefined();

    const engine = new AssessmentEngine();
    seedDemoScenario(engine, scenario!);
    const session = engine.getSession();
    const delta = engine.getDelta();

    expect(session.orgProfile.name).toBe("Northstar Components");
    expect(session.documents).toHaveLength(2);
    expect(session.conversationHistory.at(-1)?.content).toBe(scenario!.nextQuestion);
    expect(delta.documentCount).toBe(2);
    expect(delta.dimensions.genai.criterionScores.knowledge_rag).toBe(3);
    expect(delta.genAIReadiness?.score).toBeGreaterThan(0);
  });
});
