# AI-Powered Digital Transformation Scorecard — Design Spec

**Date:** 2026-07-09  
**Status:** Approved  
**Project:** AI Transformation Navigator  
**Type:** Hackathon Build (3-day sprint)

---

## 1. Problem Statement

Organizations investing in digital transformation and AI initiatives lack a clear, real-time understanding of their maturity level. Current assessments are manual, fragmented, and quickly outdated. There is no intelligent platform that continuously assesses digital maturity, identifies capability gaps, and recommends transformation priorities in real time.

**Challenge:** How might we help organizations understand their digital and AI maturity, benchmark progress, and identify the next highest-impact transformation opportunities through AI?

**Goal:** Reduce the time required to assess and plan digital transformation from months to minutes.

---

## 2. Product Vision

An AI-native assessment and roadmap platform that evaluates organizations, benchmarks maturity, identifies gaps, and recommends prioritized transformation actions through conversational AI.

**Name:** AI Transformation Navigator

**Tagline:** The Operating System for Digital & AI Maturity

---

## 3. Approach: Adaptive Framework

We chose **Approach 2: Adaptive Framework** — a structured maturity backbone combined with AI conversational reasoning.

**Why this approach:**
- Structured enough to demo reliably (fixed dimensions = predictable scorecard rendering)
- Flexible enough to be impressive (AI conversation, not checkboxes)
- Completable in 3-day timeline (no multi-agent orchestration complexity)
- Extensible post-hackathon (add benchmarking, multi-user, knowledge base later)

**Framework as living system:** The framework definition lives as a configurable JSON structure, not hardcoded. Updating the framework (adding dimensions, refining levels, changing weights) requires no code changes — the AI reads the framework at runtime and adapts its questioning and scoring accordingly.

---

## 4. Maturity Framework

### Dimensions (6 Pillars)

| # | Dimension | What It Measures |
|---|-----------|-----------------|
| 1 | **Strategy & Leadership** | Digital vision clarity, executive sponsorship, transformation governance, investment commitment |
| 2 | **Technology Infrastructure** | Cloud maturity, tech debt, API-first architecture, infrastructure automation |
| 3 | **Data & AI Capabilities** | Data quality/availability, ML/AI adoption, data governance, analytics maturity |
| 4 | **Culture & Talent** | Digital literacy, change readiness, innovation culture, talent acquisition strategy |
| 5 | **Operations & Processes** | Process digitization, automation level, agility of delivery, DevOps maturity |
| 6 | **Customer Experience** | Digital channel maturity, personalization, journey orchestration, feedback loops |

### Maturity Levels (5 Levels per Dimension)

| Level | Name | Description |
|-------|------|-------------|
| 1 | **Ad Hoc** | No formal capability. Reactive, inconsistent, personality-dependent |
| 2 | **Emerging** | Initial efforts underway. Fragmented, not standardized |
| 3 | **Defined** | Standardized processes exist. Measured but not optimized |
| 4 | **Advanced** | Data-driven and automated. Proactive, optimized |
| 5 | **Leading** | Industry-leading, innovative. Sets the benchmark for others |

### Framework Configuration

The framework is defined as a JSON configuration containing:
- Dimensions with assessment criteria and level descriptors
- Scoring weights per dimension (default: equal weights)
- Evidence thresholds (minimum signals per dimension for confidence)
- Version identifier for tracking framework evolution

**Example dimension config:**

```json
{
  "id": "technology",
  "name": "Technology Infrastructure",
  "weight": 1.0,
  "criteria": [
    {
      "id": "cloud_maturity",
      "name": "Cloud Maturity",
      "levels": {
        "1": "No cloud adoption; all on-premises infrastructure",
        "2": "Initial cloud experiments; <25% workloads migrated",
        "3": "Structured cloud migration; 25-60% workloads on cloud",
        "4": "Cloud-first strategy; 60-90% workloads on cloud, multi-cloud consideration",
        "5": "Cloud-native architecture; multi-cloud orchestration, infrastructure as code throughout"
      }
    }
  ]
}
```

