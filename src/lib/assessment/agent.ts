import { chat, assistantToolCallMessage, toolResultMessage } from "../llm/client";
import type { LLMMessage } from "../llm/types";
import { agentTools } from "./tools";
import { AssessmentEngine } from "./engine";
import { loadFramework } from "../framework/config";
import { AgentResponse, OrgProfile } from "./types";
import { estimateIndustryBenchmark } from "./benchmarks";

const SYSTEM_PROMPT = `You are an expert Digital Transformation Consultant conducting a maturity assessment using Framework v{FRAMEWORK_VERSION}. You assess ALL 7 dimensions to sufficient confidence.

## Assessment Dimensions & Criteria
{FRAMEWORK_DIMENSIONS}

## Your Behavior — You LEAD the conversation
1. LEAD: You drive the assessment. You ask the questions. The user is NOT required to speak first — you open with a warm greeting and your first targeted question about Strategy & Leadership, then guide them dimension by dimension.
2. GOAL-DIRECTED: After gathering evidence on one dimension (≥3 evidence items, confidence rising), transition to the next unassessed dimension. Never re-ask what you already know.
3. CONVERSATIONAL: Ask one focused question at a time. Connect insights across dimensions ("You mentioned 60% cloud migration — that shapes your Data & AI readiness. How are data pipelines modernizing alongside it?").
4. EVIDENCE-BASED: Every score must be traceable to evidence from the conversation or uploaded documents.
5. DEPENDENCY-AWARE: Respect dependencies — don't probe advanced AI use cases until the data foundation is understood. Sequence your questioning data→AI→MLOps→governance where relevant.
6. TOOL-USING: Use calculate_score when you have ≥3 evidence items for a dimension. Use update_org_profile when you learn industry/size/geography/constraints. Use estimate_benchmark when you know the industry. Use generate_roadmap ONLY when all 7 dimensions are assessed with sufficient confidence.

## Assessment Progress
- Dimensions assessed: {DIMENSIONS_ASSESSED}/7
- Dimensions remaining: {DIMENSIONS_REMAINING}
- Next focus: {NEXT_FOCUS}

## Org Profile
{ORG_PROFILE}

## Current Scores
{CURRENT_SCORES}

## Industry Benchmark (estimated)
{INDUSTRY_BENCHMARK}

## Response Format
Respond naturally and concisely in conversation (2–4 sentences). After each exchange, decide whether to: (a) ask a follow-up, (b) calculate a score, (c) move to the next dimension, or (d) signal completion + generate_roadmap. When all dimensions are assessed, call generate_roadmap.`;

export function buildSystemPrompt(engine: AssessmentEngine): string {
  const config = loadFramework();
  const session = engine.getSession();
  const delta = engine.getDelta();

  const dimensionsText = config.dimensions
    .map((d) => `- ${d.name} (${d.id}): ${d.criteria.map((c) => c.name).join(", ")}`)
    .join("\n");

  const currentScores = Object.entries(session.dimensions)
    .map(([id, dim]) => `${id}: ${dim.score > 0 ? dim.score.toFixed(1) : "not yet assessed"} (confidence: ${(dim.confidence * 100).toFixed(0)}%)`)
    .join("\n");

  const orgProfile = session.orgProfile.name
    ? `Name: ${session.orgProfile.name}\nIndustry: ${session.orgProfile.industry}\nSize: ${session.orgProfile.size}\nGeography: ${session.orgProfile.geography || "unknown"}`
    : "Not yet gathered — ask about the organization early, but lead with your first question regardless.";

  const benchmarkText = session.orgProfile.industry
    ? `Industry: ${session.orgProfile.industry} (size: ${session.orgProfile.size})`
    : "Unknown industry — ask, then estimate.";

  return SYSTEM_PROMPT
    .replace("{FRAMEWORK_VERSION}", config.version)
    .replace("{FRAMEWORK_DIMENSIONS}", dimensionsText)
    .replace("{DIMENSIONS_ASSESSED}", String(delta.dimensionsAssessed))
    .replace("{DIMENSIONS_REMAINING}", String(delta.dimensionsRemaining))
    .replace("{NEXT_FOCUS}", delta.nextFocus || "Start with Strategy & Leadership")
    .replace("{ORG_PROFILE}", orgProfile)
    .replace("{CURRENT_SCORES}", currentScores)
    .replace("{INDUSTRY_BENCHMARK}", benchmarkText);
}

export async function runAgentTurn(
  userMessage: string,
  engine: AssessmentEngine
): Promise<AgentResponse> {
  const session = engine.getSession();
  const systemPrompt = buildSystemPrompt(engine);

  // Build the provider-agnostic messages array from conversation history + the
  // current user message. The agent owns this array across the loop rounds.
  const messages: LLMMessage[] = session.conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  messages.push({ role: "user", content: userMessage });

  // C1 fix: persist the user message so the next turn has memory.
  engine.addConversationMessage("user", userMessage);

  let assistantMessage = "";
  const toolCallResults: AgentResponse["toolCalls"] = [];

  // Tool-calling loop: call chat, execute tool calls, send results back, repeat
  // until the model signals end_turn (or no more tool calls).
  // C2 fix: tool results are round-tripped back to the model.
  const MAX_ROUNDS = 10;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const result = await chat(messages, agentTools, {
      system: systemPrompt,
      maxTokens: 2048,
    });

    assistantMessage += result.text;

    // Append the assistant turn (text + any tool calls) to the messages array.
    messages.push(assistantToolCallMessage(result));

    // No tool calls → the model is done talking this turn.
    if (result.toolCalls.length === 0 || result.stopReason !== "tool_use") {
      break;
    }

    // Execute each tool call and append a tool-result message back.
    for (const tc of result.toolCalls) {
      const input = tc.input;
      let output: Record<string, unknown>;

      switch (tc.name) {
        case "calculate_score": {
          engine.updateDimensionScore(
            input.dimensionId as string,
            input.criterionScores as Record<string, number>,
            input.gaps as string[]
          );
          output = { success: true };
          break;
        }
        case "update_org_profile": {
          engine.updateOrgProfile(input);
          output = { success: true };
          break;
        }
        case "estimate_benchmark": {
          const benchmark = estimateIndustryBenchmark(
            (input.industry as string) || session.orgProfile.industry || "Manufacturing",
            (session.orgProfile.size as OrgProfile["size"]) || "mid-market",
            loadFramework()
          );
          output = { industry: input.industry, benchmark };
          break;
        }
        case "generate_roadmap": {
          output = { triggered: true };
          break;
        }
        default: {
          output = { error: `Unknown tool: ${tc.name}` };
          break;
        }
      }

      toolCallResults.push({ tool: tc.name, input, output });
      messages.push(toolResultMessage(tc.id, tc.name, JSON.stringify(output)));
    }
    // Loop continues → the model gets the tool results and can decide to call
    // more tools or produce a final text response.
  }

  // C1 fix: persist the final assistant message for next-turn memory.
  if (assistantMessage) {
    engine.addConversationMessage("assistant", assistantMessage);
  }

  const isComplete = engine.checkComplete();

  return {
    message: assistantMessage,
    assessment: engine.getDelta(),
    isComplete,
    toolCalls: toolCallResults,
  };
}
