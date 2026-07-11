import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { parseDocument } from "@/lib/document/parser";
import { extractSignals } from "@/lib/document/extractor";

vi.mock("@/lib/document/parser", () => ({ parseDocument: vi.fn() }));
vi.mock("@/lib/document/extractor", () => ({ extractSignals: vi.fn() }));

function uploadRequest(file: File, sessionId = crypto.randomUUID()): NextRequest {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sessionId", sessionId);
  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(parseDocument).mockResolvedValue(
      "A sufficiently detailed strategy document describing executive AI sponsorship and monthly governance reviews."
    );
    vi.mocked(extractSignals).mockResolvedValue([
      {
        id: "signal-1",
        text: "The CEO reviews the AI program monthly.",
        source: "document",
        dimensionId: "strategy",
        criterionId: "executive_sponsorship",
        timestamp: Date.now(),
        strength: 0.8,
      },
    ]);
  });

  it("adds extracted signals to the addressed assessment session", async () => {
    const response = await POST(
      uploadRequest(new File(["fake pdf"], "strategy.pdf", { type: "application/pdf" }))
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.signalsCount).toBe(1);
    expect(body.documentCount).toBe(1);
    expect(body.assessment.signalsCollected).toBe(1);
    expect(body.assessment.dimensions.strategy.evidence[0]).toMatchObject({
      source: "document",
      criterionId: "executive_sponsorship",
    });
  });

  it("rejects unsupported file types before parsing", async () => {
    const response = await POST(
      uploadRequest(new File(["notes"], "notes.txt", { type: "text/plain" }))
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/PDF or DOCX/) });
    expect(parseDocument).not.toHaveBeenCalled();
  });

  it("reports PDF parsing failures separately", async () => {
    vi.mocked(parseDocument).mockRejectedValueOnce(new Error("Invalid PDF structure"));

    const response = await POST(
      uploadRequest(new File(["broken"], "broken.pdf", { type: "application/pdf" }))
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      stage: "parsing",
      error: expect.stringMatching(/PDF could not be read/),
    });
    expect(extractSignals).not.toHaveBeenCalled();
  });

  it("keeps extracted text when only AI signal analysis fails", async () => {
    vi.mocked(extractSignals).mockRejectedValueOnce(new Error("Invalid API key"));

    const response = await POST(
      uploadRequest(new File(["fake pdf"], "strategy.pdf", { type: "application/pdf" }))
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.signalsCount).toBe(0);
    expect(body.documentCount).toBe(1);
    expect(body.warning).toMatch(/LLM provider, model, and API key/);
  });
});
