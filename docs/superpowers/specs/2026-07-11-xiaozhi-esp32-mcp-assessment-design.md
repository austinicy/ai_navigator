# Xiaozhi ESP32 MCP Assessment Integration — Design Specification

**Status:** Planning only — no runtime implementation is authorized by this document.

**Date:** 2026-07-11

## Confirmed integration decisions

- The device character is hosted by Agora at `https://mybot.sg3.agoralab.co/`.
- Agora's hosted bot is expected to own device audio, STT, dialogue orchestration, and TTS. AI Navigator MCP remains text/tool based.
- App Runner is not available for this deployment.
- The recommended first deployment is one AWS Lightsail Container Service for simplicity, with ECS Express Mode/Fargate retained as the scale-up path.
- The exact Agora MCP transport remains to be confirmed from the authenticated MyBot configuration screen: direct Streamable HTTP URL, WebSocket MCP endpoint, or webhook/tool API.

## 1. Goal

Let a Xiaozhi ESP32 act as the voice interface for the same evidence-based assessment and scoring system used by the web UI. The device must support two entry modes:

1. **Full assessment** — a guided assessment across all configured framework sections.
2. **Demo assessment** — start from one of the pre-built company scenarios and reach a useful updated score/report after a few focused Q&A turns.

The ESP32 is responsible for microphone, speaker, wake word, and audio playback. The Xiaozhi voice backend handles ASR, TTS, dialogue orchestration, and tool selection. AI Navigator MCP tools receive text and return text/structured assessment state. MCP does not transport raw audio.

## 2. Verified Xiaozhi boundary

The official Xiaozhi firmware connects to its backend over WebSocket or MQTT and carries Opus audio plus JSON events. Its built-in MCP implementation makes the **device a tool server** so the backend can discover and operate device capabilities. In this project, Agora's hosted MyBot service replaces the self-hosted voice-backend responsibility. AI Navigator must not duplicate Agora's STT/TTS pipeline.

External tool attachment depends on what the authenticated Agora MyBot console exposes. If it accepts a standard Streamable HTTP MCP URL, it can call AI Navigator directly. If it exposes a Xiaozhi-style WebSocket MCP access point, use the official bridge described below. If it supports only webhook/function tools, add a thin authenticated adapter over the same application service.

Primary references:

