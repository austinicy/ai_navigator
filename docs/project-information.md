# AI Transformation Navigator — Technical Project Information

Last updated: July 11, 2026

## 1. Product overview

AI Transformation Navigator is a conversational assessment application for measuring an organization's digital and AI maturity. It combines a versioned assessment framework, an LLM-driven evidence-gathering agent, deterministic scoring, live scorecards, document analysis, roadmap generation, real-time voice, and a standalone MCP interface.

The assessment covers seven dimensions and 30 criteria. It produces maturity scores, confidence values, evidence trails, an AI Readiness score, benchmark context, gaps, and a phased transformation roadmap.

## 2. Runtime architecture

The web application runs on Next.js 16.2.10 using the App Router, React 19, strict TypeScript, Tailwind CSS 4, and server Route Handlers.

```text
Browser
  ├── Next.js pages and React components
  ├── useChat / useAssessment
  ├── localStorage assessment snapshot
  └── Agora Web RTC client
         │ microphone audio + transcript data
         ▼
Next.js Route Handlers
  ├── /api/chat
  ├── /api/agora/session
  ├── /api/upload
  ├── /api/roadmap
  ├── /api/assess
  └── /api/demo
         │
         ├── Anthropic / OpenAI / DeepSeek
         ├── Agora Conversational AI
         └── OpenAI TTS
```

The standalone MCP server exposes the same assessment domain through stdio or Streamable HTTP for external clients and voice-device integrations.

## 3. Assessment framework and scoring

Framework definitions live in `src/lib/framework/`. Version 2 is the active framework; version 1 is retained for migration/history. The configuration defines dimensions, criteria, weights, scoring anchors, dependencies, confidence thresholds, AI Readiness components, and reference frameworks.

`AssessmentEngine` owns the active session state. Evidence has a source, dimension, optional criterion, strength, and weight. Dimension scores are calculated from criterion scores. Confidence combines criterion coverage and evidence volume/strength instead of treating an unsupported score as certain.

The engine returns `AssessmentDelta`, which contains:

- dimension scores, confidence, evidence, gaps, and criterion results;
- AI Readiness score and component values;
- signals collected and assessment progress;
- organization profile and benchmark values;
- framework version and next recommended focus.

The LLM never directly replaces deterministic score calculation. It gathers evidence and invokes assessment tools; the domain engine applies the state changes.

## 4. Text-agent flow

`POST /api/chat` supports two operations:

- kickoff, where the assistant asks the first assessment question;
- a normal user turn, where the agent receives conversation history, framework context, and tools.

The agent can calculate scores, update the organization profile, estimate benchmarks, and generate roadmap information. Tool results are returned to the LLM until it produces a final assistant response. The final response and the updated assessment delta are sent to the browser.

The current web session store is an in-memory singleton intended for a prototype/hackathon deployment. It is not multi-user durable storage. A production system should replace it with authenticated, per-session persistence in a database or distributed cache.

## 5. Agora voice architecture

Voice mode no longer depends on the browser Web Speech API. It uses `agora-rtc-sdk-ng` and Agora Conversational AI.

### Session startup

1. The browser checks `getUserMedia({ audio: true })` before creating a billable agent.
2. `POST /api/agora/session` validates the request origin and server configuration.
3. The server generates one-hour RTC publisher tokens for the user and agent.
4. The server starts an Agora Conversational AI agent through Agora's REST API.
5. The browser joins the generated channel and publishes its microphone track.

### Speech pipeline

```text
Microphone
  → Agora RTC
  → Agora built-in ASR (en-US)
  → DeepSeek or OpenAI-compatible chat completion
  → OpenAI gpt-4o-mini-tts (coral voice, speed 1.12)
  → Agora RTC remote audio
  → browser speakers
```

Agora sends user and assistant transcription messages over the RTC data stream. Messages can be chunked and base64 encoded; `useAgoraVoice` reassembles, decodes, and renders them. The hook also manages microphone mute state, remote audio subscription, connection status, cancellation, duplicate-start prevention, device errors, and agent cleanup.

`DELETE /api/agora/session` removes the remote agent when voice mode closes. Startup preflights microphone access so a missing or denied device does not unnecessarily create an Agora agent.

