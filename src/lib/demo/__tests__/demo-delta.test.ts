import { describe, expect, it } from "vitest";
import { getDemoDelta } from "../demo-delta";

describe("getDemoDelta", () => {
  it("builds a complete assessment delta from the saved demo session", () => {
    const delta = getDemoDelta();

    expect(delta.frameworkVersion).toBe("2.0");
    expect(delta.orgProfile.name).toBe("Acme Corporation");
    expect(delta.dimensionsAssessed).toBe(7);
    expect(delta.dimensionsRemaining).toBe(0);
    expect(delta.signalsCollected).toBe(21);
    expect(Object.keys(delta.dimensions)).toHaveLength(7);
  });
});
