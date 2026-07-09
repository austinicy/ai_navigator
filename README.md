# AI Transformation Navigator

The Operating System for Digital & AI Maturity — an agentic, AI-native platform that assesses an organization's digital & AI maturity through conversation, generates personalized transformation roadmaps, and displays real-time scorecards.

Assess 7 dimensions of maturity across 30 criteria, get an AI Readiness sub-score, and receive a 3-phase transformation roadmap grounded in 15+ established reference frameworks (McKinsey DQ, Deloitte, MIT/Capgemini, Gartner, Microsoft MLOps, AWS ML Lens, and others).

## Screens

1. **Landing** (`/`) — hero with two entry points: start a chat assessment, or upload docs first. Plus a "Load demo company" link.
2. **Assessment** (`/assess`) — split view: conversational chat with the AI consultant (left) + live-updating scorecard with radar chart, dimension bars, AI Readiness breakdown, and evidence (right). Supports voice input (Web Speech API) and document upload (PDF/DOCX).
3. **Report** (`/report`) — four tabs: Overview (scores + critical gaps), Deep Dive (per-dimension evidence & criterion scores), Roadmap (3-phase plan with action cards + quick wins), Export (print-to-PDF).

The `?demo=true` query param on `/assess` and `/report` loads a pre-populated **Acme Corporation** demo dataset so the full flow is viewable without completing an assessment.

## Getting Started

### Prerequisites

- Node.js 20+
- An Anthropic API key (for live chat, document signal extraction, and roadmap generation)

### Install & run

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Without an API key

The app runs without `ANTHROPIC_API_KEY`, but the live Claude features degrade gracefully:

- Landing page, demo scorecard (`/assess?demo=true`), and the report's Overview / Deep Dive / Export tabs all work (they use the demo dataset).
- The chat (`/api/chat`), document upload (`/api/upload`), and roadmap generation (`/api/roadmap`) call Claude and will return errors — the UI shows friendly fallbacks (e.g. "Unable to generate roadmap") rather than crashing.

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
- **Claude API** (`@anthropic-ai/sdk`) with tool use — model `claude-sonnet-5`
- **pdf-parse** + **mammoth** for document extraction
- **@modelcontextprotocol/sdk** for the MCP server
- **vitest** for tests

## Architecture

```
src/
├── lib/
│   ├── framework/      # versioned JSON config (7 dims, 30 criteria, 6 AI-readiness components) + loader
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

The maturity framework synthesizes 15+ established public models. See `src/lib/framework/v1.json` (`referenceFrameworks`) and the design spec at `docs/superpowers/specs/2026-07-09-ai-digital-transformation-scorecard-design.md`.

## Project layout & history

This branch (`ai-navigator-impl`) was built task-by-task from the plan at `docs/superpowers/plans/2026-07-09-ai-navigator-implementation.md`. See `.superpowers/sdd/progress.md` for the per-task progress ledger.
