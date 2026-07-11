# Technical Architecture

## Runtime components

| Component | Responsibility |
|---|---|
| Next.js 16 / React 19 web app | UI, API routes, documents, reports, browser voice |
| Assessment engine | Session state, evidence, confidence, deterministic scores |
| LLM adapter | Anthropic, OpenAI, or DeepSeek tool-calling turns |
| Agora Conversational AI | Browser RTC audio, ASR, TTS, and shared-LLM callback |
| MCP service | Text-only assessment interface for MyBot/ESP32 and other MCP clients |
| GCS session repository | Shared JSON persistence between web and MCP services |

## Data flow

```text
Text / document / finalized transcript
  → assessment agent gathers grounded evidence
  → AssessmentEngine updates evidence and criterion scores
  → deterministic score/confidence functions calculate outputs
  → AssessmentDelta reaches the scorecard and report
  → GCS sessions/<sessionId>.json persists shared state
```

The LLM does not directly set an overall maturity score. It proposes evidence and calls internal assessment functions; the engine applies scoring rules.

## Shared sessions

`GCS_SESSION_BUCKET` enables a repository backed by `sessions/<opaque-session-id>.json`. Both Cloud Run services use their service identities to read and write these objects with generation-match preconditions. A stale write fails rather than silently overwriting a newer turn.

When the variable is absent, local development falls back to process memory. That fallback is not shared between the Next.js and MCP processes and is not durable.

## APIs

| Route | Function |
|---|---|
| `POST /api/chat` | Text kickoff and turns |
| `GET /api/chat` | Refresh an active assessment |
| `POST /api/upload` | Parse PDF/DOCX and extract signals |
| `POST /api/agora/session` | Create/stop browser voice session |
| `POST /api/agora/llm` | Agora’s authenticated shared assessment callback |
| `GET /api/assess` | Load a session or list demo history summaries |
| `POST /api/demo/seed` | Seed a web demo scenario |
| `POST /api/roadmap` | Generate a roadmap from assessment state |

## MCP interface

The public MCP endpoint is Streamable HTTP at `POST /mcp`. It intentionally exposes only these voice-safe tools:

- `assessment_list_demos`
- `assessment_start`
- `assessment_continue`
- `assessment_status`
- `assessment_resume`
- `assessment_finish`

MCP receives finalized **text**, never raw device audio. Each continued turn is saved to the shared session before the tool returns, including a fallback transcript entry if the upstream LLM temporarily fails.

## Security boundaries

- Keep LLM keys, Agora App Certificate, Agora customer credentials, and TTS key server-only.
- `AGORA_APP_ID` and short-lived RTC tokens are intentionally client-visible.
- GCS is private; browsers access it only through the web API.
- `APP_BASE_URL` is an allowlisted public origin for Agora session creation behind Cloud Run/custom-domain proxies.

The demo MCP endpoint is currently unauthenticated. It must not be treated as multi-tenant or public-production ready; see [limitations and future work](limitations-and-future-work.md).
