import { describe, it, expect } from "vitest";
import { agentTools } from "../tools";

// The agentTools array is an untyped literal, so TypeScript infers each tool's
// `input_schema.properties` loosely (property access comes back as possibly
// undefined under strict). These helpers give us a typed view for assertions
// without altering the production source.
interface SchemaProperty {
  type?: string;
  enum?: readonly unknown[];
  items?: SchemaProperty;
  additionalProperties?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
}

type PropMap = Record<string, SchemaProperty>;

function propsOf(toolName: string): PropMap {
  const tool = agentTools.find((t) => t.name === toolName)!;
  return tool.input_schema.properties as unknown as PropMap;
}

function toolNamed(toolName: string) {
  return agentTools.find((t) => t.name === toolName)!;
}

describe("agentTools", () => {
  it("defines exactly 4 tools", () => {
    expect(agentTools).toHaveLength(4);
  });

  it("has the expected tool names", () => {
    const names = agentTools.map((t) => t.name);
    expect(names).toEqual([
      "calculate_score",
      "update_org_profile",
      "estimate_benchmark",
      "generate_roadmap",
    ]);
  });

  it("every tool has a description and an input_schema", () => {
    for (const tool of agentTools) {
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.input_schema).toBeDefined();
      expect(tool.input_schema.type).toBe("object");
    }
  });

  describe("calculate_score", () => {
    const tool = toolNamed("calculate_score");
    const props = propsOf("calculate_score");

    it("requires dimensionId, criterionScores, gaps, and evidence", () => {
      expect(tool.input_schema.required).toEqual([
        "dimensionId",
        "criterionScores",
        "gaps",
        "evidence",
      ]);
    });

    it("defines dimensionId as a string", () => {
      expect(props.dimensionId.type).toBe("string");
    });

    it("defines criterionScores as an object with numeric additionalProperties", () => {
      expect(props.criterionScores.type).toBe("object");
      expect(props.criterionScores.additionalProperties).toEqual({
        type: "number",
      });
    });

    it("defines gaps as an array of strings", () => {
      expect(props.gaps.type).toBe("array");
      expect(props.gaps.items).toEqual({ type: "string" });
    });

    it("defines evidence as an array of criterion-linked observations", () => {
      expect(props.evidence.type).toBe("array");
      expect(props.evidence.items?.type).toBe("object");
      expect(props.evidence.items?.properties?.text.type).toBe("string");
      expect(props.evidence.items?.properties?.criterionId.type).toBe("string");
      expect(props.evidence.items?.properties?.strength.type).toBe("number");
    });
  });

  describe("update_org_profile", () => {
    const tool = toolNamed("update_org_profile");
    const props = propsOf("update_org_profile");

    it("has no required array (all fields optional)", () => {
      expect(tool.input_schema.required).toBeUndefined();
    });

    it("defines the size enum with the four size categories", () => {
      expect(props.size.enum).toEqual([
        "startup",
        "smb",
        "mid-market",
        "enterprise",
      ]);
    });

    it("defines the budget enum", () => {
      expect(props.constraints.properties!.budget.enum).toEqual([
        "low",
        "medium",
        "high",
      ]);
    });

    it("defines the timeline enum", () => {
      expect(props.constraints.properties!.timeline.enum).toEqual([
        "aggressive",
        "moderate",
        "flexible",
      ]);
    });

    it("defines the talentAvailability enum", () => {
      expect(
        props.constraints.properties!.talentAvailability.enum
      ).toEqual(["scarce", "moderate", "abundant"]);
    });

    it("defines existingInitiatives as an array of strings", () => {
      expect(props.existingInitiatives.type).toBe("array");
      expect(props.existingInitiatives.items).toEqual({ type: "string" });
    });
  });

  describe("estimate_benchmark", () => {
    const tool = toolNamed("estimate_benchmark");
    const props = propsOf("estimate_benchmark");

    it("requires industry", () => {
      expect(tool.input_schema.required).toEqual(["industry"]);
    });

    it("defines industry and size as strings", () => {
      expect(props.industry.type).toBe("string");
      expect(props.size.type).toBe("string");
    });
  });

  describe("generate_roadmap", () => {
    const tool = toolNamed("generate_roadmap");
    const props = propsOf("generate_roadmap");

    it("requires orgName and industry", () => {
      expect(tool.input_schema.required).toEqual(["orgName", "industry"]);
    });

    it("defines orgName, industry, and focusArea as strings", () => {
      expect(props.orgName.type).toBe("string");
      expect(props.industry.type).toBe("string");
      expect(props.focusArea.type).toBe("string");
    });
  });
});