### Framework Versioning & Evolution

- Framework configs are versioned (e.g., `v1.0`, `v1.1`)
- New versions can add dimensions, refine level descriptors, or adjust weights
- The AI loads the active framework version at assessment start
- Historical assessments reference the framework version used, enabling cross-version comparison
- Future: admin UI for framework management; community-contributed frameworks

---

## 5. Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Frontend                       │
│  ┌──────────────┐    ┌──────────────────────┐           │
│  │  Chat Panel   │    │  Scorecard Dashboard │           │
│  │  (Conversation│    │  - Radar chart       │           │
│  │   with AI)    │    │  - Dimension bars    │           │
│  │  + Browser    │    │  - Level indicators  │           │
│  │    TTS/STT    │    │  - Evidence links    │           │
│  └──────┬───────┘    └──────────▲───────────┘           │
│         │                       │                       │
│         └───────────┬───────────┘                       │
│                     │                                   │
│              ┌──────▼──────┐                            │
│              │  API Routes  │                            │
│              │  /api/chat   │                            │
│              │  /api/assess │                            │
│              │  /api/upload │                            │
│              └──────┬──────┘                            │
└─────────────────────┼───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──┐  ┌───────▼──┐  ┌──────▼─────┐
│  Web     │  │  Voice   │  │ Assessment │
│  Client  │  │  Device  │  │ Engine     │
│  (HTTP)  │  │  (MCP)   │  │            │
└──────────┘  └──────────┘  │ ┌────────┐ │
                            │ │Framework│ │
                            │ │Config   │ │
                            │ └────┬───┘ │
                            │      │     │
                            │ ┌────▼───┐ │
                            │ │LLM     │ │
                            │ │Chain   │ │
                            │ │(Claude)│ │
                            │ └────────┘ │
                            │            │
                            │ ┌────────┐ │
                            │ │Document│ │
                            │ │Processor│ │
                            │ └────────┘ │
                            └────────────┘
```

### Multi-Interface Layer

Both the web browser and the voice device are standalone conversation interfaces connecting to the same backend:

- **Web browser**: Chat UI + Web Speech API for STT/TTS, displays scorecard visually
- **Voice device**: Listens, talks back, calls MCP tools — independently functional

The device's MCP client calls assessment tools directly. Both interfaces contribute to the same organization's assessment via the shared backend.

**Hackathon scope note:** For the hackathon, the deliverable is the MCP tool definitions and server implementation. The voice device's own STT/TTS pipeline and client-side integration is the device owner's responsibility.

### MCP Tools (for Voice Device)

| Tool | Description |
|------|-------------|
| `start_assessment` | Initialize a new org assessment session |
| `chat` | Send a message and receive AI response + assessment update |
| `get_scorecard` | Retrieve current dimension scores and evidence |
| `generate_roadmap` | Trigger roadmap generation from current assessment |
| `upload_document` | Submit a document for AI extraction |

---

## 6. UI/UX Design

### Visual Style

Dark-mode, neon-gradient aesthetic matching [aabw.genaifund.ai](https://aabw.genaifund.ai/):
- Deep black/near-black backgrounds
- Electric blue/violet/pink gradient accents
- Oversized bold headline typography
- Card-based layouts
- Stat blocks with large numbers
- High-contrast white text
- Glowing, holographic quality

Component library: shadcn/ui with custom dark theme + gradient accents.

### Screen 1: Landing / Start Assessment

Two entry points: "Start Chat Assessment" and "Upload Docs First." Plus a "Load demo company" fallback link.

Key elements:
- Hero section with product tagline
- Two large CTA cards (chat vs. upload)
- Demo data link for fallback
- Dark background with gradient accents

### Screen 2: Assessment In Progress (Hero Screen)

Split-view layout:
- **Left panel**: Conversational chat with AI consultant. Text input + optional voice (browser TTS/STT). Attach document button.
- **Right panel**: Live scorecard building in real-time. Radar chart (6 axes) filling as conversation progresses. Dimension bars with scores. Evidence count. Overall score indicator.
- **Bottom bar**: Signals collected count, documents loaded count.

The scorecard updates progressively — dimensions fill in as the AI gathers evidence from conversation and documents. The visual "growth" of the scorecard IS the demo magic.

### Screen 3: Final Report & Roadmap

Tab-based layout: Overview, Deep Dive, Roadmap, Export.

- **Overview**: Overall maturity score, industry average comparison (AI-estimated from LLM knowledge, not real benchmark data — for hackathon scope), critical gaps highlighted
- **Deep Dive**: Per-dimension breakdown with evidence, scores, and gap analysis
- **Roadmap**: 3-phase transformation plan (0-3mo, 3-6mo, 6-12mo) with specific recommendations
- **Export**: PDF download, share link

### Key UX Principles

1. **Progressive disclosure** — Scorecard starts empty, fills as conversation progresses
2. **Evidence traceability** — Every score links back to conversation evidence
3. **One-click demo** — "Load demo company" pre-fills everything as fallback
4. **Export for credibility** — PDF export makes it feel like a real consulting deliverable

---

## 7. LLM/AI System Design

### LLM Chain Architecture

```
Conversation Input (text from chat or voice device)
       ↓
