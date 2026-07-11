import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const originalEnv = { ...process.env };

function request(
  url = "https://navigator.example/api/agora/session",
  origin = new URL(url).origin
) {
  return new Request(url, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId: "browser-session" }),
  });
}

describe("POST /api/agora/session", () => {
  beforeEach(() => {
    process.env.AGORA_APP_ID = "app-id";
    process.env.AGORA_APP_CERTIFICATE = "app-certificate";
    process.env.AGORA_CUSTOMER_ID = "customer-id";
    process.env.AGORA_CUSTOMER_SECRET = "customer-secret";
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.LLM_PROVIDER = "openai";
    process.env.LLM_MODEL = "gpt-4o-mini";
    delete process.env.AGORA_CUSTOM_LLM_BASE_URL;
    delete process.env.APP_BASE_URL;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ agent_id: "agent-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it("uses the shared app LLM endpoint on a public HTTPS deployment", async () => {
    const response = await POST(request());
    const body = await response.json();
    const agoraCall = vi.mocked(fetch).mock.calls[0];
    const joinBody = JSON.parse(String((agoraCall[1] as RequestInit).body));

    expect(response.status).toBe(200);
    expect(body.sharedContext).toBe(true);
    expect(joinBody.properties.llm.url).toBe(
      "https://navigator.example/api/agora/llm?sessionId=browser-session"
    );
    expect(joinBody.properties.llm.api_key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses direct-provider compatibility mode on localhost without a tunnel", async () => {
    const response = await POST(request("http://localhost:3000/api/agora/session"));
    const body = await response.json();
    const agoraCall = vi.mocked(fetch).mock.calls[0];
    const joinBody = JSON.parse(String((agoraCall[1] as RequestInit).body));

    expect(response.status).toBe(200);
    expect(body.sharedContext).toBe(false);
    expect(joinBody.properties.llm.url).toBe("https://api.openai.com/v1/chat/completions");
  });

  it("accepts the configured public domain behind a Cloud Run proxy", async () => {
    process.env.APP_BASE_URL = "https://navigator.zhengaustin.com";

    const response = await POST(
      request(
        "https://ai-navigator-web.example.run.app/api/agora/session",
        "https://navigator.zhengaustin.com"
      )
    );

    expect(response.status).toBe(200);
  });
});
