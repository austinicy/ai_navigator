import { describe, it, expect } from "vitest";
import { normalizeOrgProfile } from "../types";

describe("normalizeOrgProfile", () => {
  it("returns full defaults when given no input", () => {
    const profile = normalizeOrgProfile(undefined);
    expect(profile).toEqual({
      name: "",
      industry: "",
      size: "mid-market",
      geography: "",
      regulatoryEnvironment: [],
      existingInitiatives: [],
      constraints: {},
    });
  });

  it("fills in defaults for fields the input omits", () => {
    // Mirrors what RoadmapTab sends: only name + industry.
    const profile = normalizeOrgProfile({ name: "Acme", industry: "Manufacturing" });
    expect(profile.name).toBe("Acme");
    expect(profile.industry).toBe("Manufacturing");
    expect(profile.size).toBe("mid-market");
    expect(profile.existingInitiatives).toEqual([]);
    expect(profile.constraints).toEqual({});
  });

  it("preserves fields the input provides", () => {
    const profile = normalizeOrgProfile({
      name: "Acme",
      industry: "Manufacturing",
      size: "enterprise",
      geography: "Southeast Asia",
      regulatoryEnvironment: ["PDPA"],
      existingInitiatives: ["Cloud migration"],
      constraints: { budget: "medium", timeline: "moderate", talentAvailability: "scarce" },
    });
    expect(profile.size).toBe("enterprise");
    expect(profile.regulatoryEnvironment).toEqual(["PDPA"]);
    expect(profile.existingInitiatives).toEqual(["Cloud migration"]);
    expect(profile.constraints).toEqual({
      budget: "medium",
      timeline: "moderate",
      talentAvailability: "scarce",
    });
  });

  it("defaults existingInitiatives and constraints when explicitly undefined", () => {
    const profile = normalizeOrgProfile({
      name: "Acme",
      existingInitiatives: undefined,
      constraints: undefined,
    });
    expect(profile.existingInitiatives).toEqual([]);
    expect(profile.constraints).toEqual({});
  });
});