- [Xiaozhi MCP IoT control usage](https://github.com/78/xiaozhi-esp32/blob/main/docs/mcp-usage.md)
- [Xiaozhi WebSocket/audio protocol](https://github.com/78/xiaozhi-esp32/blob/main/docs/websocket.md)
- [Xiaozhi MCP wire protocol](https://github.com/78/xiaozhi-esp32/blob/main/docs/mcp-protocol.md)
- [Xiaozhi backend external MCP endpoint guide](https://github.com/xinnan-tech/xiaozhi-esp32-server/blob/main/docs/mcp-endpoint-integration.md)
- [Official Xiaozhi MCP bridge sample](https://github.com/78/mcp-calculator)

Consequently, the desired flow is:

```text
User speech
   ↓ microphone / Opus
Xiaozhi ESP32
   ↓ Xiaozhi WebSocket or MQTT
Agora MyBot hosted voice backend
   ├─ ASR: audio → finalized text
   ├─ character prompt + LLM selects assessment tool
   ├─ Agora tool connection
   │      ↓ direct Streamable HTTP, webhook adapter, or optional WSS bridge
   │   AI Navigator MCP provider
   │      ↓ shared assessment service/repository
   │   scoring, evidence, documents, demo seed, report state
   └─ TTS: speakable tool result → Opus
          ↓
       ESP32 speaker
```

The current `POST /mcp` endpoint is standard Streamable HTTP. Direct compatibility cannot be confirmed from the public `mybot.sg3.agoralab.co` page because the relevant configuration is authenticated. The deployment must support direct HTTP first and keep the official `mcp_pipe` bridge optional until the MyBot MCP configuration is inspected.

## 3. Current MCP audit

### What exists

- Ten tools are declared in `src/mcp/tools.ts`.
- `src/mcp/server.ts` implements stdio and Streamable HTTP transports.
- `infra/mcp/Dockerfile` packages the MCP process.
- `chat` reuses `runAgentTurn`, so its scoring logic is broadly aligned with the web agent.
- Document parsing, framework search, scoring, benchmarking, and roadmap calls are exposed.
- The MCP tool-definition unit tests pass (5 tests).

### Blocking findings

| Area | Current behavior | Impact | Required direction |
|---|---|---|---|
| Build | `npm run build:mcp` fails resolving `pdf-parse/worker` under the command's legacy `moduleResolution=node` | Docker build/deployment cannot succeed | Add a dedicated MCP build config/bundler compatible with package exports and verify runtime output |
| Session isolation | One module-global `engine` variable is shared by every MCP client | Devices overwrite or leak one another's company data | Require an opaque `sessionId` and repository lookup per tool call |
| Durability | MCP and web stores are process-local; MCP and Next.js run in different processes | Restart/scale loses sessions; device results are not visible to web reports | Introduce a shared durable assessment repository, recommended DynamoDB on AWS |
| Agora transport | Server accepts stdio or inbound Streamable HTTP only; authenticated MyBot options are not yet visible | Compatibility is not confirmed | Test direct Streamable HTTP first, then webhook adapter or `mcp_pipe` only if required |
| Authentication | HTTP MCP endpoint has no authentication, tenant ownership, or rate limiting | Anyone reaching the endpoint can spend LLM tokens and read/write assessment state | Bearer/API key at transport plus per-session ownership and quotas |
| Voice output shape | `chat` returns the full `AgentResponse` and scorecard JSON | Xiaozhi may read JSON or internal state aloud | Add a voice-first turn tool with `speakableReply` and compact metadata |
| Assessment modes | `start_assessment` has no `full`/`demo` mode or demo scenario selector | Requested demo flow cannot be selected reliably | Add explicit mode and scenario contracts |
| Resume/history | Tools have no robust resume/list mechanism and rely on a global engine | Reconnection cannot safely continue a session | Add resume/status tools and durable session binding |
| Evidence integrity | Public `calculate_score` accepts scores/gaps without evidence | A device agent can create low-confidence or untraceable scores | Keep scoring internal; Xiaozhi should use the high-level assessment-turn tool |
| Upload safety | Upload can process a document without an active engine and silently not attach it | Signals may be returned but lost | Require session, size/type limits, explicit status, and durable object storage |
| Knowledge search | `query` is ignored and the full selected framework section is returned | Large tool result and weak relevance for voice | Implement filtered, bounded results or keep tool internal |
| Roadmap | Tool parameters are accepted but ignored; completion/readiness is not enforced | Misleading roadmap and unnecessary LLM cost | Generate from stored session and expose explicit report readiness |
| Health/operations | No `/health`, structured logs, metrics, or integration tests | Weak container health and diagnosis | Add health/readiness checks, correlation IDs, latency/error metrics |

### Suitability verdict

The current MCP code is a useful prototype and shares the core agent/scoring implementation, but it is **not suitable for a deployed Xiaozhi multi-device demo yet**. The build failure, singleton engine, missing durability/authentication, verbose voice response, and transport mismatch must be resolved first.

## 4. Target architecture

### 4.1 Shared assessment application service

Create a transport-neutral service used by Next.js routes and MCP handlers:

```ts
interface AssessmentApplicationService {
  start(input: StartAssessmentInput, principal: Principal): Promise<StartAssessmentResult>;
  continueTurn(input: ContinueAssessmentInput, principal: Principal): Promise<VoiceTurnResult>;
  getSummary(sessionId: string, principal: Principal): Promise<AssessmentSummary>;
  finish(sessionId: string, principal: Principal): Promise<FinishResult>;
}
```

The service owns validation, evidence/scoring orchestration, demo seeding, optimistic concurrency, and report readiness. Web/API/MCP transports must not manipulate an `AssessmentEngine` singleton directly.

### 4.2 Repository and storage

Recommended AWS storage:

- **DynamoDB `AssessmentSessions`** — serialized session snapshot, owner/tenant, mode, scenario, version, timestamps, TTL for demo sessions.
- **DynamoDB `DeviceBindings`** — optional `deviceId → currentSessionId` binding; never trust device ID without authenticated principal context.
- **S3 `AssessmentDocuments`** — original uploads and extracted-text artifacts if device/web document sharing is needed.
- **Signed report token** — short-lived, read-only token referencing session and tenant; do not place raw session ownership credentials in the URL.

Use conditional writes on a numeric `version` to prevent simultaneous web/device turns from overwriting each other. Serialize turns per session or retry on version conflict.

### 4.3 Xiaozhi-facing tools

Expose a small voice-safe tool set. Keep low-level scoring tools private to the assessment agent.

#### `assessment_list_demos`

Input: none.

Output: compact list of `{ id, companyName, industry, oneLineDescription }`.

#### `assessment_start`

Input:

```json
{
  "mode": "full | demo",
  "scenarioId": "required only for demo",
  "companyName": "optional for full",
  "industry": "optional for full",
  "size": "optional for full"
}
```

Output:

```json
{
  "sessionId": "opaque-token",
  "speakableReply": "...one focused opening question...",
  "mode": "full",
  "progress": { "assessed": 0, "total": 8 },
  "reportReady": false
}
```

#### `assessment_continue`

Input:

```json
{
  "sessionId": "opaque-token",
  "message": "finalized user transcript",
  "turnId": "idempotency key supplied by the Xiaozhi agent/bridge"
}
```

Output:

```json
{
  "speakableReply": "...short acknowledgement and one next question...",
  "scoreChanged": true,
  "changedSections": ["genai"],
  "progress": { "assessed": 5, "total": 8, "signals": 19 },
  "reportReady": true,
  "isComplete": false,
  "reportUrl": "https://app.example.com/report/device?t=signed-token"
}
```

#### `assessment_status`

Input: `sessionId`.

Output: company, mode, concise scores, next focus, report readiness, and report URL. Do not return the full evidence corpus unless explicitly requested through an authenticated administrative tool.

#### `assessment_finish`

Input: `sessionId`.

Output: concise spoken summary and signed report URL. Full mode should distinguish `complete` from `partial report`; demo mode uses scenario-specific completion targets.

#### `assessment_resume`

Input: `sessionId` or authenticated current-device binding.

Output: a concise recap and the next unanswered question.

### 4.4 Full and demo behavior

**Full mode**

- Start with company profile and intended outcome.
- Ask one focused question at a time.
- Score only supported criteria and record quoted/paraphrased evidence.
- Cover all configured sections, including GenAI & Agentic Readiness.
- Allow a partial report after meaningful evidence; label it partial until completion confidence is reached.

**Demo mode**

- Reuse the three pre-built scenarios already present in `src/lib/demo/scenarios.ts`.
- Seed company profile, two documents, evidence, scores, and conversation context.
- Define 3–5 scenario-specific target criteria/questions.
- `reportReady` is true immediately for the seeded report; `demoComplete` becomes true after the remaining target criteria are answered or the user says to finish.
- Never pretend a demo's seeded evidence came from the current user; label sources as demo documents/context.

## 5. Voice response requirements

- Speak in short sentences; normally 1–2 sentences plus one question.
- Never read JSON, IDs, URLs, confidence decimals, internal tool names, or framework IDs aloud.
- Acknowledge the user's evidence before the next question.
- If a score changes, mention the section in plain language, not every number.
- Read a score only when the user asks for it.
- If the tool fails, apologize briefly and ask the user to retry; do not invent state.
- The Xiaozhi character prompt must always use the tool's `speakableReply` as the factual source for assessment dialogue.

## 6. Security and privacy

- TLS everywhere (`wss://` and `https://`).
- Store Xiaozhi MCP endpoint token, MCP service credential, LLM keys, and signing keys in AWS Secrets Manager.
- Authenticate the Streamable HTTP endpoint before reading a request body.
- Bind sessions to a principal/tenant and enforce ownership on every call.
- Use opaque random session IDs; never derive authorization from company name or MAC address.
- Apply request size limits, document MIME/type validation, rate limits, per-device quotas, and timeouts.
- Redact credentials, raw document contents, and full transcripts from normal logs.
- Provide TTL/deletion for demo sessions and a user-requested deletion path for real assessments.

## 7. AWS deployment decision

The existing deployment document recommends Amplify + App Runner. That is no longer the safe default in July 2026:

- AWS Amplify's official documentation currently supports Next.js SSR only through Next.js 15, while this project runs Next.js 16.2.10.
- AWS App Runner is closed to new AWS customers. AWS recommends ECS Express Mode; existing App Runner customers may continue using it.

Easiest demo target:

```text
AWS Lightsail Container Service (one deployment)
   ├─ gateway container (public managed HTTPS)
   │    ├─ /      → Next.js web container on localhost:3000
   │    └─ /mcp   → MCP container on localhost:8080
   ├─ web container (Next.js 16)
   ├─ MCP container (text/tools only)
   └─ optional bridge container (only if Agora provides a WSS MCP endpoint)

DynamoDB ← shared web/MCP assessment sessions
S3       ← optional durable documents
CloudWatch/Lightsail logs ← diagnostics
```

Lightsail supports multiple containers in one deployment, supplies a managed HTTPS endpoint, and permits same-service containers to communicate through `localhost`. It is the simplest all-AWS container path for the demo. Use DynamoDB because Lightsail container instances are not the source of truth for durable sessions. For stronger IAM/secrets/auto-scaling requirements, promote the same images to ECS Express Mode/Fargate later.

If Agora accepts direct Streamable HTTP MCP, omit the bridge entirely. If a bridge is required, prove it locally first and then add it as the fourth Lightsail container or a singleton ECS worker.

## 8. Acceptance criteria

1. MCP bundle and Docker image build reproducibly.
2. Stdio and authenticated Streamable HTTP initialize/list/call smoke tests pass.
3. Xiaozhi console discovers only the approved high-level assessment tools through the bridge.
4. Two simulated devices run different companies concurrently without data crossover.
5. A device disconnect/reconnect resumes the correct assessment after process restart.
6. Full mode starts empty and updates the same deterministic scorecard model as the web UI.
7. Each demo mode starts with its seeded documents/evidence and produces a changed score within a few grounded answers.
8. GenAI evidence from device speech updates GenAI & Agentic Readiness.
9. Tool output is concise and safe for TTS; IDs/JSON are not spoken.
10. A signed report URL opens the matching server-side report from another browser.
11. Web and device access the same stored session without lost updates.
12. Unauthorized MCP/session/report requests are rejected and logged without leaking data.

## 9. Decisions required before implementation

1. Agora MyBot MCP configuration: direct HTTP URL, WSS endpoint, or webhook/function-tool screen. A screenshot/export of this authenticated section is sufficient.
2. Device/session identity: one shared demo device, multiple devices, or authenticated users/tenants.
3. Report sharing: public short-lived demo links only, or authenticated permanent organization history.
4. Document retention: no original files, temporary S3, or durable encrypted S3 retention.
