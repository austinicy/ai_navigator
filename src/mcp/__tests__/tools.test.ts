import { describe, it, expect } from "vitest";
import { mcpTools } from "../tools";

describe("mcpTools", () => {
  it("defines exactly 10 tools", () => {
    expect(mcpTools).toHaveLength(10);
  });

  it("has the expected tool names in order", () => {
    const expected = [
      "start_assessment",
      "chat",
      "get_scorecard",
      "generate_roadmap",
      "upload_document",
      "read_document",
      "search_knowledge",
      "calculate_score",
      "estimate_benchmark",
      "update_org_profile",
    ];
    expect(mcpTools.map((t) => t.name)).toEqual(expected);
  });

  it("every tool has a name, description, and JSON-schema inputSchema", () => {
    for (const tool of mcpTools) {
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });

  it("chat requires a message", () => {
    const chat = mcpTools.find((t) => t.name === "chat")!;
    expect(chat.inputSchema.required).toEqual(["message"]);
  });

  it("upload_document requires filename and contentBase64", () => {
    const upload = mcpTools.find((t) => t.name === "upload_document")!;
    expect(upload.inputSchema.required).toEqual(["filename", "contentBase64"]);
  });
});
