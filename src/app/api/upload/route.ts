import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/document/parser";
import { extractSignals } from "@/lib/document/extractor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseDocument(buffer, file.name);

    if (text.length < 50) {
      return NextResponse.json(
        { error: "Could not extract meaningful text from document" },
        { status: 400 }
      );
    }

    const signals = await extractSignals(text, file.name);

    return NextResponse.json({
      filename: file.name,
      textLength: text.length,
      signalsCount: signals.length,
      signals,
      preview: text.slice(0, 500),
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
