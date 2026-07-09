import Anthropic from "@anthropic-ai/sdk";
import { loadFramework } from "../framework/config";
import { Evidence } from "../assessment/types";

const client = new Anthropic();

export function parseSignalsJson(text: string): Evidence[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const signals = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return signals.map(
      (s: { text: string; dimensionId: string; criterionId?: string }) => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: s.text,
        source: "document" as const,
        dimensionId: s.dimensionId,
        criterionId: s.criterionId,
        timestamp: Date.now(),
      })
    );
  } catch {
    return [];
  }
}

export async function extractSignals(
  documentText: string,
  filename: string
): Promise<Evidence[]> {
  const config = loadFramework();

  const dimensionsList = config.dimensions
    .map((d) => `- ${d.id}: ${d.name} (${d.criteria.map((c) => c.id).join(", ")})`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Analyze this document and extract signals relevant to digital transformation and AI maturity assessment.

Document: ${filename}

${documentText.slice(0, 15000)}

Framework Dimensions:
${dimensionsList}

Extract signals as JSON array:
[{
  "text": "brief description of the signal",
  "dimensionId": "which dimension this relates to",
  "criterionId": "which specific criterion (if identifiable)"
}]

Only extract signals you can confidently identify. Return empty array if no relevant signals found.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  return parseSignalsJson(text);
}
