import { NextRequest, NextResponse } from "next/server";
import { runAgentTurn, runAgentKickoff } from "@/lib/assessment/agent";
import {
  loadOrCreateAssessmentEngine,
  saveAssessmentEngine,
} from "@/lib/assessment/session-repository";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }
  const { engine } = await loadOrCreateAssessmentEngine(sessionId);
  return NextResponse.json({
    message: "",
    assessment: engine.getDelta(),
    isComplete: engine.checkComplete(),
    toolCalls: [],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, kickoff, mode } = body;

    if (typeof sessionId !== "string" || !sessionId.trim()) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const normalizedSessionId = sessionId.trim();
    const { engine: currentEngine, version } = await loadOrCreateAssessmentEngine(normalizedSessionId);

    if (mode === "append_voice_assistant") {
      if (typeof message !== "string" || !message.trim()) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
      }
      const content = message.trim();
      const history = currentEngine.getSession().conversationHistory;
      const last = history.at(-1);
      if (last?.role !== "assistant" || last.content !== content) {
        currentEngine.addConversationMessage("assistant", content);
      }
      await saveAssessmentEngine(normalizedSessionId, currentEngine, version);
      return NextResponse.json({
        message: "",
        assessment: currentEngine.getDelta(),
        isComplete: currentEngine.checkComplete(),
        toolCalls: [],
      });
    }

    // Kickoff: agent leads with an opening turn; no user message required.
    if (kickoff) {
      const response = await runAgentKickoff(currentEngine);
      await saveAssessmentEngine(normalizedSessionId, currentEngine, version);
      return NextResponse.json(response);
    }

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await runAgentTurn(message.trim(), currentEngine, {
      assessmentOnly: mode === "assessment_sync",
    });
    await saveAssessmentEngine(normalizedSessionId, currentEngine, version);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
