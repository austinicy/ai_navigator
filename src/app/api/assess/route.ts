import { NextResponse } from "next/server";
import { AssessmentEngine } from "@/lib/assessment/engine";
import { getAssessmentSessionRepository } from "@/lib/assessment/session-repository";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const repository = getAssessmentSessionRepository();
  if (request.nextUrl.searchParams.get("history") === "true") {
    const sessions = await repository.list();
    return Response.json({
      sessions: sessions.map((stored) => {
        const engine = AssessmentEngine.fromSnapshot(stored.session);
        const session = engine.getSession();
        return {
          sessionId: stored.sessionId,
          delta: engine.getDelta(),
          orgName: session.orgProfile.name,
          industry: session.orgProfile.industry,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };
      }),
    });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return Response.json({ error: "Session ID is required" }, { status: 400 });
  }

  const stored = await repository.get(sessionId);
  if (!stored) {
    return Response.json({ error: "Assessment session not found" }, { status: 404 });
  }

  const engine = AssessmentEngine.fromSnapshot(stored.session);
  return Response.json({
    sessionId,
    assessment: engine.getDelta(),
    messages: engine.getSession().conversationHistory,
    isComplete: engine.checkComplete(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { sessionId?: unknown };
  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.trim()
      ? body.sessionId.trim()
      : crypto.randomUUID();
  const engine = new AssessmentEngine();
  const repository = getAssessmentSessionRepository();
  const existing = await repository.get(sessionId);
  await repository.save(sessionId, engine.toSnapshot(), existing?.version);
  const session = engine.getSession();
  return NextResponse.json({
    sessionId,
    engineSessionId: session.id,
    frameworkVersion: session.frameworkVersion,
  });
}
