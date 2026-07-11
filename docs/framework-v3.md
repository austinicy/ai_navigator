# Framework v3 — Digital, AI, GenAI & Agentic Maturity

## Purpose

Framework v3 upgrades the assessment from a traditional digital/ML maturity model to a source-traceable enterprise evaluation that explicitly covers generative and agentic AI. Historical v1 and v2 sessions remain loadable and are never silently rescored under v3.

## Score architecture

The framework reports three related but distinct results:

1. **Digital Maturity (1–5)** — confidence-weighted aggregate of seven core dimensions.
2. **AI Readiness (0–100)** — cross-dimensional traditional and predictive AI capability.
3. **GenAI & Agentic Readiness (0–100)** — seven GenAI-specific capabilities.

The GenAI section has `includeInOverall: false`, so its score does not alter Digital Maturity. This avoids double-counting capabilities already represented by strategy, technology, data, governance, talent, and operations.

## Core dimensions

The seven v2 dimensions remain intact for score continuity:

- Strategy & Leadership
- Technology Infrastructure
- Data & AI Capabilities
- AI Governance & Ethics
- Culture & Talent
- Operations & Processes
- Customer Experience

## GenAI and agentic criteria

### 1. GenAI Value Portfolio & Product Ownership

Assesses progression from unmanaged experimentation to a governed, continuously optimized portfolio with named product owners and measurable outcomes.

### 2. Foundation Model & Platform Strategy

Assesses approved model access, provider strategy, identity, gateways, model routing, portability, quotas, reliability, and cost controls.

### 3. Knowledge, RAG & Unstructured Data Readiness

Assesses ownership, ingestion, access, metadata, lineage, freshness, retrieval quality, provenance, and enterprise grounding services.

### 4. GenAIOps, Evaluation & Observability

Assesses prompt/model/context versioning, test sets, task and safety evaluation, release gates, tracing, red-teaming, drift, latency, cost, and continuous optimization.

### 5. GenAI Security, Safety & Content Provenance

Assesses sensitive-data protection, prompt injection, harmful output, intellectual property, vendors, impact assessment, provenance, incidents, adversarial testing, and assurance.

### 6. Workforce Adoption & Human Oversight

Assesses role-based enablement, approved workflows, review responsibilities, human-AI work redesign, capability pathways, workforce planning, trust, and employee experience.

### 7. Agentic Autonomy, Identity & Tool Controls

Assesses scoped agent identity, least privilege, tool access, memory, approval gates, action limits, tracing, kill switches, behavioral monitoring, recovery, and risk-adjusted autonomy.

## Maturity scale

Every criterion uses the existing five-level scale:

1. **Ad Hoc** — unmanaged, individual, or absent.
2. **Emerging** — isolated pilots and partial controls.
3. **Defined** — repeatable organization-level standards and ownership.
4. **Advanced** — scaled platforms, automation, monitoring, and assurance.
5. **Leading** — continuously optimized, adaptive, and outcome-driven.

Level 3 is the default recommended target for most GenAI capabilities. Agentic controls use Level 2 as the initial target because many organizations should deliberately constrain autonomy until foundational evaluation and security controls mature. `targetLevel` is a recommended capability target, not an empirical industry benchmark.

## Evidence and confidence

GenAI criteria reuse the existing evidence engine. Scores only contribute when criterion confidence is non-zero. Conversation evidence defaults to lower strength than document evidence. Section confidence combines criterion coverage and evidence strength/volume; a section is complete at the configured 0.70 threshold.

Examples of strong GenAI evidence include approved policies, architecture standards, evaluation reports, model/vendor inventories, prompt or retrieval version history, monitoring dashboards, red-team findings, incident records, access-control definitions, training completion, adoption analytics, and realized-value measures.

## Dependency model

GenAI capability is sequenced against existing foundations. Examples:

- governed strategy and portfolio ownership precede enterprise scaling;
- cloud, APIs, and platform engineering precede a managed model platform;
- data quality and governance precede enterprise RAG;
- MLOps and DevOps precede mature GenAIOps;
- AI risk and compliance precede advanced GenAI assurance;
- literacy and change readiness precede scaled human-AI work redesign;
- evaluation, security, and API controls precede agent autonomy.

## Provenance

`src/lib/framework/v3.ts` contains a structured source ledger. Every source records an id, publisher, exact title, direct URL, source type, publication date when available, and scope. GenAI criteria reference source ids directly.

The ledger prioritizes:

- normative standards: ISO/IEC 42001 and 42005;
- public risk frameworks: NIST AI RMF/GenAI Profile, IMDA AI Verify, OWASP;
- operational architecture: AWS and Microsoft;
- adoption maturity: Microsoft and Google Cloud;
- strategic digital research: MIT CISR and McKinsey Digital Quotient.

Regulations should be implemented as jurisdiction overlays rather than baked into universal maturity levels. The current global core is designed to accept future EU, US, Singapore, Vietnam, or sector-specific overlays.

## Compatibility

- `loadFramework("v1.0")`, `loadFramework("v2.0")`, and `loadFramework("v3.0")` remain supported.
- New assessments use v3.
- Demo scenarios seed the active v3 engine and report components load the version stored in the assessment delta.
- Digital Maturity excludes cross-cutting sections through `includeInOverall: false`.
- v2 `benchmarkTarget` remains readable; v3 introduces `targetLevel` for non-empirical goals.

## Next recommended upgrades

1. Add jurisdiction-specific regulatory overlays.
2. Replace estimated industry benchmarks with a governed benchmark dataset.
3. Add evidence requirements by criterion rather than one section-wide threshold.
4. Add source citations to individual report findings and roadmap actions.
5. Calibrate criterion and component weights with expert review and real assessment outcomes.
