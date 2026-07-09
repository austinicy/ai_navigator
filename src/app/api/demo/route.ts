import { NextResponse } from "next/server";
import { getDemoSession } from "@/lib/demo/demo-data";

export async function GET() {
  return NextResponse.json(getDemoSession());
}
