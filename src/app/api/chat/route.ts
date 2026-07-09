import { NextRequest, NextResponse } from "next/server";
import { AssessmentEngine } from "@/lib/assessment/engine";
import { runAgentTurn } from "@/lib/assessment/agent";

// Session storage (hackathon: in-memory, single session)
let engine: AssessmentEngine | null = null;

function getEngine(): AssessmentEngine {
  if (!engine) {
    engine = new AssessmentEngine();
  }
  return engine;
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();
    const currentEngine = sessionId ? getEngine() : new AssessmentEngine();
    if (!sessionId) engine = currentEngine;

    const response = await runAgentTurn(message, currentEngine);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
