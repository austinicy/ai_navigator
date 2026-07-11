import { createHmac, timingSafeEqual } from "node:crypto";

function signingSecret(): string {
  const secret = process.env.AGORA_APP_CERTIFICATE?.trim();
  if (!secret) throw new Error("Missing AGORA_APP_CERTIFICATE in .env.local");
  return secret;
}

export function createAgoraLlmToken(sessionId: string): string {
  return createHmac("sha256", signingSecret())
    .update(`ai-navigator:${sessionId}`)
    .digest("hex");
}

export function verifyAgoraLlmToken(sessionId: string, authorization: string | null): boolean {
  const supplied = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const expected = createAgoraLlmToken(sessionId);
  if (supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export function resolveAgoraLlmBaseUrl(request: Request): string | null {
  const configured =
    process.env.AGORA_CUSTOM_LLM_BASE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(request.url);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return url.protocol === "https:" && !isLocal ? url.origin : null;
}

