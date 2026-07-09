/**
 * Provider-agnostic LLM message types.
 *
 * The agent tool-calling loop produces three kinds of messages:
 *  1. Plain text (user prompt, assistant text-only response)
 *  2. Assistant tool-call turn (optional text + one or more tool calls)
 *  3. Tool-result turn (the output of executing a tool, sent back to the model)
 *
 * `LLMMessage` is a discriminated union covering all three. The `chat()` and
 * `complete()` functions in `client.ts` map this union to each provider's native
 * message shape (Anthropic content blocks / OpenAI role+tool_calls), so the agent
 * never touches SDK-specific types.
 */

/** A plain text message — user prompt or assistant text-only response. */
export interface LLMTextMessage {
  role: "user" | "assistant";
  content: string;
}

/** A tool-call request from the model (normalized from both providers). */
export interface LLMToolCall {
  /** Provider-assigned id for this tool call (needed to pair tool results). */
  id: string;
  /** The tool name the model wants to invoke. */
  name: string;
  /** The parsed arguments object the model supplied. */
  input: Record<string, unknown>;
}

/** An assistant turn that includes one or more tool calls. May also carry text. */
export interface LLMToolCallMessage {
  role: "assistant";
  /** Text the model produced alongside the tool calls (may be empty). */
  content: string;
  /** One or more tool calls requested by the model in this turn. */
  toolCalls: LLMToolCall[];
}

/** A tool-result message — the output of executing a tool call, sent back. */
export interface LLMToolResultMessage {
  role: "tool";
  /** The id of the tool call this result responds to. */
  toolCallId: string;
  /** The tool name (for convenience / debugging; not required by all providers). */
  name: string;
  /** The serialized result of executing the tool. */
  content: string;
}

/** Discriminated union of all message kinds the agent loop can produce. */
export type LLMMessage =
  | LLMTextMessage
  | LLMToolCallMessage
  | LLMToolResultMessage;

/** A tool definition (Anthropic-style input_schema; mapped to OpenAI internally). */
export interface LLMTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** The normalized result of a single `chat()` round. */
export interface LLMChatResult {
  /** Text content the model produced this round (may be empty if only tool calls). */
  text: string;
  /** Tool calls the model requested this round (empty if none). */
  toolCalls: LLMToolCall[];
  /** Normalized stop reason: "tool_use" if the model wants tools executed, "end_turn" if done. */
  stopReason: "tool_use" | "end_turn";
}
