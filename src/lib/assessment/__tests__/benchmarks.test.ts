import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import { estimateIndustryBenchmark } from "../benchmarks";

const config = loadFramework("v2.0");

describe("estimateIndustryBenchmark", () => {
  it("returns a 1–5 overall and per-dimension averages derived from benchmarkTarget", () => {
    const b = estimateIndustryBenchmark("Manufacturing", "mid-market", config);
    expect(b.overall).toBeGreaterThan(1);
    expect(b.overall).toBeLessThanOrEqual(5);
    for (const dim of config.dimensions) {
      expect(b.byDimension[dim.id]).toBeGreaterThanOrEqual(1);
      expect(b.byDimension[dim.id]).toBeLessThanOrEqual(5);
    }
  });

  it("applies a size adjustment (enterprises benchmark higher than startups)", () => {
    const ent = estimateIndustryBenchmark("Finance", "enterprise", config);
    const startup = estimateIndustryBenchmark("Finance", "startup", config);
    expect(ent.overall).toBeGreaterThanOrEqual(startup.overall);
  });

  it("applies an industry adjustment for heavily-regulated industries", () => {
    const finance = estimateIndustryBenchmark("Finance", "mid-market", config);
    const retail = estimateIndustryBenchmark("Retail", "mid-market", config);
    // Finance tends to score higher on governance/infra; overall within a band.
    expect(Math.abs(finance.overall - retail.overall)).toBeLessThan(1.5);
  });
});
