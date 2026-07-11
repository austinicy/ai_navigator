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

describe("framework v3 GenAI upgrade", () => {
  const cfg = loadFramework("v3.0");

  it("preserves seven core dimensions and adds a separate GenAI section", () => {
    expect(cfg.dimensions.filter((dimension) => dimension.includeInOverall !== false)).toHaveLength(7);
    const genai = cfg.dimensions.find((dimension) => dimension.id === "genai");
    expect(genai?.includeInOverall).toBe(false);
    expect(genai?.criteria).toHaveLength(7);
  });

  it("defines a weighted GenAI readiness component for every GenAI criterion", () => {
    const components = cfg.genAIReadinessComponents ?? [];
    const ids = new Set(components.map((component) => component.id));
    const criteria = cfg.dimensions.find((dimension) => dimension.id === "genai")!.criteria;
    expect(components).toHaveLength(7);
    for (const criterion of criteria) {
      expect(criterion.genAIReadinessComponent).toBeTruthy();
      expect(ids.has(criterion.genAIReadinessComponent!)).toBe(true);
      expect(criterion.targetLevel).toBeGreaterThanOrEqual(1);
      expect(criterion.targetLevel).toBeLessThanOrEqual(5);
      expect(Object.keys(criterion.levels)).toEqual(["1", "2", "3", "4", "5"]);
    }
  });

  it("uses a structured source ledger and valid criterion source ids", () => {
    const sources = cfg.referenceSources ?? [];
    const sourceIds = new Set(sources.map((source) => source.id));
    expect(sources.length).toBeGreaterThanOrEqual(15);
    for (const source of sources) {
      expect(new URL(source.url).protocol).toBe("https:");
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.scope.length).toBeGreaterThan(0);
    }
    for (const dimension of cfg.dimensions) {
      for (const sourceId of dimension.sourceIds ?? []) {
        expect(sourceIds.has(sourceId), `${dimension.id} references ${sourceId}`).toBe(true);
      }
      for (const criterion of dimension.criteria) {
        for (const sourceId of criterion.sourceIds ?? []) {
          expect(sourceIds.has(sourceId), `${dimension.id}.${criterion.id} references ${sourceId}`).toBe(true);
        }
      }
    }
  });

  it("continues to load historical versions without reinterpretation", () => {
    expect(loadFramework("1.0").version).toBe("1.0");
    expect(loadFramework("2.0").version).toBe("2.0");
    expect(loadFramework("3.0").version).toBe("3.0");
  });
});
