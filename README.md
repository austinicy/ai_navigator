# AI Transformation Navigator

AI Transformation Navigator is a conversational digital, AI, GenAI, and agentic-AI maturity assessment. It gathers evidence through chat, documents, browser voice, or an MCP-connected IoT agent; applies deterministic scoring; and produces a live scorecard and transformation roadmap.

## What it does

- Assesses seven core dimensions and seven GenAI/agentic capabilities.
- Reports Digital Maturity (1–5), AI Readiness (0–100), and GenAI & Agentic Readiness (0–100) separately.
- Captures evidence from text conversation and text-based PDF/DOCX documents.
- Provides three prepared, half-finished demo scenarios that a voice agent can continue.
- Shares web and MCP sessions through JSON objects in Google Cloud Storage when `GCS_SESSION_BUCKET` is configured.
- Supports Agora browser voice and a Streamable HTTP MCP interface for devices such as Xiaozhi ESP32 through Agora MyBot.

## Quick start

Requirements: Node.js 20+ and one LLM provider key.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The product demo works at `/assess?demo=true` without an LLM key.

## Main routes

| Route | Purpose |
|---|---|
| `/` | Product overview and entry points |
| `/assess` | Chat/voice assessment with live scorecard |
| `/demos` | Prepared scenarios to continue |
| `/history` | Shared session history when GCS is configured |
| `/report` | Overview, evidence, roadmap, and export |
| `/methodology` | Public assessment-method explanation |

## Documentation

- [Technical architecture](docs/project-information.md)
- [Assessment methodology and score breakdown](docs/assessment-methodology.md)
- [Agent and IoT workflows](docs/agent-and-iot-workflows.md)
- [Xiaozhi / Agora MyBot configuration](docs/xiaozhi-esp32-agent-prompt-and-settings.md)
- [GCP Cloud Run deployment guide](docs/deployment.md)
- [Limitations and future work](docs/limitations-and-future-work.md)
- [Framework v3 and sources](docs/framework-v3.md)

## Quality checks

```bash
npm test
npm run lint
npm run build
npm run build:mcp
```

## Deployment

The supported demo deployment is two Cloud Run services plus a private GCS bucket:

```text
Web browser / Agora voice → ai-navigator-web → GCS session JSON
Agora MyBot / ESP32      → ai-navigator-mcp → GCS session JSON
```

Follow [docs/deployment.md](docs/deployment.md) for the exact GCP setup, custom domain, secrets, and MCP smoke tests.
