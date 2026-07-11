import { afterEach, describe, expect, it } from "vitest";
import {
  createAgoraLlmToken,
  resolveAgoraLlmBaseUrl,
  verifyAgoraLlmToken,
} from "./shared-context";

describe("Agora shared context helpers", () => {
  const originalBaseUrl = process.env.AGORA_CUSTOM_LLM_BASE_URL;
  const originalAppBaseUrl = process.env.APP_BASE_URL;
  const originalCertificate = process.env.AGORA_APP_CERTIFICATE;

  afterEach(() => {
    process.env.AGORA_CUSTOM_LLM_BASE_URL = originalBaseUrl;
    process.env.APP_BASE_URL = originalAppBaseUrl;
    process.env.AGORA_APP_CERTIFICATE = originalCertificate;
  });

  it("signs and verifies a token scoped to one assessment session", () => {
    process.env.AGORA_APP_CERTIFICATE = "certificate";
    const token = createAgoraLlmToken("session-a");

    expect(verifyAgoraLlmToken("session-a", `Bearer ${token}`)).toBe(true);
    expect(verifyAgoraLlmToken("session-b", `Bearer ${token}`)).toBe(false);
  });

  it("uses an explicit tunnel URL for local development", () => {
    process.env.AGORA_CUSTOM_LLM_BASE_URL = "https://tunnel.example/";
    expect(
      resolveAgoraLlmBaseUrl(new Request("http://localhost:3000/api/agora/session"))
    ).toBe("https://tunnel.example");
  });

  it("does not expose localhost as an Agora callback", () => {
    delete process.env.AGORA_CUSTOM_LLM_BASE_URL;
    delete process.env.APP_BASE_URL;
    expect(
      resolveAgoraLlmBaseUrl(new Request("http://localhost:3000/api/agora/session"))
    ).toBeNull();
  });
});

