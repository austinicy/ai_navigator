import { FrameworkConfig } from "../framework/types";
import { OrgProfile } from "./types";

const SIZE_ADJUSTMENT: Record<OrgProfile["size"], number> = {
  startup: -0.3,
  smb: -0.15,
  "mid-market": 0,
  enterprise: 0.2,
};

// Industries that tend to score higher on governance/infra (regulated).
const HIGH_REGULATION = new Set(["finance", "banking", "insurance", "healthcare", "pharma", "government"]);

function normIndustry(industry: string): string {
  return industry.trim().toLowerCase();
}

/**
 * Estimate an industry benchmark from the framework's per-criterion
 * benchmarkTarget values, adjusted for org size and industry regulation level.
 * This is a transparent, deterministic estimate (not an LLM call) so the
 * report and the agent agree on the number. Replaces the hardcoded 3.2.
 */
export function estimateIndustryBenchmark(
  industry: string,
  size: OrgProfile["size"],
  config: FrameworkConfig
): { overall: number; byDimension: Record<string, number> } {
  const sizeAdj = SIZE_ADJUSTMENT[size] ?? 0;
  const regAdj = HIGH_REGULATION.has(normIndustry(industry)) ? 0.15 : 0;

  const byDimension: Record<string, number> = {};
  let sum = 0;
  let count = 0;
  for (const dim of config.dimensions) {
    if (dim.includeInOverall === false) continue;
    const targets = dim.criteria.map((c) => c.benchmarkTarget).filter((t): t is number => t !== undefined);
    if (targets.length === 0) {
      byDimension[dim.id] = 3; // neutral fallback
    } else {
      const avg = targets.reduce((a, b) => a + b, 0) / targets.length;
      const adjusted = Math.max(1, Math.min(5, avg + sizeAdj + regAdj));
      byDimension[dim.id] = Math.round(adjusted * 10) / 10;
    }
    sum += byDimension[dim.id];
    count++;
  }
  const overall = count > 0 ? Math.round((sum / count) * 10) / 10 : 3;
  return { overall, byDimension };
}
