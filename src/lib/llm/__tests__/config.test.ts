import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getProvider, getModel, getApiKey } from "../config";

describe("getProvider", () => {
  beforeEach(() => {
    // Clear all provider-related env vars before each test.
    vi.stubEnv("LLM_PROVIDER", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("DEEPSEEK_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("honors LLM_PROVIDER=anthropic", () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    expect(getProvider()).toBe("anthropic");
  });

  it("honors LLM_PROVIDER=openai", () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    expect(getProvider()).toBe("openai");
  });

  it("honors LLM_PROVIDER=deepseek", () => {
    vi.stubEnv("LLM_PROVIDER", "deepseek");
    expect(getProvider()).toBe("deepseek");
  });

  it("honors LLM_PROVIDER case-insensitively", () => {
    vi.stubEnv("LLM_PROVIDER", "OpenAI");
    expect(getProvider()).toBe("openai");
  });

  it("explicit LLM_PROVIDER wins over key presence", () => {
    vi.stubEnv("LLM_PROVIDER", "deepseek");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-key");
    vi.stubEnv("OPENAI_API_KEY", "sk-oai-key");
    expect(getProvider()).toBe("deepseek");
  });

  it("falls back to anthropic when ANTHROPIC_API_KEY is set and LLM_PROVIDER unset", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-key");
    vi.stubEnv("OPENAI_API_KEY", "sk-oai-key");
    expect(getProvider()).toBe("anthropic");
  });

  it("falls back to openai when only OPENAI_API_KEY is set", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-oai-key");
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-ds-key");
    expect(getProvider()).toBe("openai");
  });

  it("falls back to deepseek when only DEEPSEEK_API_KEY is set", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-ds-key");
    expect(getProvider()).toBe("deepseek");
  });

  it("defaults to anthropic when no keys and no LLM_PROVIDER are set", () => {
    expect(getProvider()).toBe("anthropic");
  });

  it("ignores whitespace-only keys in fallback", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "   ");
    vi.stubEnv("OPENAI_API_KEY", "  ");
    expect(getProvider()).toBe("anthropic");
  });
});

describe("getModel", () => {
  beforeEach(() => {
    vi.stubEnv("LLM_MODEL", "");
    vi.stubEnv("LLM_PROVIDER", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("DEEPSEEK_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns claude-sonnet-5 for anthropic by default", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant");
    expect(getModel()).toBe("claude-sonnet-5");
  });

  it("returns gpt-4o for openai by default", () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    expect(getModel()).toBe("gpt-4o");
  });

  it("returns deepseek-chat for deepseek by default", () => {
    vi.stubEnv("LLM_PROVIDER", "deepseek");
    expect(getModel()).toBe("deepseek-chat");
  });

  it("respects LLM_MODEL override", () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    vi.stubEnv("LLM_MODEL", "gpt-4-turbo");
    expect(getModel()).toBe("gpt-4-turbo");
  });

  it("LLM_MODEL override works for anthropic too", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant");
    vi.stubEnv("LLM_MODEL", "claude-opus-4-1");
    expect(getModel()).toBe("claude-opus-4-1");
  });
});

describe("getApiKey", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("DEEPSEEK_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the anthropic key", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-123");
    expect(getApiKey("anthropic")).toBe("sk-ant-123");
  });

  it("returns the openai key", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-oai-456");
    expect(getApiKey("openai")).toBe("sk-oai-456");
  });

  it("returns the deepseek key", () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-ds-789");
    expect(getApiKey("deepseek")).toBe("sk-ds-789");
  });

  it("returns undefined when key is not set", () => {
    expect(getApiKey("anthropic")).toBeUndefined();
  });

  it("returns undefined for whitespace-only key", () => {
    vi.stubEnv("OPENAI_API_KEY", "   ");
    expect(getApiKey("openai")).toBeUndefined();
  });
});
