import { NextResponse } from "next/server";
import { runAgentTurn } from "@/lib/assessment/agent";
import {
  loadOrCreateAssessmentEngine,
  saveAssessmentEngine,
} from "@/lib/assessment/session-repository";
import { verifyAgoraLlmToken } from "@/lib/agora/shared-context";

export const runtime = "nodejs";

interface OpenAIMessage {
  role?: string;
  content?: string | Array<{ type?: string; text?: string }>;
}

interface OpenAIChatRequest {
  messages?: OpenAIMessage[];
  model?: string;
  stream?: boolean;
}

function messageText(content: OpenAIMessage["content"]): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join(" ")
    .trim();
}

function completionPayload(id: string, model: string, content: string) {
  return {
    id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
  };
}

function streamingResponse(id: string, model: string, content: string): Response {
  const encoder = new TextEncoder();
  const created = Math.floor(Date.now() / 1000);
  const stream = new ReadableStream({
    start(controller) {
      const chunk = {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [
          {
            index: 0,
            delta: { role: "assistant", content },
            finish_reason: null,
          },
        ],
      };
      const done = {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(done)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();
  if (!sessionId || !verifyAgoraLlmToken(sessionId, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as OpenAIChatRequest;
    const userMessage = [...(body.messages ?? [])]
      .reverse()
      .find((message) => message.role === "user");
    const content = messageText(userMessage?.content);
    if (!content) {
      return NextResponse.json({ error: "A user message is required" }, { status: 400 });
    }

    const { engine, version } = await loadOrCreateAssessmentEngine(sessionId);
    const result = await runAgentTurn(content, engine);
    await saveAssessmentEngine(sessionId, engine, version);
    const id = `chatcmpl-agora-${Date.now()}`;
    const model = body.model || "ai-navigator";

    return body.stream
      ? streamingResponse(id, model, result.message)
      : NextResponse.json(completionPayload(id, model, result.message));
  } catch (error) {
    console.error("Agora shared LLM error:", error);
    return NextResponse.json(
      { error: { message: "The assessment agent could not complete this turn." } },
      { status: 500 }
    );
  }
}
