import { loadFramework } from "../framework/config";
import type { AssessmentDelta, DimensionAssessment } from "../assessment/types";
import { getDemoSession } from "./demo-data";

export function getDemoDelta(): AssessmentDelta {
  const session = getDemoSession();
  const config = loadFramework(session.frameworkVersion ?? "v2.0");
  const dimensions = session.dimensions as Record<string, DimensionAssessment>;
  const signalsCollected = Object.values(dimensions).reduce(
    (sum, dimension) => sum + dimension.evidence.length,
    0
  );

  return {
    dimensions,
    aiReadiness: session.aiReadiness ?? { score: 0, components: {} },
    signalsCollected,
    dimensionsAssessed: config.dimensions.length,
    dimensionsRemaining: 0,
    nextFocus: "",
    orgProfile: session.orgProfile!,
    frameworkVersion: session.frameworkVersion ?? config.version,
    benchmark: { overall: null, byDimension: {} },
  };
}
