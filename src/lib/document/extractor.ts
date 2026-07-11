import { complete } from "../llm/client";
import { loadFramework } from "../framework/config";
import { DocumentSignal } from "../assessment/types";

export function parseSignalsJson(text: string): DocumentSignal[] {
  try {
    const config = loadFramework();
    const dimensions = new Map(
      config.dimensions.map((dimension) => [
        dimension.id,
        new Set(dimension.criteria.map((criterion) => criterion.id)),
      ])
    );
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed: unknown = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is { text: string; dimensionId: string; criterionId?: string; score?: number; gap?: string } => {
        if (!item || typeof item !== "object") return false;
        const signal = item as Record<string, unknown>;
        if (typeof signal.text !== "string" || !signal.text.trim()) return false;
        if (typeof signal.dimensionId !== "string") return false;
        const criteria = dimensions.get(signal.dimensionId);
        if (!criteria) return false;
        return signal.criterionId === undefined ||
          (typeof signal.criterionId === "string" && criteria.has(signal.criterionId));
      })
      .map((s) => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: s.text.trim(),
        source: "document" as const,
        dimensionId: s.dimensionId,
        criterionId: s.criterionId,
        timestamp: Date.now(),
        strength: 0.8,
        score: typeof s.score === "number" && Number.isFinite(s.score)
          ? Math.max(1, Math.min(5, Math.round(s.score)))
          : undefined,
        gap: typeof s.gap === "string" && s.gap.trim() ? s.gap.trim() : undefined,
      }));
  } catch {
    return [];
  }
}

export async function extractSignals(
  documentText: string,
  filename: string
): Promise<DocumentSignal[]> {
  const config = loadFramework();

  const dimensionsList = config.dimensions
    .map((d) => `- ${d.id}: ${d.name} (${d.criteria.map((c) => c.id).join(", ")})`)
    .join("\n");

  const text = await complete(
    [
      {
        role: "user",
        content: `Analyze this document and extract signals relevant to digital transformation and AI maturity assessment.

Document: ${filename}

${documentText.length > 20000
  ? `${documentText.slice(0, 12000)}\n\n[...middle of document omitted...]\n\n${documentText.slice(-8000)}`
  : documentText}

Framework Dimensions:
${dimensionsList}

Extract signals as JSON array:
[{
  "text": "brief description of the signal",
  "dimensionId": "which dimension this relates to",
  "criterionId": "which specific criterion (if identifiable)",
  "score": 1,
  "gap": "optional concise gap exposed by this evidence"
}]

For every concrete signal that maps to a criterion, include a grounded maturity score from 1 (absent/ad hoc) to 5 (leading). Explicitly map GenAI, copilots, LLMs, foundation models, RAG, prompt management, AI agents, agent permissions, evaluations, or AI safety to the "genai" dimension when supported. Only extract signals you can confidently identify. Return empty array if no relevant signals found.`,
      },
    ],
    { maxTokens: 2048 }
  );

  return parseSignalsJson(text);
}
