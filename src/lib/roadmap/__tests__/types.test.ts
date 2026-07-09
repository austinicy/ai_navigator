import { describe, it, expect } from "vitest";
import {
  Roadmap,
  RoadmapPhase,
  RoadmapAction,
} from "../types";

describe("roadmap type contracts", () => {
  it("a fully-populated RoadmapAction satisfies the interface", () => {
    const action: RoadmapAction = {
      id: "action-1",
      title: "Establish data governance council",
      description: "Form a cross-functional council to own data policies.",
      dimensionId: "data_ai",
      effort: "low",
      impact: "high",
      urgency: "high",
      successMetrics: ["Council meets monthly", "Policy published in 30 days"],
      dependencies: [],
    };
    expect(action.id).toBe("action-1");
    expect(action.successMetrics).toHaveLength(2);
  });

  it("a RoadmapAction without dependencies is valid (dependencies optional)", () => {
    const action: RoadmapAction = {
      id: "action-2",
      title: "Quick win",
      description: "Low-effort automation.",
      dimensionId: "operations",
      effort: "low",
      impact: "medium",
      urgency: "low",
      successMetrics: ["Cycle time reduced 10%"],
    };
    expect(action.dependencies).toBeUndefined();
  });

  it("a RoadmapPhase contains nested actions", () => {
    const phase: RoadmapPhase = {
      id: "phase-1",
      name: "Foundation",
      timeframe: "0-3 months",
      description: "Build the basics.",
      actions: [
        {
          id: "action-1",
          title: "Gov council",
          description: "x",
          dimensionId: "data_ai",
          effort: "low",
          impact: "high",
          urgency: "high",
          successMetrics: ["m1"],
        },
      ],
    };
    expect(phase.actions).toHaveLength(1);
  });

  it("a Roadmap has phases, quickWins, criticalGaps, and score fields", () => {
    const roadmap: Roadmap = {
      orgName: "Acme",
      industry: "Manufacturing",
      overallScore: 2.5,
      aiReadinessScore: 45,
      phases: [],
      quickWins: [],
      criticalGaps: ["No data governance"],
      generatedAt: Date.now(),
    };
    expect(roadmap.criticalGaps).toEqual(["No data governance"]);
    expect(roadmap.overallScore).toBe(2.5);
  });
});
