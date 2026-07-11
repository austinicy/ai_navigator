# Agent and IoT Workflows

## Web and browser-voice workflow

```text
Browser text or document
  → Next.js API
  → assessment agent + engine
  → GCS session JSON
  → live scorecard/report

Browser microphone
  → Agora RTC / ASR
  → /api/agora/llm
  → same assessment agent + engine
  → Agora TTS
  → browser speaker
```

The browser creates an opaque session ID. The web API, upload route, and shared Agora callback use that ID to load/save the same assessment snapshot.

## MyBot / ESP32 workflow

```text
ESP32 microphone and speaker
  → Agora MyBot: audio, ASR, dialogue model, TTS
  → AI Navigator MCP: finalized text tool calls only
  → GCS session JSON
  → companion web report/history
```

The ESP32 and MCP do not exchange raw audio. MyBot keeps the returned opaque `sessionId` in its conversation context and sends each finalized user answer through `assessment_continue`.

## Voice-agent tool sequence

1. Ask the user to choose full assessment or demo.
2. For a demo, call `assessment_list_demos`, let the user choose, then call `assessment_start(mode="demo")`.
3. For a full assessment, call `assessment_start(mode="full")`.
4. For every finalized user answer, call `assessment_continue` with the active session ID and full text.
5. Use `assessment_status` for progress and `assessment_resume` after reconnecting.
6. Call `assessment_finish`; include `finalMessage` only when a final transcript/summary was not already submitted turn-by-turn.

Speak only `speakableReply`. Do not speak JSON, session IDs, URLs, internal tools, or raw score payloads.

## Demo scenarios

The deployed demos seed grounded evidence, documents, profile context, and one open question. They are deliberately incomplete so the user can continue the assessment:

- Northstar Components: manufacturing, predictive maintenance, and a maintenance copilot.
- Harbor & Pine Retail: omnichannel retail and customer-service assistant.
- Beacon Mutual: financial services, governance, and advisor copilot.

Use the current MyBot prompt and settings in [xiaozhi-esp32-agent-prompt-and-settings.md](xiaozhi-esp32-agent-prompt-and-settings.md).
