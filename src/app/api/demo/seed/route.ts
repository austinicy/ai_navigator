import { NextRequest, NextResponse } from "next/server";
import { AssessmentEngine } from "@/lib/assessment/engine";
import { getAssessmentSessionRepository } from "@/lib/assessment/session-repository";
import { getDemoScenario, seedDemoScenario } from "@/lib/demo/scenarios";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: unknown;
    scenarioId?: unknown;
  };
  if (typeof body.sessionId !== "string" || !body.sessionId.trim()) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }
  if (typeof body.scenarioId !== "string") {
    return NextResponse.json({ error: "Scenario ID is required" }, { status: 400 });
  }

  const scenario = getDemoScenario(body.scenarioId);
  if (!scenario) return NextResponse.json({ error: "Demo scenario not found" }, { status: 404 });

  const sessionId = body.sessionId.trim();
  const engine = new AssessmentEngine();
  seedDemoScenario(engine, scenario);
  const repository = getAssessmentSessionRepository();
  const existing = await repository.get(sessionId);
  await repository.save(sessionId, engine.toSnapshot(), existing?.version);
  const session = engine.getSession();
  return NextResponse.json({
    scenario: {
      id: scenario.id,
      companyName: scenario.companyName,
      title: scenario.title,
      progressLabel: scenario.progressLabel,
    },
    assessment: engine.getDelta(),
    messages: session.conversationHistory,
    isComplete: engine.checkComplete(),
  });
}
