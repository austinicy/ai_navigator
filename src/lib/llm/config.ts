/**
 * Provider selection and model resolution.
 *
 * The active provider is determined by:
 *  1. An explicit `LLM_PROVIDER` env var (always wins), or
 *  2. The first provider whose API key is present, checked in order: anthropic → openai → deepseek.
 *
 * Default models per provider (overridable via `LLM_MODEL`):
 *  - anthropic → claude-sonnet-5
 *  - openai   → gpt-4o
 *  - deepseek → deepseek-chat
 */

export type Provider = "anthropic" | "openai" | "deepseek";

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o",
  deepseek: "deepseek-chat",
};

/** Resolve the active provider from env (explicit or by key presence). */
export function getProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic" || explicit === "openai" || explicit === "deepseek") {
    return explicit;
  }

  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.DEEPSEEK_API_KEY?.trim()) return "deepseek";

  // Default to anthropic (the original provider) when nothing is set.
  return "anthropic";
}

/** Resolve the model: LLM_MODEL override, else the per-provider default. */
export function getModel(): string {
  const override = process.env.LLM_MODEL?.trim();
  if (override) return override;
  return DEFAULT_MODELS[getProvider()];
}

/** Get the API key for a given provider from env. */
export function getApiKey(provider: Provider): string | undefined {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
    case "openai":
      return process.env.OPENAI_API_KEY?.trim() || undefined;
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY?.trim() || undefined;
  }
}

/** The base URL for the OpenAI-compatible endpoint (only set for DeepSeek). */
export function getBaseURL(provider: Provider): string | undefined {
  if (provider === "deepseek") return "https://api.deepseek.com";
  return undefined;
}
