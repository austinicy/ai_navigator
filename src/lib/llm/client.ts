import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  getProvider,
  getModel,
  getApiKey,
  getBaseURL,
  type Provider,
} from "./config";
import type {
  LLMMessage,
  LLMTool,
  LLMToolCall,
  LLMChatResult,
} from "./types";

// ---------------------------------------------------------------------------
// Pure normalizers — exported so they can be tested without mocking the SDKs.
// They accept a minimal structural subset of each provider's response object
// (duck-typed via a permissive content type), so test fixtures don't need to
// construct full SDK instances and real SDK responses are accepted at the call
// site without complaint.
// ---------------------------------------------------------------------------

/**
 * A content block from an Anthropic response — permissively typed so the
 * normalizer accepts both hand-built test fixtures and the SDK's `ContentBlock`
 * union (which includes thinking blocks, server tool use, etc. that we skip).
 */
type AnthropicBlock = { type: string; [key: string]: unknown };

/**
 * Minimal shape of an Anthropic Messages API response that the normalizer reads.
 */
export interface AnthropicResponseLike {
  stop_reason: string | null;
  content: AnthropicBlock[];
}

/** Normalize an Anthropic Messages API response into an `LLMChatResult`. */
export function normalizeAnthropicResponse(
  response: AnthropicResponseLike
): LLMChatResult {
  let text = "";
  const toolCalls: LLMToolCall[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text as string;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id as string,
        name: block.name as string,
        input: (block.input as Record<string, unknown>) ?? {},
      });
    }
  }

  const stopReason: LLMChatResult["stopReason"] =
    response.stop_reason === "tool_use" ? "tool_use" : "end_turn";

  return { text, toolCalls, stopReason };
}

/**
 * A tool call from an OpenAI response — permissively typed because the SDK's
 * `ChatCompletionMessageToolCall` is a union (function | custom) and we only
 * care about the function variant.
 */
type OpenAIToolCallEntry = { id: string; type?: string; function?: { name: string; arguments: string } };

/**
 * Minimal shape of an OpenAI ChatCompletion response that the normalizer reads.
 */
export interface OpenAIResponseLike {
  choices: Array<{
    finish_reason: string | null;
    message: {
      content: string | null;
      tool_calls?: OpenAIToolCallEntry[];
    };
  }>;
}

/** Normalize an OpenAI ChatCompletion response into an `LLMChatResult`. */
export function normalizeOpenAIResponse(
  response: OpenAIResponseLike
): LLMChatResult {
  const choice = response.choices[0];
  if (!choice) {
    return { text: "", toolCalls: [], stopReason: "end_turn" };
  }

  const text = choice.message.content ?? "";
  const toolCalls: LLMToolCall[] = [];

  if (choice.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      // Skip non-function tool calls (custom tools) — we only use function tools.
      if (!tc.function) continue;
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        input = {};
      }
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        input,
      });
    }
  }

  const stopReason: LLMChatResult["stopReason"] =
    choice.finish_reason === "tool_calls" ? "tool_use" : "end_turn";

  return { text, toolCalls, stopReason };
}

// ---------------------------------------------------------------------------
// Tool-shape mapping (Anthropic-style input_schema → OpenAI function shape).
// ---------------------------------------------------------------------------

/** Map an `LLMTool` (Anthropic-style input_schema) to OpenAI's function-tool shape. */
export function toOpenAITool(tool: LLMTool): {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
} {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  };
}

// ---------------------------------------------------------------------------
// Message-shape mapping — converts the provider-agnostic LLMMessage union to
// each provider's native message param type.
// ---------------------------------------------------------------------------

/** Map an `LLMMessage` to the Anthropic `MessageParam` shape (content blocks). */
function toAnthropicMessage(
  msg: LLMMessage
): Anthropic.MessageParam {
  switch (msg.role) {
    case "user":
      return { role: "user", content: msg.content };
    case "assistant":
      if ("toolCalls" in msg) {
        // Assistant turn with tool calls → content blocks: optional text + tool_use blocks.
        const blocks: Anthropic.ContentBlockParam[] = [];
        if (msg.content) {
          blocks.push({ type: "text", text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          blocks.push({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.input as unknown,
          });
        }
        return { role: "assistant", content: blocks };
      }
      // Plain assistant text message.
      return { role: "assistant", content: msg.content };
    case "tool":
      // Tool result → a user message containing a tool_result content block.
      return {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: msg.toolCallId,
            content: msg.content,
          },
        ],
      };
  }
}

