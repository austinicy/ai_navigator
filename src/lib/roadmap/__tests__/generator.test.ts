import { describe, it, expect } from "vitest";
import { AssessmentEngine } from "../../assessment/engine";
import { loadFramework } from "../../framework/config";
import { parseRoadmapJson } from "../generator";
import { Roadmap } from "../types";

// Build a session with some real dimension scores so overallScore is non-zero
// and deterministic-ish. The engine seeds all 7 dimensions at score 0; we
// score a couple to verify the mean computation.
function makeSession() {
  const engine = new AssessmentEngine({
    name: "Acme Corp",
    industry: "Manufacturing",
    size: "enterprise",
    existingInitiatives: ["cloud migration"],
    constraints: { budget: "medium", timeline: "moderate", talentAvailability: "moderate" },
  });
  const config = engine.getConfig();
  const strategy = config.dimensions.find((d) => d.id === "strategy")!;

  // Add evidence + score the strategy dimension.
  for (const c of strategy.criteria) {
    engine.addEvidence({
      text: `evidence for ${c.id}`,
      source: "conversation",
      dimensionId: "strategy",
      criterionId: c.id,
    });
  }
  const scores: Record<string, number> = {};
  for (const c of strategy.criteria) scores[c.id] = 4;
  engine.updateDimensionScore("strategy", scores, []);

  return { session: engine.getSession(), config };
}

describe("parseRoadmapJson", () => {
  it("parses a well-formed roadmap JSON response into a Roadmap", () => {
    const { session, config } = makeSession();
    const claudeOutput = JSON.stringify({
      phases: [
        {
          id: "phase-1",
          name: "Foundation",
          timeframe: "0-3 months",
          description: "Basics first.",
          actions: [
            {
              id: "action-1",
              title: "Data governance council",
              description: "Form council.",
              dimensionId: "data_ai",
              effort: "low",
              impact: "high",
              urgency: "high",
              successMetrics: ["Monthly meetings"],
              dependencies: [],
            },
          ],
        },
      ],
      quickWins: [
        {
          id: "qw-1",
          title: "Automate reporting",
          description: "x",
          dimensionId: "operations",
          effort: "low",
          impact: "high",
          urgency: "medium",
          successMetrics: ["10h saved/week"],
        },
      ],
      criticalGaps: ["No data governance", "No AI policy"],
    });

    const roadmap = parseRoadmapJson(claudeOutput, session, config);

    expect(roadmap.orgName).toBe("Acme Corp");
    expect(roadmap.industry).toBe("Manufacturing");
    expect(roadmap.phases).toHaveLength(1);
    expect(roadmap.phases[0].actions).toHaveLength(1);
    expect(roadmap.phases[0].actions[0].title).toBe("Data governance council");
    expect(roadmap.quickWins).toHaveLength(1);
    expect(roadmap.quickWins[0].id).toBe("qw-1");
    expect(roadmap.criticalGaps).toEqual(["No data governance", "No AI policy"]);
    expect(roadmap.aiReadinessScore).toBe(session.aiReadiness.score);
    expect(typeof roadmap.generatedAt).toBe("number");
  });

  it("computes overallScore as the mean of all dimension scores", () => {
    const { session, config } = makeSession();
    const text = JSON.stringify({ phases: [], quickWins: [], criticalGaps: [] });

    const roadmap = parseRoadmapJson(text, session, config);

    const expected =
      Object.values(session.dimensions).reduce((s, d) => s + d.score, 0) /
      Object.keys(session.dimensions).length;
    expect(roadmap.overallScore).toBeCloseTo(expected, 5);
    // Strategy was scored at 4; the other 6 stay at 0 → mean = 4/7.
    expect(roadmap.overallScore).toBeCloseTo(4 / 7, 5);
  });

  it("extracts JSON even when wrapped in prose and code fences", () => {
    const { session, config } = makeSession();
    const text = `Here is your roadmap:

\`\`\`json
{"phases":[{"id":"p1","name":"Foundation","timeframe":"0-3 months","description":"d","actions":[]}],"quickWins":[],"criticalGaps":["gap1"]}
\`\`\`

Let me know if you need changes.`;

    const roadmap = parseRoadmapJson(text, session, config);
    expect(roadmap.phases).toHaveLength(1);
    expect(roadmap.criticalGaps).toEqual(["gap1"]);
  });

  it("returns empty phases/quickWins/criticalGaps when no JSON object is found", () => {
    const { session, config } = makeSession();
    const text = `The model returned plain text with no JSON at all.`;

    const roadmap = parseRoadmapJson(text, session, config);
    expect(roadmap.phases).toEqual([]);
    expect(roadmap.quickWins).toEqual([]);
    expect(roadmap.criticalGaps).toEqual([]);
    // overallScore is still computed from the session (not the fallback 0).
    expect(roadmap.overallScore).toBeGreaterThan(0);
  });

  it("returns the fallback roadmap (overallScore 0) when JSON is malformed", () => {
    const { session, config } = makeSession();
    const text = `{this is : not valid JSON ,,,,}`;

    const roadmap: Roadmap = parseRoadmapJson(text, session, config);
    expect(roadmap.orgName).toBe("Acme Corp");
    expect(roadmap.overallScore).toBe(0);
    expect(roadmap.phases).toEqual([]);
    expect(roadmap.quickWins).toEqual([]);
    expect(roadmap.criticalGaps).toEqual([]);
    // aiReadinessScore still surfaces from the session even in fallback.
    expect(roadmap.aiReadinessScore).toBe(session.aiReadiness.score);
  });

  it("defaults missing optional JSON fields to empty arrays", () => {
    const { session, config } = makeSession();
    // Only phases present; quickWins and criticalGaps omitted.
    const text = JSON.stringify({
      phases: [{ id: "p1", name: "x", timeframe: "t", description: "d", actions: [] }],
    });

    const roadmap = parseRoadmapJson(text, session, config);
    expect(roadmap.phases).toHaveLength(1);
    expect(roadmap.quickWins).toEqual([]);
    expect(roadmap.criticalGaps).toEqual([]);
  });
});
