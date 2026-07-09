import { describe, it, expect } from "vitest";
import {
  normalizeAnthropicResponse,
  normalizeOpenAIResponse,
  toOpenAITool,
  assistantToolCallMessage,
  toolResultMessage,
} from "../client";
import { agentTools } from "../../assessment/tools";
import type { LLMChatResult } from "../types";

describe("normalizeAnthropicResponse", () => {
  it("extracts text from a text-only response", () => {
    const fakeResponse = {
      stop_reason: "end_turn" as const,
      content: [{ type: "text" as const, text: "Hello there!" }],
    };
    const result = normalizeAnthropicResponse(fakeResponse);
    expect(result.text).toBe("Hello there!");
    expect(result.toolCalls).toEqual([]);
    expect(result.stopReason).toBe("end_turn");
  });

  it("extracts tool calls from a tool_use response", () => {
    const fakeResponse = {
      stop_reason: "tool_use" as const,
      content: [
        { type: "text" as const, text: "Let me calculate that." },
        {
          type: "tool_use" as const,
          id: "tu_001",
          name: "calculate_score",
          input: { dimensionId: "strategy", criterionScores: { a: 3 }, gaps: [] },
        },
      ],
    };
    const result = normalizeAnthropicResponse(fakeResponse);
    expect(result.text).toBe("Let me calculate that.");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0]).toEqual({
      id: "tu_001",
      name: "calculate_score",
      input: { dimensionId: "strategy", criterionScores: { a: 3 }, gaps: [] },
    });
    expect(result.stopReason).toBe("tool_use");
  });

  it("concatenates multiple text blocks", () => {
    const fakeResponse = {
      stop_reason: "end_turn" as const,
      content: [
        { type: "text" as const, text: "Part 1. " },
        { type: "text" as const, text: "Part 2." },
      ],
    };
    const result = normalizeAnthropicResponse(fakeResponse);
    expect(result.text).toBe("Part 1. Part 2.");
  });

  it("handles multiple tool calls in one response", () => {
    const fakeResponse = {
      stop_reason: "tool_use" as const,
      content: [
        { type: "tool_use" as const, id: "tu_1", name: "calculate_score", input: { a: 1 } },
        { type: "tool_use" as const, id: "tu_2", name: "update_org_profile", input: { b: 2 } },
      ],
    };
    const result = normalizeAnthropicResponse(fakeResponse);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls[0].name).toBe("calculate_score");
    expect(result.toolCalls[1].name).toBe("update_org_profile");
  });

  it("treats null stop_reason as end_turn", () => {
    const fakeResponse = {
      stop_reason: null,
      content: [{ type: "text" as const, text: "Hi" }],
    };
    const result = normalizeAnthropicResponse(fakeResponse);
    expect(result.stopReason).toBe("end_turn");
  });

  it("treats max_tokens stop_reason as end_turn", () => {
    const fakeResponse = {
      stop_reason: "max_tokens",
      content: [{ type: "text" as const, text: "..." }],
    };
    const result = normalizeAnthropicResponse(fakeResponse);
    expect(result.stopReason).toBe("end_turn");
  });
});