/** Map an `LLMMessage` to the OpenAI `ChatCompletionMessageParam` shape. */
function toOpenAIMessage(
  msg: LLMMessage
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  switch (msg.role) {
    case "user":
      return { role: "user", content: msg.content };
    case "assistant":
      if ("toolCalls" in msg) {
        // Assistant turn with tool calls → assistant message with tool_calls array.
        return {
          role: "assistant",
          content: msg.content || null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.input),
            },
          })),
        };
      }
      return { role: "assistant", content: msg.content };
    case "tool":
      // Tool result → a tool-role message referencing the tool call id.
      return {
        role: "tool",
        tool_call_id: msg.toolCallId,
        content: msg.content,
      };
  }
}

// ---------------------------------------------------------------------------
// Client factory — lazily constructs the SDK client for the active provider.
// ---------------------------------------------------------------------------

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let cachedProvider: Provider | null = null;

function getClients(): { provider: Provider; anthropic: Anthropic | null; openai: OpenAI | null } {
  const provider = getProvider();
  // Rebuild clients if the provider changed (mainly for tests that stub env).
  if (cachedProvider !== provider) {
    anthropicClient = null;
    openaiClient = null;
    cachedProvider = provider;
  }
  if (provider === "anthropic" && !anthropicClient) {
    const apiKey = getApiKey("anthropic");
    anthropicClient = new Anthropic(apiKey ? { apiKey } : {});
  } else if ((provider === "openai" || provider === "deepseek") && !openaiClient) {
    const apiKey = getApiKey(provider);
    const baseURL = getBaseURL(provider);
    openaiClient = new OpenAI({
      apiKey: apiKey ?? "",
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return { provider, anthropic: anthropicClient, openai: openaiClient };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CompleteOptions {
  system?: string;
  maxTokens?: number;
}

export interface ChatOptions {
  system?: string;
  maxTokens?: number;
}

/**
 * One-shot text completion. Sends messages and returns the plain text response.
 * Used by the document extractor and roadmap generator (no tool calling).
 */
export async function complete(
  messages: LLMMessage[],
  options: CompleteOptions = {}
): Promise<string> {
  const { provider, anthropic, openai } = getClients();
  const model = getModel();
  const maxTokens = options.maxTokens ?? 2048;

  if (provider === "anthropic" && anthropic) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      ...(options.system ? { system: options.system } : {}),
      messages: messages.map(toAnthropicMessage),
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock ? textBlock.text : "";
  }

  if (openai) {
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (options.system) {
      apiMessages.push({ role: "system", content: options.system });
    }
    for (const msg of messages) {
      apiMessages.push(toOpenAIMessage(msg));
    }
    const response = await openai.chat.completions.create({
      model,
      // max_completion_tokens (not the deprecated max_tokens) — required for
      // o-series models, accepted by gpt-4o and DeepSeek's OpenAI-compatible API.
      max_completion_tokens: maxTokens,
      messages: apiMessages,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  throw new Error(`No LLM client available for provider "${provider}"`);
}

/**
 * Single-round tool-calling chat. Sends messages + tools and returns the
 * normalized result `{ text, toolCalls, stopReason }`. Does NOT loop — the
 * agent owns the loop (it executes tools between rounds).
 */
export async function chat(
  messages: LLMMessage[],
  tools: LLMTool[],
  options: ChatOptions = {}
): Promise<LLMChatResult> {
  const { provider, anthropic, openai } = getClients();
  const model = getModel();
  const maxTokens = options.maxTokens ?? 2048;

  if (provider === "anthropic" && anthropic) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      ...(options.system ? { system: options.system } : {}),
      messages: messages.map(toAnthropicMessage),
      tools: tools.map(
        (t) =>
          ({
            name: t.name,
            description: t.description,
            input_schema: t.input_schema,
          }) as Anthropic.Tool
      ),
    });
    return normalizeAnthropicResponse(response as unknown as AnthropicResponseLike);
  }

  if (openai) {
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (options.system) {
      apiMessages.push({ role: "system", content: options.system });
    }
    for (const msg of messages) {
      apiMessages.push(toOpenAIMessage(msg));
    }
    const response = await openai.chat.completions.create({
      model,
      max_completion_tokens: maxTokens,
      messages: apiMessages,
      tools: tools.map(toOpenAITool),
    });
    return normalizeOpenAIResponse(response as unknown as OpenAIResponseLike);
  }

  throw new Error(`No LLM client available for provider "${provider}"`);
}

/**
 * Build an assistant tool-call message from an `LLMChatResult` (for appending
 * back into the `messages` array the agent owns). Exported so the agent doesn't
 * need to construct the union manually.
 */
export function assistantToolCallMessage(
  result: LLMChatResult
): LLMMessage {
  if (result.toolCalls.length > 0) {
    return {
      role: "assistant",
      content: result.text,
      toolCalls: result.toolCalls,
    };
  }
  return { role: "assistant", content: result.text };
}

/**
 * Build a tool-result message (for appending after executing a tool call).
 */
export function toolResultMessage(
  toolCallId: string,
  name: string,
  content: string
): LLMMessage {
  return { role: "tool", toolCallId, name, content };
}