System Prompt (role: Digital Transformation Consultant,
               framework config loaded as context,
               structured output format specified)
       ↓
Context Accumulator (conversation history +
                     extracted doc signals +
                     current scores +
                     evidence collected)
       ↓
Claude API Call → Returns TWO things:
  1. Conversational response (text, streamed)
  2. Structured assessment update (JSON)
       ↓
     ┌─────┴─────┐
     ↓           ↓
  Chat UI    Scorecard UI
  (stream)   (real-time update)
```

### Structured Output Format

Every LLM response includes both a conversational message and a structured assessment delta:

```json
{
  "message": "That's solid progress on cloud migration. The 60% AWS adoption puts you at Level 3 for Technology Infrastructure. How are you handling the hybrid complexity with legacy systems?",
  "assessment": {
    "dimensions": {
      "technology": {
        "score": 3.0,
        "evidence": ["60% AWS migration complete", "Legacy systems remain"],
        "confidence": 0.7,
        "gaps": ["Hybrid complexity management", "Legacy system modernization"]
      }
    },
    "signals_collected": 4,
    "dimensions_assessed": 2,
    "dimensions_remaining": 4,
    "next_focus": "Data & AI capabilities"
  }
}
```

### Assessment Completion Detection

The AI tracks:
- Dimensions touched (target: all 6)
- Confidence level per dimension (target: ≥0.7)
- Signals collected per dimension (target: ≥3 evidence items)

When all dimensions reach sufficient confidence, the AI signals assessment complete and triggers roadmap generation.

### Document Processing Flow

```
Upload (PDF/DOCX/PPTX)
       ↓
Text extraction (pdf-parse / mammoth)
       ↓
LLM summarization → extract relevant signals
       ↓
Map signals to framework dimensions
       ↓
Pre-populate assessment with document insights
       ↓
