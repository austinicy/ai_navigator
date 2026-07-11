import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "http";
import { z } from "zod";
import { AssessmentEngine } from "../lib/assessment/engine";
import { runAgentKickoff, runAgentTurn } from "../lib/assessment/agent";
import { demoScenarios, getDemoScenario, seedDemoScenario } from "../lib/demo/scenarios";
import {
  getAssessmentSessionRepository,
  saveAssessmentEngine,
} from "../lib/assessment/session-repository";
import { randomUUID } from "crypto";

// Zod raw shapes matching the JSON-Schema inputSchemas in tools.ts.
// The MCP SDK's server.tool() expects Zod shapes (not raw JSON Schema), so
// the registration API is adapted from the brief while tool definitions stay verbatim.
const orgSizeEnum = z.enum(["startup", "smb", "mid-market", "enterprise"]);

function getReportUrl(sessionId: string): string | undefined {
  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/report?session=${encodeURIComponent(sessionId)}` : undefined;
}

function assessmentProgress(engine: AssessmentEngine) {
  const delta = engine.getDelta();
  return {
    assessed: delta.dimensionsAssessed,
    total: Object.keys(delta.dimensions).length,
    remaining: delta.dimensionsRemaining,
  };
}

function speakableFallback(): string {
  return "I saved your answer, but I could not analyse it just now. Please continue with the next detail you can share.";
}

async function continueAssessment(sessionId: string, message: string) {
  const repository = getAssessmentSessionRepository();
  const stored = await repository.get(sessionId);
  if (!stored) throw new Error("Assessment session not found. Start a new assessment first.");

  const engine = AssessmentEngine.fromSnapshot(stored.session);
  const before = JSON.stringify(engine.getDelta().dimensions);
  let response;
  try {
    response = await runAgentTurn(message, engine);
  } catch (error) {
    // runAgentTurn persists the user turn before invoking the provider. Keep
    // the transcript durable even if a provider is briefly unavailable.
    engine.addConversationMessage("assistant", speakableFallback());
    response = {
      message: speakableFallback(),
      assessment: engine.getDelta(),
      isComplete: engine.checkComplete(),
      toolCalls: [],
    };
    console.error("Assessment MCP turn failed:", error);
  }

  await repository.save(sessionId, engine.toSnapshot(), stored.version);
  return {
    engine,
    response,
    scoreChanged: before !== JSON.stringify(engine.getDelta().dimensions),
  };
}

/**
 * HTTP MCP transport is stateless, so the SDK requires a new server and
 * transport for every request. Durable assessment state lives in GCS, not in
 * this server instance, so this isolation is safe and avoids cross-client
 * protocol state.
 */
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "ai-transformation-navigator",
    version: "1.0.0",
  });

  // Voice-safe public tool surface. Configure MyBot to use these tools rather
  // than the low-level score/document tools registered below for compatibility.
  server.tool(
    "assessment_list_demos",
    "List the prepared half-finished assessment demos a voice user can continue.",
    {},
    async () => ({
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          demos: demoScenarios.map((scenario) => ({
            id: scenario.id,
            companyName: scenario.companyName,
            industry: scenario.industry,
            description: scenario.description,
          })),
        }),
      }],
    })
  );

  server.tool(
    "assessment_start",
    "Start either a new full assessment or a prepared demo assessment. Returns a session ID and a short question to speak.",
    {
      mode: z.enum(["full", "demo"]),
      scenarioId: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      size: orgSizeEnum.optional(),
    },
    async (params) => {
      const sessionId = randomUUID();
      const mode = params.mode;
      const engine = new AssessmentEngine({
        name: params.companyName ?? "",
        industry: params.industry ?? "",
        size: params.size,
      });
      let speakableReply: string;

      if (mode === "demo") {
        const scenario = getDemoScenario(params.scenarioId);
        if (!scenario) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: "Choose a valid demo scenario ID from assessment_list_demos." }) }],
            isError: true,
          };
        }
        seedDemoScenario(engine, scenario);
        speakableReply = `I’ve loaded the ${scenario.companyName} demo. ${scenario.nextQuestion}`;
      } else {
        const kickoff = await runAgentKickoff(engine);
        speakableReply = kickoff.message;
      }

      await saveAssessmentEngine(sessionId, engine);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          sessionId,
          mode,
          speakableReply,
          progress: assessmentProgress(engine),
          reportUrl: getReportUrl(sessionId),
        }) }],
      };
    }
  );

  server.tool(
    "assessment_continue",
    "Save one finalized user answer, update evidence and scores, and return the next short question to speak.",
    { sessionId: z.string(), message: z.string().min(1), turnId: z.string().optional() },
    async (params) => {
      try {
        const { engine, response, scoreChanged } = await continueAssessment(params.sessionId, params.message);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({
            sessionId: params.sessionId,
            speakableReply: response.message,
            scoreChanged,
            progress: assessmentProgress(engine),
            isComplete: response.isComplete,
            reportUrl: response.isComplete ? getReportUrl(params.sessionId) : undefined,
          }) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : "Unable to continue assessment" }) }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "assessment_status",
    "Return a concise spoken progress and score summary for an assessment session.",
    { sessionId: z.string() },
    async (params) => {
      const stored = await getAssessmentSessionRepository().get(params.sessionId);
      if (!stored) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Assessment session not found." }) }], isError: true };
      }
      const engine = AssessmentEngine.fromSnapshot(stored.session);
      const delta = engine.getDelta();
      const score = delta.aiReadiness.score > 0 ? ` AI readiness is ${Math.round(delta.aiReadiness.score)} out of 100.` : " Scores are still being established.";
      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          sessionId: params.sessionId,
          speakableReply: `We have assessed ${delta.dimensionsAssessed} of ${Object.keys(delta.dimensions).length} areas.${score} Next, we should focus on ${delta.nextFocus || "the remaining evidence"}.`,
          progress: assessmentProgress(engine),
          isComplete: engine.checkComplete(),
        }) }],
      };
    }
  );

  server.tool(
    "assessment_resume",
    "Resume an existing assessment session with a short recap and its next question.",
    { sessionId: z.string() },
    async (params) => {
      const stored = await getAssessmentSessionRepository().get(params.sessionId);
      if (!stored) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Assessment session not found." }) }], isError: true };
      }
      const engine = AssessmentEngine.fromSnapshot(stored.session);
      const history = engine.getSession().conversationHistory;
      const lastAssistant = [...history].reverse().find((entry) => entry.role === "assistant")?.content;
      const delta = engine.getDelta();
      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          sessionId: params.sessionId,
          speakableReply: lastAssistant || `Let’s continue. The next area to explore is ${delta.nextFocus || "your remaining assessment evidence"}.`,
          progress: assessmentProgress(engine),
          isComplete: engine.checkComplete(),
        }) }],
      };
    }
  );

  server.tool(
    "assessment_finish",
    "Finish an assessment session and return the companion web report URL. Optionally save a final user answer or conversation summary first.",
    { sessionId: z.string(), finalMessage: z.string().min(1).optional() },
    async (params) => {
      const repository = getAssessmentSessionRepository();
      const stored = await repository.get(params.sessionId);
      if (!stored) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Assessment session not found." }) }], isError: true };
      }
      let engine = AssessmentEngine.fromSnapshot(stored.session);
      let version = stored.version;
      let scoreChanged = false;
      if (params.finalMessage) {
        const continued = await continueAssessment(params.sessionId, params.finalMessage);
        engine = continued.engine;
        scoreChanged = continued.scoreChanged;
        // continueAssessment already committed the final transcript.
        const refreshed = await repository.get(params.sessionId);
        version = refreshed?.version ?? version;
      }
      engine.markComplete();
      await repository.save(params.sessionId, engine.toSnapshot(), version);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({
          sessionId: params.sessionId,
          speakableReply: "Your assessment is saved. The companion web report is ready.",
          scoreChanged,
          progress: assessmentProgress(engine),
          reportUrl: getReportUrl(params.sessionId),
        }) }],
      };
    }
  );

  return server;
}

export async function startMcpServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Transformation Navigator MCP server running on stdio");
}

// Streamable HTTP transport — lets the MCP server be hosted remotely over HTTPS
// and called by external devices via POST /mcp.
//
// NOTE on the SDK API (@modelcontextprotocol/sdk@1.29.0):
// Unlike the stdio transport, StreamableHTTPServerTransport.handleRequest takes
// the raw Node.js IncomingMessage + ServerResponse and writes the HTTP response
// itself (it delegates to @hono/node-server for the Node<->Web-Standard bridge,
// including SSE streaming). It does NOT return a JSON-RPC response object.
// So we pass req/res straight through rather than parsing the body ourselves.
export async function startMcpHttpServer(port: number) {
  const httpServer = createServer(async (req, res) => {
    // Single endpoint: POST /mcp carries JSON-RPC over HTTP.
    if (req.method === "POST" && req.url?.startsWith("/mcp")) {
      try {
        const server = createMcpServer();
        // Stateless mode: every request gets an isolated protocol transport.
        // Assessment continuity comes from the explicit sessionId stored in GCS.
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        await server.connect(transport);
        // The transport owns the full request/response cycle (parsing the
        // body, dispatching into the McpServer, writing status + body).
        await transport.handleRequest(req, res);
      } catch (err) {
        // Only write a response if the transport hasn't already sent one.
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
        console.error("MCP HTTP request error:", err);
      }
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  });

  httpServer.listen(port, () => {
    console.error(`AI Transformation Navigator MCP server listening on HTTP :${port}/mcp`);
  });
}
