import { NextRequest, NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/roadmap/generator";
import { loadFramework } from "@/lib/framework/config";
import { AssessmentSession } from "@/lib/assessment/types";

export async function POST(request: NextRequest) {
  try {
    const session: AssessmentSession = await request.json();
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
