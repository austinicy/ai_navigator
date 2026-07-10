import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mcpTools } from "./tools";
import { AssessmentEngine } from "../lib/assessment/engine";
import { runAgentTurn } from "../lib/assessment/agent";
import { generateRoadmap } from "../lib/roadmap/generator";
import { loadFramework } from "../lib/framework/config";
import type { OrgProfile } from "../lib/assessment/types";
import { estimateIndustryBenchmark } from "../lib/assessment/benchmarks";
import { parseDocument } from "../lib/document/parser";
import { extractSignals } from "../lib/document/extractor";

const server = new McpServer({
  name: "ai-transformation-navigator",
  version: "1.0.0",
});

let engine: AssessmentEngine | null = null;

// Zod raw shapes matching the JSON-Schema inputSchemas in tools.ts.
// The MCP SDK's server.tool() expects Zod shapes (not raw JSON Schema), so
// the registration API is adapted from the brief while tool definitions stay verbatim.
const orgSizeEnum = z.enum(["startup", "smb", "mid-market", "enterprise"]);

server.tool(
  "start_assessment",
  mcpTools[0].description,
  {
    orgName: z.string().optional(),
    industry: z.string().optional(),
    size: orgSizeEnum.optional(),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    engine = new AssessmentEngine(p as Record<string, unknown>);
    const session = engine.getSession();
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ sessionId: session.id, frameworkVersion: session.frameworkVersion }) }],
    };
  }
);

server.tool(
  "chat",
  mcpTools[1].description,
  {
    message: z.string(),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    if (!engine) engine = new AssessmentEngine();
    const response = await runAgentTurn(p.message as string, engine);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(response) }],
    };
  }
);

server.tool(
  "get_scorecard",
  mcpTools[2].description,
  {},
  async () => {
    if (!engine) return { content: [{ type: "text" as const, text: "No active assessment" }] };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(engine.getDelta()) }],
    };
  }
);

server.tool(
  "generate_roadmap",
  mcpTools[3].description,
  {
    orgName: z.string(),
    industry: z.string(),
  },
  async () => {
    if (!engine) return { content: [{ type: "text" as const, text: "No active assessment" }] };
    const config = loadFramework();
    const roadmap = await generateRoadmap(engine.getSession(), config);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(roadmap) }],
    };
  }
);

server.tool(
  "upload_document",
  mcpTools[4].description,
  {
    filename: z.string(),
    contentBase64: z.string(),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    try {
      const buffer = Buffer.from(p.contentBase64 as string, "base64");
      const text = await parseDocument(buffer, p.filename as string);
      const signals = await extractSignals(text, p.filename as string);
      if (engine) {
        engine.addDocument({ filename: p.filename as string, extractedText: text, signals });
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ signalsCount: signals.length, signals }) }],
      };
    } catch {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "Failed to process document" }) }],
      };
    }
  }
);

// Agent tools (5-9) delegate to the engine
server.tool(
  "read_document",
  mcpTools[5].description,
  {
    documentId: z.string(),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    if (!engine) return { content: [{ type: "text" as const, text: "No active session" }] };
    const doc = engine.getSession().documents.find((d) => d.id === p.documentId);
    return { content: [{ type: "text" as const, text: JSON.stringify(doc ?? { error: "Document not found" }) }] };
  }
);

server.tool(
  "search_knowledge",
  mcpTools[6].description,
  {
    dimensionId: z.string().optional(),
    query: z.string().optional(),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    const config = loadFramework();
    const dims = p.dimensionId
      ? config.dimensions.filter((d) => d.id === p.dimensionId)
      : config.dimensions;
    return { content: [{ type: "text" as const, text: JSON.stringify(dims) }] };
  }
);

server.tool(
  "calculate_score",
  mcpTools[7].description,
  {
    dimensionId: z.string(),
    criterionScores: z.record(z.string(), z.number()),
    gaps: z.array(z.string()),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    if (!engine) return { content: [{ type: "text" as const, text: "No active session" }] };
    engine.updateDimensionScore(
      p.dimensionId as string,
      p.criterionScores as Record<string, number>,
      p.gaps as string[]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(engine.getDelta().dimensions[p.dimensionId as string]) }] };
  }
);

server.tool(
  "estimate_benchmark",
  mcpTools[8].description,
  {
    industry: z.string(),
    size: z.string().optional(),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    const config = loadFramework();
    const benchmark = estimateIndustryBenchmark(
      (p.industry as string) || "Manufacturing",
      ((engine?.getSession().orgProfile.size) as OrgProfile["size"]) || "mid-market",
      config
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ industry: p.industry, benchmark }) }],
    };
  }
);

server.tool(
  "update_org_profile",
  mcpTools[9].description,
  {
    name: z.string().optional(),
    industry: z.string().optional(),
    size: orgSizeEnum.optional(),
  },
  async (params) => {
    const p = params as Record<string, unknown>;
    if (!engine) return { content: [{ type: "text" as const, text: "No active session" }] };
    engine.updateOrgProfile(p as Record<string, unknown>);
    return { content: [{ type: "text" as const, text: JSON.stringify(engine.getSession().orgProfile) }] };
  }
);

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Transformation Navigator MCP server running on stdio");
}
