import { NextResponse } from "next/server";
import { AssessmentEngine } from "@/lib/assessment/engine";

let engine: AssessmentEngine | null = null;

export async function POST() {
  engine = new AssessmentEngine();
  const session = engine.getSession();
  return NextResponse.json({
    sessionId: session.id,
    frameworkVersion: session.frameworkVersion,
  });
}

export function getEngine(): AssessmentEngine | null {
  return engine;
}