AI starts conversation already informed
```

When documents are uploaded, the AI pre-fills relevant dimension scores and then starts the conversation by referencing document insights: "I've reviewed your strategy deck and noticed you're investing heavily in cloud. Let me ask about your data capabilities..."

### Roadmap Generation

Separate LLM call once assessment is complete:
- **Prioritization**: Lowest-scoring dimensions with highest dependency impact addressed first
- **Phase structure**: 3 phases (0-3mo, 3-6mo, 6-12mo)
- **Action items**: Specific, actionable recommendations per dimension
- **Investment indicators**: Low/Medium/High effort estimates

### Voice Integration

- **Browser**: Web Speech API for STT + TTS — no external services needed
- **Voice Device**: Calls MCP tools directly; handles own STT/TTS pipeline
- Both interfaces share the same session state and contribute to the same assessment

---

## 8. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14+ (App Router), React, TailwindCSS | Fast build, great DX, built-in API routes |
| Charts | Recharts or Nivo | Radar chart + bar charts for scorecard |
| UI Components | shadcn/ui | Dark mode ready, customizable |
| LLM | Claude API (Sonnet) | Fast, affordable, excellent structured output |
| Document Parsing | pdf-parse + mammoth | PDF and DOCX extraction |
| Voice (Browser) | Web Speech API | STT + TTS, no external services |
| Voice (Device) | MCP protocol | Device's own STT/TTS, calls our MCP tools |
| Deployment | Vercel | One-click deploy for demo |
| Styling | Dark mode, neon gradients (blue/violet/pink) | Matching aabw.genaifund.ai aesthetic |

---

## 9. Hackathon Scope

### BUILD (3 Days)

- ✅ Landing page with start assessment CTA
- ✅ Conversational assessment (chat UI + browser TTS)
- ✅ Real-time scorecard (radar chart + dimension bars)
- ✅ Document upload + AI extraction
- ✅ Assessment completion → roadmap generation
- ✅ Final report view with PDF export
- ✅ Demo data fallback (pre-loaded company)
- ✅ Dark mode UI with neon gradient aesthetic
- ✅ Framework config as JSON (evolvable)
- ✅ MCP tool definitions for voice device

### DEFER (Post-Hackathon)

- ⏳ User authentication / org accounts
- ⏳ Multi-user / department-level assessments
- ⏳ Industry benchmarking with real data
- ⏳ Historical progress tracking
- ⏳ Framework admin UI
- ⏳ PPT export
- ⏳ Persistent database
- ⏳ Voice device hardware integration testing

### 3-Day Implementation Plan

| Day | Focus | Deliverable |
|-----|-------|-------------|
| Day 1 | Core: Framework config + LLM chain + basic chat UI | Can chat with AI about org, get structured scores |
| Day 2 | Visual: Scorecard dashboard + radar chart + document upload | Full assessment flow working end-to-end |
| Day 3 | Polish: Roadmap generation + report view + dark mode styling + demo data | Demo-ready product with fallback |

---

## 10. Demo Script (5 Minutes)

1. **(30s)** Show landing page — "AI Transformation Navigator"
2. **(30s)** Click "Load demo company" OR start fresh conversation
3. **(2min)** Conversational assessment — watch scorecard build in real-time
4. **(30s)** Upload a strategy doc — AI extracts insights, fills gaps
5. **(1min)** Assessment complete — show final scorecard + radar chart
6. **(30s)** Generated roadmap — 3 phases with specific recommendations
7. **(30s)** Export to PDF — "This is what the CIO gets tomorrow"

---

## 11. Hackathon Viability Assessment

| Factor | Rating | Why |
|--------|--------|-----|
| Problem relevance | ⭐⭐⭐⭐⭐ | Every enterprise leader faces this. Immediately relatable. |
| Innovation | ⭐⭐⭐⭐ | Conversational assessment + live scorecard is genuinely new. |
| Demo impact | ⭐⭐⭐⭐⭐ | Visual scorecard building from conversation is a "wow" moment. |
| Technical depth | ⭐⭐⭐⭐ | LLM structured output, document extraction, real-time updates, MCP integration. |
| Completeness risk | ⭐⭐⭐ | 3 days is tight. Demo data fallback mitigates this. |
| Differentiation | ⭐⭐⭐⭐⭐ | No one else will have conversational maturity assessment + live visual scoring + voice device integration. |

**Verdict: Yes, this is worth building.** The conversational assessment + live scorecard is a genuine innovation that demos beautifully, solves a real problem, and is technically interesting enough to stand out.

---

## 12. Reusability Notes

This design documents all key decisions for future reuse:

- **Framework structure** (Section 4) is self-contained and can be adapted for any maturity assessment domain
- **LLM chain pattern** (Section 7) with structured output + progressive scoring is reusable for any assessment/evaluation product
- **Multi-interface architecture** (Section 5) with web + voice device via MCP is a reusable pattern for multi-modal AI products
- **Demo data fallback** pattern ensures reliable hackathon demos
- **Config-driven framework** approach means the same platform can serve different industries by swapping the config
