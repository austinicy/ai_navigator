# AI Transformation Navigator

The Operating System for Digital & AI Maturity — an agentic, AI-native platform that assesses an organization's digital & AI maturity through conversation, generates personalized transformation roadmaps, and displays real-time scorecards.

Assess seven core digital-maturity dimensions plus a dedicated GenAI and agentic-systems module across 37 criteria. The platform reports Digital Maturity, AI Readiness, and GenAI & Agentic Readiness separately, then generates a dependency-aware transformation roadmap grounded in 17 traceable primary sources.

## Screens

1. **Landing** (`/`) — hero with two entry points: start a chat assessment, or upload docs first. Plus a "Load demo company" link.
2. **Assessment** (`/assess`) — split view: conversational chat with the AI consultant (left) + live-updating scorecard with radar chart, dimension bars, AI Readiness breakdown, and evidence (right). Supports voice input (Web Speech API) and document upload (PDF/DOCX).
3. **Report** (`/report`) — four tabs: Overview (scores + critical gaps), Deep Dive (per-dimension evidence & criterion scores), Roadmap (3-phase plan with action cards + quick wins), Export (print-to-PDF).

The `?demo=true` query param on `/assess` and `/report` loads a pre-populated **Acme Corporation** demo dataset so the full flow is viewable without completing an assessment.

## Getting Started

### Prerequisites

- Node.js 20+
- An API key for at least one LLM provider (any one enables the full live flow):
  - **Anthropic** — get one at https://console.anthropic.com/
  - **OpenAI** — get one at https://platform.openai.com/api-keys
  - **DeepSeek** — get one at https://platform.deepseek.com/

### Install & run

```bash
npm install
cp .env.example .env.local   # then add one provider key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Choosing a provider

The app supports three LLM providers, selected by the `LLM_PROVIDER` env var
(`anthropic`, `openai`, or `deepseek`). If `LLM_PROVIDER` is unset, the app
auto-selects by key presence in this order: anthropic → openai → deepseek.
Any single provider key is enough to run the live chat, document signal
extraction, and roadmap generation.

Default models (override with `LLM_MODEL`):

| Provider  | Default model      |
|-----------|--------------------|
| anthropic | `claude-sonnet-5`  |
| openai    | `gpt-4o`           |
| deepseek  | `deepseek-chat`    |

DeepSeek is accessed via the OpenAI-compatible SDK with `baseURL=https://api.deepseek.com`.

### Without an API key

The app runs without any API key, but the live LLM features degrade gracefully:

- Landing page, demo scorecard (`/assess?demo=true`), and the report's Overview / Deep Dive / Export tabs all work (they use the demo dataset).
- The chat (`/api/chat`), document upload (`/api/upload`), and roadmap generation (`/api/roadmap`) call the LLM and will return errors — the UI shows friendly fallbacks (e.g. "Unable to generate roadmap") rather than crashing.

So `npm run dev` + open `/assess?demo=true` is the quickest way to see the product without a key.

### MCP server (voice device integration)

A Model Context Protocol server exposing 10 tools (`start_assessment`, `chat`, `get_scorecard`, `generate_roadmap`, `upload_document`, `read_document`, `search_knowledge`, `calculate_score`, `estimate_benchmark`, `update_org_profile`):

```bash
npm run build:mcp
npm run mcp        # starts the stdio MCP server
# or: npx ai-navigator-mcp
```

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (dark neon theme) + **shadcn/ui** + **Recharts**
- **Multi-provider LLM** — Anthropic (`@anthropic-ai/sdk`), OpenAI + DeepSeek (`openai` SDK) with tool use, selected by `LLM_PROVIDER` env var
- **pdf-parse** + **mammoth** for document extraction
- **@modelcontextprotocol/sdk** for the MCP server
- **vitest** for tests

## Architecture

```
src/
├── lib/
│   ├── framework/      # versioned v1/v2/v3 configs, source ledger, 7 core dimensions + GenAI module
│   ├── assessment/     # types, scoring, AssessmentEngine (session state), Claude agent + tools
│   ├── document/       # PDF/DOCX parser + AI signal extractor
│   ├── roadmap/        # roadmap types + Claude-based generator
│   └── demo/           # pre-populated Acme Corporation demo session
├── app/
│   ├── page.tsx        # landing
│   ├── assess/         # assessment page (split view)
│   ├── report/         # report page (4 tabs)
│   └── api/            # chat, upload, assess, roadmap, demo routes
├── components/         # landing/, assess/, report/, shared/, ui/
├── hooks/              # useChat, useVoice, useAssessment
└── mcp/                # MCP server + tools + cli
```

**Data flow:** versioned JSON framework → `AssessmentEngine` (session state + weighted scoring) → Claude agent with 4 tools (`calculate_score`, `update_org_profile`, `estimate_benchmark`, `generate_roadmap`) → `AssessmentDelta` (incremental update) → API → React hooks → live scorecard. Session state is shared between the assess and report pages via `localStorage` (`useAssessment` hook), with the demo dataset as fallback.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run test` | Run the vitest suite (116 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run build:mcp` | Compile the MCP server to `dist/mcp` |
| `npm run mcp` | Start the MCP server (stdio) |

## Framework grounding

Framework v3 uses a structured ledger of 17 direct primary sources, including NIST AI RMF and its GenAI Profile, ISO/IEC 42001 and 42005, AWS GenAI/Agentic/Responsible AI lenses, Microsoft MLOps/GenAIOps and agentic adoption guidance, Google Cloud's AI Adoption Framework, IMDA AI Verify, and OWASP GenAI/agentic security guidance. See `src/lib/framework/v3.ts` and `docs/framework-v3.md`.

## Project layout & history

This branch (`ai-navigator-impl`) was built task-by-task from the plan at `docs/superpowers/plans/2026-07-09-ai-navigator-implementation.md`. See `.superpowers/sdd/progress.md` for the per-task progress ledger.
