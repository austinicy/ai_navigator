export const mcpTools = [
  {
    name: "start_assessment",
    description: "Initialize a new organizational maturity assessment session",
    inputSchema: {
      type: "object",
      properties: {
        orgName: { type: "string", description: "Organization name" },
        industry: { type: "string", description: "Industry sector" },
        size: { type: "string", enum: ["startup", "smb", "mid-market", "enterprise"] },
      },
    },
  },
  {
    name: "chat",
    description: "Send a message in the assessment conversation and receive AI response with assessment update",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "User message" },
      },
      required: ["message"],
    },
  },
  {
    name: "get_scorecard",
    description: "Retrieve current dimension scores, evidence, and AI readiness",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "generate_roadmap",
    description: "Generate a personalized transformation roadmap from current assessment",
    inputSchema: {
      type: "object",
      properties: {
        orgName: { type: "string" },
        industry: { type: "string" },
      },
      required: ["orgName", "industry"],
    },
  },
  {
    name: "upload_document",
    description: "Submit a document (base64 encoded) for AI-powered signal extraction",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string" },
        contentBase64: { type: "string", description: "Base64-encoded file content" },
      },
      required: ["filename", "contentBase64"],
    },
  },
  {
    name: "read_document",
    description: "Agent tool: extract signals from an uploaded document",
    inputSchema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
      },
      required: ["documentId"],
    },
  },
  {
    name: "search_knowledge",
    description: "Agent tool: query the framework knowledge base for assessment criteria",
    inputSchema: {
      type: "object",
      properties: {
        dimensionId: { type: "string", description: "Optional dimension to filter by" },
        query: { type: "string", description: "Search query" },
      },
    },
  },
  {
    name: "calculate_score",
    description: "Agent tool: aggregate evidence into a dimension score",
    inputSchema: {
      type: "object",
      properties: {
        dimensionId: { type: "string" },
        criterionScores: { type: "object", additionalProperties: { type: "number" } },
        gaps: { type: "array", items: { type: "string" } },
      },
      required: ["dimensionId", "criterionScores", "gaps"],
    },
  },
  {
    name: "estimate_benchmark",
    description: "Agent tool: generate AI-estimated industry benchmarks",
    inputSchema: {
      type: "object",
      properties: {
        industry: { type: "string" },
        size: { type: "string" },
      },
      required: ["industry"],
    },
  },
  {
    name: "update_org_profile",
    description: "Agent tool: update organization context",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        industry: { type: "string" },
        size: { type: "string", enum: ["startup", "smb", "mid-market", "enterprise"] },
      },
    },
  },
];
