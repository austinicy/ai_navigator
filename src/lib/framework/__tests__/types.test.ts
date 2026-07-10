// src/lib/framework/__tests__/types.test.ts
import { describe, it, expect } from "vitest";
import { loadFramework } from "../config";

describe("framework v2 types", () => {
  it("loads v2.0 with benchmark targets on at least one criterion", () => {
    const cfg = loadFramework("v2.0");
    const hasBenchmark = cfg.dimensions.some((d) =>
      d.criteria.some((c) => c.benchmarkTarget !== undefined)
    );
    expect(hasBenchmark).toBe(true);
  });

  it("loads v2.0 with a dependency declared on at least one criterion", () => {
    const cfg = loadFramework("v2.0");
    const hasDep = cfg.dimensions.some((d) =>
      d.criteria.some((c) => c.dependsOn && c.dependsOn.length > 0)
    );
    expect(hasDep).toBe(true);
  });

  it("still loads v1.0 for backward-compat tests", () => {
    const cfg = loadFramework("v1.0");
    expect(cfg.dimensions.length).toBe(7);
  });

  it("aiReadinessComponents declare weights in v2.0", () => {
    const cfg = loadFramework("v2.0");
    expect(cfg.aiReadinessComponents.length).toBeGreaterThanOrEqual(6);
    for (const c of cfg.aiReadinessComponents) {
      expect(c.weight).toBeGreaterThan(0);
    }
  });
});
