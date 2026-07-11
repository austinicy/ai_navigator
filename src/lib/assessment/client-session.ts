export const ACTIVE_SESSION_ID_KEY = "ai-navigator-active-session-id";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ??
    `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateActiveSessionId(): string {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  if (existing) return existing;

  const sessionId = createId();
  window.localStorage.setItem(ACTIVE_SESSION_ID_KEY, sessionId);
  return sessionId;
}

export function createNewActiveSessionId(): string {
  const sessionId = createId();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACTIVE_SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

