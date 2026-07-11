import { describe, expect, it } from "vitest";
import { getAssessmentProgress } from "../progress";
import { loadFramework } from "../../framework/config";
import type { AssessmentDelta, DimensionAssessment } from "../types";

const config = loadFramework();

function makeDimension(
  dimensionId: string,
  evidenceCount: number,
  confidence: number
): DimensionAssessment {
  return {
    dimensionId,
    score: confidence > 0 ? 3 : 0,
    confidence,
    evidence: Array.from({ length: evidenceCount }, (_, i) => ({
      id: `${dimensionId}-${i}`,
      text: `${dimensionId} evidence ${i}`,
      source: "conversation",
      dimensionId,
      timestamp: i,
    })),
    gaps: [],
    criterionScores: {},
    criterionConfidence: {},
  };
}

function makeDelta(entries: Record<string, { evidence: number; confidence: number }>): AssessmentDelta {
  const dimensions = Object.fromEntries(
    config.dimensions.map((dim) => {
      const entry = entries[dim.id] ?? { evidence: 0, confidence: 0 };
      return [dim.id, makeDimension(dim.id, entry.evidence, entry.confidence)];
    })
  );
  const dimensionsAssessed = Object.values(dimensions).filter(
    (dim) => dim.confidence >= config.confidenceThreshold
  ).length;

  return {
    dimensions,
    aiReadiness: { score: 0, components: {} },
    signalsCollected: Object.values(dimensions).reduce(
      (sum, dim) => sum + dim.evidence.length,
      0
    ),
    dimensionsAssessed,
    dimensionsRemaining: config.dimensions.length - dimensionsAssessed,
    nextFocus: "",
    orgProfile: {
      name: "",
      industry: "",
      size: "mid-market",
      geography: "",
      regulatoryEnvironment: [],
      existingInitiatives: [],
      constraints: {},
    },
    frameworkVersion: config.version,
    benchmark: { overall: null, byDimension: {} },
  };
}

describe("getAssessmentProgress", () => {
  it("reports an empty collecting state for a fresh assessment", () => {
    const progress = getAssessmentProgress(null, config);

    expect(progress.percent).toBe(0);
    expect(progress.informationRemaining).toBe(21);
    expect(progress.label).toBe("Collecting");
  });

  it("counts remaining information against the framework evidence threshold", () => {
    const progress = getAssessmentProgress(
      makeDelta({
        strategy: { evidence: 3, confidence: 0.7 },
        technology: { evidence: 1, confidence: 0.2 },
      }),
      config
    );

    expect(progress.percent).toBe(19);
    expect(progress.informationRemaining).toBe(17);
    expect(progress.dimensionsAssessed).toBe(1);
    expect(progress.label).toBe("Collecting");
  });

  it("shows ready when all dimensions are assessed", () => {
    const progress = getAssessmentProgress(
      makeDelta(
        Object.fromEntries(
          config.dimensions.map((dim) => [dim.id, { evidence: 3, confidence: 0.7 }])
        )
      ),
      config
    );

    expect(progress.percent).toBe(100);
    expect(progress.informationRemaining).toBe(0);
    expect(progress.label).toBe("Ready");
  });

  it("shows improving after the complete assessment gains extra evidence", () => {
    const progress = getAssessmentProgress(
      makeDelta(
        Object.fromEntries(
          config.dimensions.map((dim, index) => [
            dim.id,
            { evidence: index === 0 ? 5 : 3, confidence: 0.8 },
          ])
        )
      ),
      config
    );

    expect(progress.percent).toBe(100);
    expect(progress.informationRemaining).toBe(0);
    expect(progress.label).toBe("Improving");
  });
});
