import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/document/parser";
import { extractSignals } from "@/lib/document/extractor";
import {
  loadOrCreateAssessmentEngine,
  saveAssessmentEngine,
} from "@/lib/assessment/session-repository";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(["pdf", "docx"]);

function parsingError(extension: string, error: unknown): string {
  const detail = error instanceof Error ? error.message.toLowerCase() : "";
  if (detail.includes("password")) {
    return "This document is password-protected. Remove the password and upload it again.";
  }
  if (extension === "pdf") {
    return "This PDF could not be read. It may be damaged, password-protected, or use an unsupported PDF structure.";
  }
  return "This DOCX file could not be read. Make sure it is a valid Microsoft Word DOCX file.";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const sessionId = formData.get("sessionId");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (typeof sessionId !== "string" || !sessionId.trim()) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "The uploaded file is empty" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. The maximum size is 10 MB." },
        { status: 413 }
      );
    }

    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or DOCX file." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;
    try {
      text = await parseDocument(buffer, file.name);
    } catch (error) {
      console.error("Document parsing error:", error);
      return NextResponse.json(
        { error: parsingError(extension, error), stage: "parsing" },
        { status: 422 }
      );
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            extension === "pdf"
              ? "This PDF contains too little selectable text. Scanned or image-only PDFs require OCR and are not currently supported."
              : "This DOCX contains too little readable text to assess.",
          stage: "parsing",
        },
        { status: 422 }
      );
    }

    let signals: Awaited<ReturnType<typeof extractSignals>> = [];
    let warning: string | undefined;
    try {
      signals = await extractSignals(text, file.name);
    } catch (error) {
      console.error("Document signal extraction error:", error);
      warning =
        "The document text was uploaded, but AI signal analysis failed. Check the configured LLM provider, model, and API key, then try again.";
    }
    const normalizedSessionId = sessionId.trim();
    const { engine, version } = await loadOrCreateAssessmentEngine(normalizedSessionId);
    engine.addDocument({
      filename: file.name,
      extractedText: text,
      signals,
    });
    await saveAssessmentEngine(normalizedSessionId, engine, version);

    return NextResponse.json({
      filename: file.name,
      textLength: text.length,
      signalsCount: signals.length,
      signals,
      preview: text.slice(0, 500),
      assessment: engine.getDelta(),
      documentCount: engine.getSession().documents.length,
      warning,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "The upload request could not be read. Please select the file and try again." },
      { status: 500 }
    );
  }
}