describe("normalizeOpenAIResponse", () => {
  it("extracts text from a text-only response", () => {
    const fakeResponse = {
      choices: [
        {
          finish_reason: "stop",
          message: { content: "Hello from OpenAI!" },
        },
      ],
    };
    const result = normalizeOpenAIResponse(fakeResponse);
    expect(result.text).toBe("Hello from OpenAI!");
    expect(result.toolCalls).toEqual([]);
    expect(result.stopReason).toBe("end_turn");
  });

  it("extracts tool calls from a tool_calls response", () => {
    const fakeResponse = {
      choices: [
        {
          finish_reason: "tool_calls",
          message: {
            content: "I'll calculate that.",
            tool_calls: [
              {
                id: "call_001",
                function: {
                  name: "calculate_score",
                  arguments: JSON.stringify({ dimensionId: "strategy", gaps: ["x"] }),
                },
              },
            ],
          },
        },
      ],
    };
    const result = normalizeOpenAIResponse(fakeResponse);
    expect(result.text).toBe("I'll calculate that.");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0]).toEqual({
      id: "call_001",
      name: "calculate_score",
      input: { dimensionId: "strategy", gaps: ["x"] },
    });
    expect(result.stopReason).toBe("tool_use");
  });

  it("parses tool call arguments from JSON string", () => {
    const fakeResponse = {
      choices: [
        {
          finish_reason: "tool_calls",
          message: {
            content: null,
            tool_calls: [
              {
                id: "call_1",
                function: {
                  name: "update_org_profile",
                  arguments: '{"name":"Acme","industry":"Tech"}',
                },
              },
            ],
          },
        },
      ],
    };
    const result = normalizeOpenAIResponse(fakeResponse);
    expect(result.toolCalls[0].input).toEqual({ name: "Acme", industry: "Tech" });
  });

  it("handles malformed tool call arguments gracefully (empty object)", () => {
    const fakeResponse = {
      choices: [
        {
          finish_reason: "tool_calls",
          message: {
            content: null,
            tool_calls: [
              {
                id: "call_bad",
                function: { name: "calculate_score", arguments: "not valid json" },
              },
            ],
          },
        },
      ],
    };
    const result = normalizeOpenAIResponse(fakeResponse);
    expect(result.toolCalls[0].input).toEqual({});
  });

  it("handles null content as empty string", () => {
    const fakeResponse = {
      choices: [
        {
          finish_reason: "tool_calls",
          message: { content: null, tool_calls: [] },
        },
      ],
    };
    const result = normalizeOpenAIResponse(fakeResponse);
    expect(result.text).toBe("");
  });

  it("handles multiple tool calls", () => {
    const fakeResponse = {
      choices: [
        {
          finish_reason: "tool_calls",
          message: {
            content: "",
            tool_calls: [
              { id: "c1", function: { name: "calculate_score", arguments: "{}" } },
              { id: "c2", function: { name: "estimate_benchmark", arguments: '{"industry":"retail"}' } },
            ],
          },
        },
      ],
    };
    const result = normalizeOpenAIResponse(fakeResponse);
    expect(result.toolCalls).toHaveLength(2);
    expect(result.toolCalls[1].input).toEqual({ industry: "retail" });
  });

  it("returns end_turn when no choices", () => {
    const result = normalizeOpenAIResponse({ choices: [] });
    expect(result.text).toBe("");
    expect(result.toolCalls).toEqual([]);
    expect(result.stopReason).toBe("end_turn");
  });

  it("maps finish_reason stop → end_turn, tool_calls → tool_use", () => {
    const stopResp = { choices: [{ finish_reason: "stop", message: { content: "done" } }] };
    const toolResp = { choices: [{ finish_reason: "tool_calls", message: { content: "", tool_calls: [] } }] };
    expect(normalizeOpenAIResponse(stopResp).stopReason).toBe("end_turn");
    expect(normalizeOpenAIResponse(toolResp).stopReason).toBe("tool_use");
  });
});

describe("toOpenAITool", () => {
  it("maps an LLMTool to the OpenAI function-tool shape", () => {
    const tool = {
      name: "calculate_score",
      description: "Calculate a score",
      input_schema: { type: "object", properties: { a: { type: "string" } } },
    };
    const mapped = toOpenAITool(tool);
    expect(mapped).toEqual({
      type: "function",
      function: {
        name: "calculate_score",
        description: "Calculate a score",
        parameters: { type: "object", properties: { a: { type: "string" } } },
      },
    });
  });

  it("maps all agentTools correctly (input_schema → parameters)", () => {
    for (const tool of agentTools) {
      const mapped = toOpenAITool(tool);
      expect(mapped.type).toBe("function");
      expect(mapped.function.name).toBe(tool.name);
      expect(mapped.function.description).toBe(tool.description);
      expect(mapped.function.parameters).toBe(tool.input_schema);
    }
  });

  it("agentTools includes all 4 expected tools", () => {
    const names = agentTools.map((t) => t.name);
    expect(names).toEqual([
      "calculate_score",
      "update_org_profile",
      "estimate_benchmark",
      "generate_roadmap",
    ]);
  });
});

describe("assistantToolCallMessage", () => {
  it("builds a tool-call assistant message when tool calls are present", () => {
    const result: LLMChatResult = {
      text: "Thinking...",
      toolCalls: [{ id: "tu_1", name: "calculate_score", input: { a: 1 } }],
      stopReason: "tool_use",
    };
    const msg = assistantToolCallMessage(result);
    expect(msg.role).toBe("assistant");
    expect("toolCalls" in msg).toBe(true);
    if ("toolCalls" in msg) {
      expect(msg.content).toBe("Thinking...");
      expect(msg.toolCalls).toHaveLength(1);
    }
  });

  it("builds a plain text assistant message when no tool calls", () => {
    const result: LLMChatResult = {
      text: "All done!",
      toolCalls: [],
      stopReason: "end_turn",
    };
    const msg = assistantToolCallMessage(result);
    expect(msg.role).toBe("assistant");
    expect("toolCalls" in msg).toBe(false);
    if (!("toolCalls" in msg)) {
      expect(msg.content).toBe("All done!");
    }
  });
});

describe("toolResultMessage", () => {
  it("builds a tool-result message with the correct toolCallId", () => {
    const msg = toolResultMessage("tu_123", "calculate_score", '{"success":true}');
    expect(msg.role).toBe("tool");
    if (msg.role === "tool") {
      expect(msg.toolCallId).toBe("tu_123");
      expect(msg.name).toBe("calculate_score");
      expect(msg.content).toBe('{"success":true}');
    }
  });
});
