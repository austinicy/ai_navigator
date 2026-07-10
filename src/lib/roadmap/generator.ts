import { complete } from "../llm/client";
import { AssessmentSession } from "../assessment/types";
import { FrameworkConfig } from "../framework/types";
import { Roadmap, RoadmapPhase, RoadmapAction } from "./types";

export function parseRoadmapJson(
  text: string,
  session: AssessmentSession,
  _config: FrameworkConfig
): Roadmap {
  const profile = session.orgProfile;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      orgName: profile.name,
      industry: profile.industry,
      overallScore:
        Object.values(session.dimensions).reduce((sum, d) => sum + d.score, 0) /
        Object.keys(session.dimensions).length,
      aiReadinessScore: session.aiReadiness.score,
      phases: (parsed.phases as RoadmapPhase[]) ?? [],
      quickWins: (parsed.quickWins as RoadmapAction[]) ?? [],
      criticalGaps: (parsed.criticalGaps as string[]) ?? [],
      generatedAt: Date.now(),
    };
  } catch {
    return {
      orgName: profile.name,
      industry: profile.industry,
      overallScore: 0,
      aiReadinessScore: session.aiReadiness.score,
      phases: [],
      quickWins: [],
      criticalGaps: [],
      generatedAt: Date.now(),
    };
  }
}

export async function generateRoadmap(
  session: AssessmentSession,
  config: FrameworkConfig
): Promise<Roadmap> {
  const scoresText = Object.entries(session.dimensions)
    .map(([id, dim]) => {
      const dimConfig = config.dimensions.find((d) => d.id === id);
      return `${dimConfig?.name ?? id}: ${dim.score.toFixed(1)}/5.0 (confidence: ${(dim.confidence * 100).toFixed(0)}%) — Gaps: ${dim.gaps.join("; ") || "none"}`;
    })
    .join("\n");

  const evidenceText = Object.entries(session.dimensions)
    .flatMap(([_id, dim]) =>
      dim.evidence.map((e) => `[${e.source}] ${e.text}`)
    )
    .join("\n");

  const profile = session.orgProfile;

  const text = await complete(
    [
      {
        role: "user",
        content: `Generate a personalized digital transformation roadmap for this organization.

## Organization Profile
- Name: ${profile.name}
- Industry: ${profile.industry}
- Size: ${profile.size}
- Existing Initiatives: ${(profile.existingInitiatives ?? []).filter(Boolean).join(", ") || "none mentioned"}
- Constraints: Budget=${profile.constraints?.budget ?? "unknown"}, Timeline=${profile.constraints?.timeline ?? "unknown"}, Talent=${profile.constraints?.talentAvailability ?? "unknown"}

## Current Maturity Scores
${scoresText}

## AI Readiness Score
${session.aiReadiness.score}/100

## Key Evidence
${evidenceText}

Generate the roadmap as JSON following this structure:
{
  "phases": [
    {
      "id": "phase-1",
      "name": "Foundation",
      "timeframe": "0-3 months",
      "description": "...",
      "actions": [
        {
          "id": "action-1",
          "title": "...",
          "description": "...",
          "dimensionId": "...",
          "effort": "low|medium|high",
          "impact": "low|medium|high",
          "urgency": "low|medium|high",
          "successMetrics": ["..."],
          "dependencies": []
        }
      ]
    }
  ],
  "quickWins": [/* same action format */],
  "criticalGaps": ["..."]
}

Rules:
1. Phase 1 (0-3mo): Foundation + quick wins. Address blocking gaps first (data, cloud, governance basics).
2. Phase 2 (3-6mo): Build capability. AI pilots, talent programs, process automation.
3. Phase 3 (6-12mo): Scale and optimize. AI at scale, customer experience, innovation culture.
4. Respect dependencies: data before AI, cloud before data migration, governance before scaling AI.
5. Don't recommend what's already in existing initiatives — accelerate or expand instead.
6. Include specific, actionable recommendations (not generic advice).
7. Each action needs at least one measurable success metric.
8. Quick wins: low effort, high impact items from any dimension.`,
      },
    ],
    { maxTokens: 4096 }
  );

  return parseRoadmapJson(text, session, config);
}
