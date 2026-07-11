import { describe, it, expect } from "vitest";
import { parseSignalsJson } from "../extractor";

describe("parseSignalsJson", () => {
  it("parses a clean JSON array of signals into Evidence objects", () => {
    const claudeOutput = `Here are the signals I found:

[{"text":"Has a CDO","dimensionId":"strategy","criterionId":"executive_sponsorship"},{"text":"Uses AWS","dimensionId":"technology","criterionId":"cloud_maturity"}]

Hope that helps!`;

    const signals = parseSignalsJson(claudeOutput);

    expect(signals).toHaveLength(2);
    expect(signals[0]).toMatchObject({
      text: "Has a CDO",
      source: "document",
      dimensionId: "strategy",
      criterionId: "executive_sponsorship",
    });
    expect(signals[1]).toMatchObject({
      text: "Uses AWS",
      source: "document",
      dimensionId: "technology",
      criterionId: "cloud_maturity",
    });
    // Every signal gets a fresh unique id and a timestamp.
    for (const s of signals) {
      expect(s.id).toMatch(/^doc-\d+-[a-z0-9]{4,6}$/);
      expect(typeof s.timestamp).toBe("number");
    }
    expect(signals[0].id).not.toBe(signals[1].id);
  });

  it("handles signals without a criterionId (optional field)", () => {
    const text = `[{"text":"General signal","dimensionId":"culture"}]`;
    const signals = parseSignalsJson(text);

    expect(signals).toHaveLength(1);
    expect(signals[0].criterionId).toBeUndefined();
    expect(signals[0].text).toBe("General signal");
    expect(signals[0].dimensionId).toBe("culture");
  });

  it("returns an empty array when no JSON array is present", () => {
    const text = `I couldn't find any relevant signals in this document.`;
    expect(parseSignalsJson(text)).toEqual([]);
  });

  it("returns an empty array when the JSON is malformed", () => {
    const text = `[{broken json,,,}]`;
    expect(parseSignalsJson(text)).toEqual([]);
  });

  it("extracts the JSON array even when surrounded by prose and code fences", () => {
    const text = `\`\`\`json
[{"text":"Signal one","dimensionId":"data_ai"}]
\`\`\``;
    const signals = parseSignalsJson(text);

    expect(signals).toHaveLength(1);
    expect(signals[0].text).toBe("Signal one");
    expect(signals[0].source).toBe("document");
  });

  it("drops hallucinated dimension and criterion IDs", () => {
    const signals = parseSignalsJson(`[
      {"text":"Valid strategy signal","dimensionId":"strategy","criterionId":"executive_sponsorship"},
      {"text":"Unknown dimension","dimensionId":"imaginary"},
      {"text":"Unknown criterion","dimensionId":"strategy","criterionId":"imaginary"}
    ]`);

    expect(signals).toHaveLength(1);
    expect(signals[0].text).toBe("Valid strategy signal");
    expect(signals[0].strength).toBe(0.8);
  });

  it("keeps grounded scores and gaps for direct document scoring", () => {
    const signals = parseSignalsJson(`[
      {
        "text":"Teams use an internal RAG assistant with documented retrieval tests.",
        "dimensionId":"genai",
        "criterionId":"knowledge_rag",
        "score":3.7,
        "gap":"Retrieval freshness is not monitored."
      }
    ]`);

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      dimensionId: "genai",
      criterionId: "knowledge_rag",
      score: 4,
      gap: "Retrieval freshness is not monitored.",
    });
  });
});
