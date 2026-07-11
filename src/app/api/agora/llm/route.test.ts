import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { runAgentTurn } from "@/lib/assessment/agent";
import { createAgoraLlmToken } from "@/lib/agora/shared-context";
import { getDemoDelta } from "@/lib/demo/demo-delta";

vi.mock("@/lib/assessment/agent", () => ({ runAgentTurn: vi.fn() }));

function request(options: { sessionId?: string; token?: string; stream?: boolean } = {}) {
  const sessionId = options.sessionId ?? "shared-session";
  return new Request(
    `https://navigator.example/api/agora/llm?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.token ?? createAgoraLlmToken(sessionId)}`,
      },
      body: JSON.stringify({
        model: "ai-navigator",
        stream: options.stream ?? false,
        messages: [
          { role: "system", content: "Agora instructions" },
          { role: "user", content: "Our CEO reviews AI outcomes every month." },
        ],
      }),
    }
  );
}

describe("POST /api/agora/llm", () => {
  beforeEach(() => {
    process.env.AGORA_APP_CERTIFICATE = "test-app-certificate";
    vi.clearAllMocks();
    vi.mocked(runAgentTurn).mockResolvedValue({
      message: "That gives us useful leadership evidence. How is AI funding governed?",
      assessment: getDemoDelta(),
      isComplete: false,
      toolCalls: [],
    });
  });

  it("runs Agora speech through the shared assessment agent", async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(runAgentTurn).toHaveBeenCalledWith(
      "Our CEO reviews AI outcomes every month.",
      expect.anything()
    );
    expect(body.choices[0].message.content).toMatch(/leadership evidence/);
  });

  it("returns OpenAI-compatible server-sent events when Agora requests streaming", async () => {
    const response = await POST(request({ stream: true }));
    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain("chat.completion.chunk");
    expect(body).toContain("leadership evidence");
    expect(body).toContain("data: [DONE]");
  });

  it("rejects calls without the per-session bearer token", async () => {
    const response = await POST(request({ token: "invalid" }));
    expect(response.status).toBe(401);
    expect(runAgentTurn).not.toHaveBeenCalled();
  });
});

