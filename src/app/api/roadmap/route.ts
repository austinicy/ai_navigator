import { NextRequest, NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/roadmap/generator";
import { loadFramework } from "@/lib/framework/config";
import { AssessmentSession, normalizeOrgProfile } from "@/lib/assessment/types";

export async function POST(request: NextRequest) {
  try {
    // The client (RoadmapTab) sends a minimal orgProfile — only name + industry.
    // Normalize at the boundary so a partial profile can never reach the
    // generator and crash on a missing field.
    const body = await request.json();
    const session: AssessmentSession = {
      ...body,
      orgProfile: normalizeOrgProfile(body?.orgProfile),
    };
    const config = loadFramework();
    const roadmap = await generateRoadmap(session, config);
    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("Roadmap API error:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
