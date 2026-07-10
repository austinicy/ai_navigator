import { describe, it, expect, vi } from "vitest";
import { AssessmentEngine } from "../../assessment/engine";
import { loadFramework } from "../../framework/config";
import { parseRoadmapJson, generateRoadmap } from "../generator";
import { AssessmentSession } from "../../assessment/types";
import { Roadmap } from "../types";

// Mock the LLM client at module top level so the generateRoadmap tests can
// exercise the real prompt-building path without the network. parseRoadmapJson
// never calls complete(), so this mock is inert for the other tests.
// vi.hoisted gives a stable reference shared between the (hoisted) vi.mock
// factory and the test body.
const { mockComplete } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
}));
vi.mock("../../llm/client", () => ({ complete: mockComplete }));

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

describe("generateRoadmap", () => {
  it("does not throw when orgProfile omits existingInitiatives and constraints", async () => {
    // Reproduces the original crash: the client (RoadmapTab) POSTs a minimal
    // orgProfile with only name + industry. generateRoadmap used to throw
    // `Cannot read properties of undefined (reading 'join')` on
    // profile.existingInitiatives.join(...). The LLM client is mocked at the
    // module top level so we exercise the real prompt-building path (where the
    // crash lived) without the network.
    mockComplete.mockResolvedValue(
      JSON.stringify({ phases: [], quickWins: [], criticalGaps: [] })
    );

    const config = loadFramework();
    // Hand-build a session whose orgProfile is missing the optional-at-runtime
    // fields, exactly as RoadmapTab does before the route normalizes it.
    const session = {
      id: "report",
      frameworkVersion: config.version,
      orgProfile: { name: "Acme Corp", industry: "Manufacturing" },
      dimensions: {},
      aiReadiness: { score: 50, components: {} },
      conversationHistory: [],
      documents: [],
      isComplete: true,
      createdAt: 0,
      updatedAt: 0,
    } as unknown as AssessmentSession;

    // Should resolve rather than throw.
    const roadmap = await generateRoadmap(session, config);
    expect(roadmap.phases).toEqual([]);

    // The prompt was built from a profile with no initiatives / no constraints
    // — confirm those fields rendered as the documented fallbacks, proving the
    // guard ran and the crash is gone.
    const prompt = mockComplete.mock.calls[0][0][0].content as string;
    expect(prompt).toContain("Existing Initiatives: none mentioned");
    expect(prompt).toContain("Budget=unknown");
    expect(prompt).toContain("Timeline=unknown");
    expect(prompt).toContain("Talent=unknown");
  });
});
