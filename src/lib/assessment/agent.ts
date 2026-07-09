import Anthropic from "@anthropic-ai/sdk";
import { agentTools } from "./tools";
import { AssessmentEngine } from "./engine";
import { loadFramework } from "../framework/config";
import { AgentResponse, AssessmentDelta, ChatMessage } from "./types";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert Digital Transformation Consultant conducting a maturity assessment. Your goal is to assess ALL 7 dimensions to sufficient confidence.

## Assessment Dimensions
{FRAMEWORK_DIMENSIONS}

## Your Behavior
1. GOAL-DIRECTED: You drive the assessment forward. After gathering evidence on one dimension, transition to the next unassessed dimension.
2. CONVERSATIONAL: Ask natural follow-up questions. Connect insights across dimensions.
3. EVIDENCE-BASED: Every score must be supported by evidence from the conversation.
4. TOOL-USING: Use calculate_score when you have ≥3 evidence items for a dimension. Use update_org_profile when you learn org context. Use estimate_benchmark when you know the industry. Use generate_roadmap ONLY when all 7 dimensions are assessed.

## Assessment Progress
- Dimensions assessed so far: {DIMENSIONS_ASSESSED}
- Dimensions remaining: {DIMENSIONS_REMAINING}
- Next focus: {NEXT_FOCUS}

## Org Profile
{ORG_PROFILE}

## Current Scores
{CURRENT_SCORES}

## Response Format
Respond naturally in conversation. After each exchange, consider whether you should:
1. Ask another follow-up question
2. Calculate a score for a dimension you now have sufficient evidence for
3. Move to the next unassessed dimension
4. Signal the assessment is complete and generate a roadmap

When all dimensions are assessed with sufficient confidence, call generate_roadmap.`;

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
    ? `Name: ${session.orgProfile.name}\nIndustry: ${session.orgProfile.industry}\nSize: ${session.orgProfile.size}`
    : "Not yet gathered — ask about the organization first";

  return SYSTEM_PROMPT
    .replace("{FRAMEWORK_DIMENSIONS}", dimensionsText)
    .replace("{DIMENSIONS_ASSESSED}", String(delta.dimensionsAssessed))
    .replace("{DIMENSIONS_REMAINING}", String(delta.dimensionsRemaining))
    .replace("{NEXT_FOCUS}", delta.nextFocus || "Start with Strategy & Leadership")
    .replace("{ORG_PROFILE}", orgProfile)
    .replace("{CURRENT_SCORES}", currentScores);
}

export async function runAgentTurn(
  userMessage: string,
  engine: AssessmentEngine
): Promise<AgentResponse> {
  const session = engine.getSession();
  const systemPrompt = buildSystemPrompt(engine);

  const messages: Anthropic.MessageParam[] = session.conversationHistory.map(
    (msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })
  );

  messages.push({ role: "user", content: userMessage });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages,
    tools: agentTools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    })),
  });

  let assistantMessage = "";
  const toolCallResults: AgentResponse["toolCalls"] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      assistantMessage += block.text;
    } else if (block.type === "tool_use") {
      const input = block.input as Record<string, unknown>;
      switch (block.name) {
        case "calculate_score": {
          engine.updateDimensionScore(
            input.dimensionId as string,
            input.criterionScores as Record<string, number>,
            input.gaps as string[]
          );
          toolCallResults.push({ tool: block.name, input, output: { success: true } });
          break;
        }
        case "update_org_profile": {
          engine.updateOrgProfile(input as Record<string, unknown>);
          toolCallResults.push({ tool: block.name, input, output: { success: true } });
          break;
        }
        case "estimate_benchmark": {
          toolCallResults.push({
            tool: block.name,
            input,
            output: {
              note: "Benchmark estimation included in assessment context",
              industry: input.industry,
            },
          });
          break;
        }
        case "generate_roadmap": {
          toolCallResults.push({ tool: block.name, input, output: { triggered: true } });
          break;
        }
      }
    }
  }

  const isComplete = engine.checkComplete();

  return {
    message: assistantMessage,
    assessment: engine.getDelta(),
    isComplete,
    toolCalls: toolCallResults,
  };
}
