import { NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { getApiKey, getModel, getProvider } from "@/lib/llm/config";
import { loadOrCreateAssessmentEngine } from "@/lib/assessment/session-repository";
import {
  createAgoraLlmToken,
  resolveAgoraLlmBaseUrl,
} from "@/lib/agora/shared-context";

const AGORA_API_BASE =
  "https://api.agora.io/api/conversational-ai-agent/v2/projects";
const AGENT_UID = 100001;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

function basicAuth(customerId: string, customerSecret: string): string {
  return `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString("base64")}`;
}

function llmConfiguration(options: {
  customUrl: string | null;
  customToken: string;
  priorContext: string;
}) {
  const baseSystemMessage =
    "You are the AI Transformation Navigator. Lead a concise spoken assessment of the organization's digital and AI maturity. Begin by learning the company, industry, size, and goals, then ask one focused question at a time about strategy, technology, data, operations, people, governance, and customer experience. Acknowledge each answer briefly before the next question.";

  if (options.customUrl) {
    return {
      url: options.customUrl,
      api_key: options.customToken,
      params: {
        model: "ai-navigator",
        max_tokens: 2048,
        temperature: 0.4,
      },
      system_messages: [{ role: "system", content: baseSystemMessage }],
      greeting_message: options.priorContext
        ? "Let's continue our assessment in voice mode."
        : "Hi, I'm your AI Transformation Navigator. Tell me about your company and what you hope to improve with AI.",
      failure_message: "Sorry, I missed that. Could you say it again?",
      max_history: 40,
    };
  }

  const provider = getProvider();
  const apiKey = getApiKey(provider);
  if (!apiKey) throw new Error(`Missing API key for ${provider}`);

  if (provider === "anthropic") {
    throw new Error(
      "Agora voice currently requires LLM_PROVIDER=openai or deepseek"
    );
  }

  return {
    url:
      provider === "deepseek"
        ? "https://api.deepseek.com/chat/completions"
        : "https://api.openai.com/v1/chat/completions",
    api_key: apiKey,
    params: {
      model: getModel(),
      max_tokens: 1024,
      temperature: 0.4,
    },
    system_messages: [
      {
        role: "system",
        content: options.priorContext
          ? `${baseSystemMessage}\n\nConversation context from text mode:\n${options.priorContext}`
          : baseSystemMessage,
      },
    ],
    greeting_message: options.priorContext
      ? "Let's continue our assessment in voice mode."
      : "Hi, I'm your AI Transformation Navigator. Tell me about your company and what you hope to improve with AI.",
    failure_message: "Sorry, I missed that. Could you say it again?",
    max_history: 20,
  };
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const trustedOrigins = new Set<string>();
  const addOrigin = (value: string | null | undefined) => {
    if (!value) return;
    try {
      trustedOrigins.add(new URL(value).origin);
    } catch {
      // Invalid configuration must not weaken the origin check.
    }
  };

  // Direct local / run.app requests.
  addOrigin(request.url);
  // Public Cloud Run domain used by browser clients and Agora callbacks.
  addOrigin(process.env.APP_BASE_URL);
  addOrigin(process.env.AGORA_CUSTOM_LLM_BASE_URL);

  // Cloud Run proxies preserve the original host here when serving a custom
  // domain. It lets direct and mapped-domain requests work during migration.
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    addOrigin(`${forwardedProtocol}://${forwardedHost}`);
  }

  return trustedOrigins.has(origin);
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
    const body = (await request.json().catch(() => ({}))) as { sessionId?: unknown };
    if (typeof body.sessionId !== "string" || !body.sessionId.trim()) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }
    const sessionId = body.sessionId.trim();
    const appId = required("AGORA_APP_ID");
    const appCertificate = required("AGORA_APP_CERTIFICATE");
    const customerId = required("AGORA_CUSTOMER_ID");
    const customerSecret = required("AGORA_CUSTOMER_SECRET");
    const openAiKey = required("OPENAI_API_KEY");
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600;
    const uid = Math.floor(100000 + Math.random() * 800000);
    const channel = `assessment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { engine } = await loadOrCreateAssessmentEngine(sessionId);
    const priorContext = engine
      .getSession()
      .conversationHistory.slice(-20)
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");
    const customLlmBaseUrl = resolveAgoraLlmBaseUrl(request);
    const customLlmUrl = customLlmBaseUrl
      ? `${customLlmBaseUrl}/api/agora/llm?sessionId=${encodeURIComponent(sessionId)}`
      : null;
    const customLlmToken = createAgoraLlmToken(sessionId);

    const userToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      uid,
      RtcRole.PUBLISHER,
      expiresAt,
      expiresAt
    );
    const agentToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      AGENT_UID,
      RtcRole.PUBLISHER,
      expiresAt,
      expiresAt
    );

    const response = await fetch(`${AGORA_API_BASE}/${appId}/join`, {
      method: "POST",
      headers: {
        Authorization: basicAuth(customerId, customerSecret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `navigator-${Date.now()}`,
        properties: {
          channel,
          token: agentToken,
          agent_rtc_uid: AGENT_UID.toString(),
          remote_rtc_uids: [uid.toString()],
          enable_string_uid: false,
          idle_timeout: 120,
          asr: { language: "en-US", task: "conversation" },
          llm: llmConfiguration({
            customUrl: customLlmUrl,
            customToken: customLlmToken,
            priorContext,
          }),
          vad: {
            silence_duration_ms: 600,
            speech_duration_ms: 15000,
            interrupt_duration_ms: 180,
            prefix_padding_ms: 300,
          },
          tts: {
            vendor: "openai",
            params: {
              api_key: openAiKey,
              model: "gpt-4o-mini-tts",
              voice: "coral",
              speed: 1.12,
              instructions:
                "Speak with upbeat, confident energy and genuine curiosity. Keep a crisp professional cadence, use light vocal variety, and avoid sounding rushed or exaggerated.",
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Agora agent start failed (${response.status}): ${detail}`);
    }

    const agent = (await response.json()) as { agent_id: string };
    return NextResponse.json({
      appId,
      channel,
      token: userToken,
      uid,
      agentId: agent.agent_id,
      agentUid: AGENT_UID,
      sharedContext: Boolean(customLlmUrl),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Agora voice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
    const { agentId } = (await request.json()) as { agentId?: string };
    if (!agentId) return NextResponse.json({ success: true });

    const appId = required("AGORA_APP_ID");
    const auth = basicAuth(
      required("AGORA_CUSTOMER_ID"),
      required("AGORA_CUSTOMER_SECRET")
    );
    const response = await fetch(
      `${AGORA_API_BASE}/${appId}/agents/${encodeURIComponent(agentId)}/leave`,
      { method: "POST", headers: { Authorization: auth } }
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`Agora agent stop failed (${response.status})`);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to stop Agora voice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
