export const agentTools = [
  {
    name: "calculate_score",
    description:
      "Calculate a dimension score based on gathered evidence. Use when you have sufficient evidence (≥3 items) for a dimension to formalize the score.",
    input_schema: {
      type: "object" as const,
      properties: {
        dimensionId: {
          type: "string",
          description: "The dimension ID to score (e.g., 'strategy', 'technology')",
        },
        criterionScores: {
          type: "object",
          description: "Map of criterion ID to score (1-5)",
          additionalProperties: { type: "number" },
        },
        gaps: {
          type: "array",
          items: { type: "string" },
          description: "Identified gaps for this dimension",
        },
      },
      required: ["dimensionId", "criterionScores", "gaps"],
    },
  },
  {
    name: "update_org_profile",
    description:
      "Update the organization profile with context learned during conversation. Use when the user mentions their industry, size, geography, or constraints.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Organization name" },
        industry: { type: "string", description: "Industry sector" },
        size: {
          type: "string",
          enum: ["startup", "smb", "mid-market", "enterprise"],
          description: "Organization size category",
        },
        geography: { type: "string", description: "Primary geography" },
        existingInitiatives: {
          type: "array",
          items: { type: "string" },
          description: "Transformation initiatives already underway",
        },
        constraints: {
          type: "object",
          properties: {
            budget: { type: "string", enum: ["low", "medium", "high"] },
            timeline: { type: "string", enum: ["aggressive", "moderate", "flexible"] },
            talentAvailability: { type: "string", enum: ["scarce", "moderate", "abundant"] },
          },
        },
      },
    },
  },
  {
    name: "estimate_benchmark",
    description:
      "Generate AI-estimated industry benchmark scores for comparison. Use when you have the org's industry and want to show how they compare.",
    input_schema: {
      type: "object" as const,
      properties: {
        industry: {
          type: "string",
          description: "The industry to benchmark against",
        },
        size: {
          type: "string",
          description: "Organization size for context",
        },
      },
      required: ["industry"],
    },
  },
  {
    name: "generate_roadmap",
    description:
      "Generate a personalized transformation roadmap. Use ONLY when every configured assessment section has sufficient confidence.",
    input_schema: {
      type: "object" as const,
      properties: {
        orgName: { type: "string", description: "Organization name" },
        industry: { type: "string", description: "Industry sector" },
        focusArea: {
          type: "string",
          description: "Optional specific focus area mentioned by user",
        },
      },
      required: ["orgName", "industry"],
    },
  },
];