### Current voice limitation

Agora currently runs the spoken conversation as its own agent pipeline. Voice transcripts appear in the voice overlay, but they are not yet applied to the web `AssessmentEngine`; therefore voice-only answers do not update the live scorecard. The next integration step is a custom Agora LLM endpoint or transcript bridge that routes finalized user turns through the same assessment tool loop and returns the resulting assistant text to Agora TTS.

## 6. LLM providers

The server supports Anthropic, OpenAI, and DeepSeek for text workflows. Provider selection is explicit through `LLM_PROVIDER` or inferred from available keys in this order: Anthropic, OpenAI, DeepSeek. `LLM_MODEL` overrides the provider default.

Agora's current voice configuration requires an OpenAI-compatible chat-completions endpoint, so voice mode supports OpenAI or DeepSeek. OpenAI is also required for the configured TTS voice.

## 7. Documents and roadmaps

The upload route accepts PDF and Word documents. `pdf-parse` and `mammoth` extract text, after which the LLM identifies relevant maturity signals. Extracted evidence is stronger by default than conversational evidence but still passes through deterministic assessment logic.

Roadmap generation converts the assessment state into three transformation phases, including initiatives, dependencies, effort/impact, gaps, and quick wins. Demo data provides a complete report path without requiring a live assessment.

## 8. Client state and UI

The assessment screen uses a split chat/scorecard layout. `useChat` manages messages and server turns. `useAssessment` stores the latest assessment snapshot in `localStorage`, allowing the report page to reuse the result. The demo query parameter loads a prebuilt Acme Corporation dataset.

The report provides Overview, Deep Dive, Roadmap, and Export views. Recharts renders radar and dimension visualizations. Voice mode replaces the text input with the Agora overlay while active.

## 9. Security boundaries

The following values must remain server-only and must never use a `NEXT_PUBLIC_` prefix:

- LLM provider API keys;
- Agora App Certificate;
- Agora Customer ID and Customer Secret;
- OpenAI TTS key.

The Agora App ID and short-lived RTC user token are intentionally returned to the browser. The `/api/agora/session` route enforces same-origin browser requests, generates unique channel names and user IDs, and limits token validity to one hour.

Production hardening should add authentication, per-user authorization, distributed rate limiting, spend limits, structured secret rotation, audit logging, and durable session ownership. Same-origin validation alone is not a substitute for authentication.

## 10. Environment variables

```env
# Text and assessment LLMs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
LLM_PROVIDER=deepseek
LLM_MODEL=

# Agora voice
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
AGORA_CUSTOMER_ID=
AGORA_CUSTOMER_SECRET=

# MCP transport
MCP_TRANSPORT=stdio
MCP_PORT=8080
```

Only the root `.env.local` is loaded by the Next.js application. A file under `src/.env.local` is not part of the supported configuration.

## 11. Testing and quality checks

Vitest covers framework loading, scoring, assessment state, agent behavior, confidence, benchmarks, document parsing/extraction, roadmap generation, demo data, voice hooks, and selected UI behavior.

Standard checks:

```bash
npm test
npm run lint
npm run build
npm run build:mcp
```

TypeScript is configured in strict mode. Agora credentials and live upstream calls are not required by the unit suite; production voice should additionally be covered by an environment-gated integration test.

## 12. Deployment

The Next.js app can be deployed to AWS Amplify, Vercel, or a container platform such as Cloud Run. It needs outbound HTTPS access to the selected LLM providers and Agora. HTTPS is required for browser microphone access outside localhost.

The MCP HTTP server is a separate process and can be deployed through App Runner or Cloud Run. See `docs/deployment.md` for the existing deployment plan.

## 13. Known technical debt and recommended next work

1. Unify Agora voice turns with `AssessmentEngine` so spoken evidence updates the scorecard.
2. Replace the singleton web assessment session with authenticated durable storage.
3. Add server-side rate limiting and usage quotas to all paid-provider routes.
4. Add microphone selection and device-change handling.
5. Renew RTC tokens for voice sessions longer than one hour.
6. Add structured telemetry for Agora connection state, ASR latency, LLM latency, TTS latency, and agent cleanup.
7. Add end-to-end tests for text assessment, document upload, voice startup, and report persistence.
