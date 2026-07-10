# Assessment Engine Overhaul, Voice Mode, Agent-Guided Start & Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the maturity framework and scoring engine for mathematical rigor and explainability; add a public Methodology page; fix voice mode so it hides the text input and auto-sends transcribed speech; make the agent lead the conversation from page load; and produce a cheap, AWS-first deployment plan covering FE, BE, and a remote HTTPS MCP server.

**Architecture:** A Next.js 16 (App Router) app with a JSON-driven maturity framework (`src/lib/framework/v1.json`), a pure scoring module (`src/lib/assessment/scoring.ts`), an `AssessmentEngine` class that accumulates evidence/scores/confidence, and an agentic LLM loop (`runAgentTurn`) that drives the conversation via tool calls. The Web Speech API powers STT/TTS client-side. Deployment: Next.js FE+BE on AWS Amplify Hosting (or Vercel fallback), LLM keys in env, and a standalone HTTPS MCP server on AWS App Runner.

**Tech Stack:** Next.js 16.2.10, React 19, Tailwind v4, shadcn/ui, Recharts, Vitest, TypeScript 5, `@anthropic-ai/sdk` / `openai` (multi-provider), `@modelcontextprotocol/sdk`, Web Speech API, uuid. Deploy: AWS Amplify Hosting + AWS App Runner (fallback: Vercel + Google Cloud Run).

## Global Constraints

- **Working directory for all file paths in this plan:** `.worktrees/ai-navigator-impl/` (the Next.js app lives here, NOT the repo root).
- **AGENTS.md rule (must obey):** This is a modified Next.js — read the relevant guide in `node_modules/next/dist/docs/` before writing app-router/server-component code. Heed deprecation notices. Do not assume training-data APIs.
- **Test runner:** `npx vitest run` (config in `vitest.config.ts`, env `node`, glob `src/**/*.test.ts`). Every logic task ends green.
- **Type safety:** `strict` is on (`tsconfig.json`). No `any` in new code; prefer the existing permissive-duck-typed patterns where SDK unions are involved.
- **TDD:** Write the failing test first, watch it fail, implement, watch it pass, commit — for every task that adds/changes logic.
- **Commit style:** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). Frequent commits per task.
- **No placeholders:** Every step shows the actual code. No "TODO", "add error handling", "similar to Task N".
- **Framework backbone preserved:** The 7 dimensions and their names stay. Criteria and level descriptors may be enriched. Scoring math is rebuilt.
- **Backward compat for demo path:** `/assess?demo=true` and `/api/demo` must keep producing a 7-dimension scorecard after the engine rewrite — update `src/lib/demo/demo-data.ts` to match new types where needed.
- **Provider-agnostic LLM layer:** All LLM calls go through `src/lib/llm/client.ts` (`chat`, `complete`, normalizers). Do not call SDKs directly in new code.
- **Voice is browser-only:** Web Speech API STT/TTS. No new server-side voice deps.

---

## File Structure

**Created:**
- `src/lib/framework/v2.json` — the overhauled framework (richer criteria, benchmark targets, dependency map, weighting rationale).
- `src/lib/framework/CHANGELOG.md` — version-to-version provenance of framework changes.
- `src/lib/assessment/benchmarks.ts` — industry benchmark estimation (replaces hardcoded `3.2`).
- `src/lib/assessment/__tests__/benchmarks.test.ts` — tests for the above.
- `src/lib/assessment/__tests__/confidence.test.ts` — tests for the new confidence model.
- `src/app/methodology/page.tsx` — public explainer page (assessment matrix, scoring, references, why-it-matters).
- `src/components/methodology/DimensionMatrix.tsx` — table of dimensions → criteria → level rubric.
- `src/components/methodology/ScoringFormula.tsx` — visual explanation of the scoring math.
- `src/components/methodology/ReferenceFrameworks.tsx` — the 15+ source frameworks and what each contributed.
- `src/components/methodology/WhyItMatters.tsx` — how it drives AI-transformation success + what makes it unique.
- `src/components/assess/VoiceOverlay.tsx` — full-screen-ish voice mode UI (mic orb, transcript, no input box).
- `src/hooks/useContinuousVoice.ts` — continuous-listening STT hook with auto-send (replaces one-shot `useVoice` for voice mode).
- `infra/mcp/Dockerfile` — container image for the remote MCP server.
- `infra/mcp/start.sh` — entrypoint that selects stdio vs HTTP transport.
- `docs/deployment.md` — the deployment plan (AWS-first, GCP fallback).

**Modified:**
- `src/lib/framework/types.ts` — add `benchmarkTarget`, `dependsOn`, `weightingRationale`, version bump helpers.
- `src/lib/framework/config.ts` — default to `v2.0`, keep `v1.0` loadable; add `getActiveFrameworkVersion()`.
- `src/lib/assessment/scoring.ts` — rebuild with confidence-weighted criterion scores, evidence-strength weighting, partial-progress handling.
- `src/lib/assessment/engine.ts` — adopt new confidence model; carry `orgProfile` into the delta; add `startAssessment()` kickoff.
- `src/lib/assessment/types.ts` — extend `DimensionAssessment` (per-evidence weight/strength), extend `AssessmentDelta` (orgProfile, version, benchmark).
- `src/lib/assessment/agent.ts` — new `runAgentKickoff()`; strengthen the system prompt to drive the conversation.
- `src/lib/assessment/tools.ts` — `estimate_benchmark` returns real estimates; new `record_evidence` tool (optional).
- `src/lib/assessment/__tests__/scoring.test.ts` — rewrite for the new math.
- `src/lib/assessment/__tests__/engine.test.ts` — update confidence expectations; add kickoff test.
- `src/app/api/chat/route.ts` — support kickoff (`{ kickoff: true }` body); return `orgProfile` in response.
- `src/hooks/useChat.ts` — `startAssessment()` triggers kickoff; expose `orgProfile`.
- `src/hooks/useVoice.ts` — keep for TTS; add `stopListening` and a continuous mode.
- `src/components/assess/ChatPanel.tsx` — voice-mode toggle; render `VoiceOverlay` when on; hide `ChatInput`; auto-fire kickoff on mount.
- `src/components/assess/ChatInput.tsx` — read-only when voice mode is on (or not rendered).
- `src/components/assess/StatusBar.tsx` — show doc count + org name (fixes deferred doc-count item).
- `src/components/landing/HeroSection.tsx` — add "How the assessment works" link to `/methodology`.
- `src/components/report/OverviewTab.tsx` — use `benchmarks.ts` instead of hardcoded `3.2`.
- `src/lib/roadmap/generator.ts` — use `calculateOverallScore` (fixes I3-style deflation).
- `src/lib/demo/demo-data.ts` — align with new types/version.
- `src/mcp/server.ts` — add an HTTP transport option (Streamable HTTP) so it can be hosted remotely over HTTPS.
- `src/mcp/cli.ts` — choose transport from env (`MCP_TRANSPORT=http|stdio`).
- `.env.example` — document new env vars.

**Deleted:** (none — we keep v1.0 loadable for comparison and tests.)

---

## Phase 1 — Framework & Scoring Overhaul (Requirement 1)

### Task 1: Extend framework types for richer criteria + benchmarks + dependencies

**Files:**
- Modify: `src/lib/framework/types.ts`
- Test: `src/lib/framework/__tests__/types.test.ts` (create)

**Interfaces:**
- Produces: `CriterionConfig` gains optional `benchmarkTarget?: number` (1–5, the level a typical industry peer reaches), `dependsOn?: string[]` (other criterion ids that should be in place first). `DimensionConfig` gains optional `weightingRationale?: string`. `FrameworkConfig` gains `version: string` already present; add `versionNotes?: string`. `AIReadinessComponent` gains optional `weight?: number` (default 1).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/framework/__tests__/types.test.ts
import { describe, it, expect } from "vitest";
import { loadFramework } from "../config";

describe("framework v2 types", () => {
  it("loads v2.0 with benchmark targets on at least one criterion", () => {
    const cfg = loadFramework("v2.0");
    const hasBenchmark = cfg.dimensions.some((d) =>
      d.criteria.some((c) => c.benchmarkTarget !== undefined)
    );
    expect(hasBenchmark).toBe(true);
  });

  it("loads v2.0 with a dependency declared on at least one criterion", () => {
    const cfg = loadFramework("v2.0");
    const hasDep = cfg.dimensions.some((d) =>
      d.criteria.some((c) => c.dependsOn && c.dependsOn.length > 0)
    );
    expect(hasDep).toBe(true);
  });

  it("still loads v1.0 for backward-compat tests", () => {
    const cfg = loadFramework("v1.0");
    expect(cfg.dimensions.length).toBe(7);
  });

  it("aiReadinessComponents declare weights in v2.0", () => {
    const cfg = loadFramework("v2.0");
    expect(cfg.aiReadinessComponents.length).toBeGreaterThanOrEqual(6);
    for (const c of cfg.aiReadinessComponents) {
      expect(c.weight).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/framework/__tests__/types.test.ts`
Expected: FAIL — `loadFramework("v2.0")` throws "Framework version v2.0 not found".

- [ ] **Step 3: Extend the type definitions**

```ts
// src/lib/framework/types.ts — ADD optional fields (do not remove existing ones)
export interface CriterionConfig {
  id: string;
  name: string;
  weight: number;
  aiReadinessComponent?: string;
  levels: LevelDescriptor;
  benchmarkTarget?: number;   // 1–5: typical industry-peer level (v2+)
  dependsOn?: string[];        // other criterion ids that should precede this (v2+)
}

export interface DimensionConfig {
  id: string;
  name: string;
  weight: number;
  references: string[];
  criteria: CriterionConfig[];
  weightingRationale?: string; // why this dimension weighs what it does (v2+)
}

export interface AIReadinessComponent {
  id: string;
  name: string;
  sourceDimension: string;
  description: string;
  weight?: number; // default 1 (v2+)
}

export interface FrameworkConfig {
  version: string;
  name: string;
  description: string;
  dimensions: DimensionConfig[];
  aiReadinessComponents: AIReadinessComponent[];
  evidenceThreshold: number;
  confidenceThreshold: number;
  referenceFrameworks: Record<string, string>;
  versionNotes?: string; // what changed vs prior version (v2+)
}
```

- [ ] **Step 4: Run tests** — still failing on v2.0 load (config not registered yet); that's Task 2's job. Confirm `tsc` passes: `npx tsc --noEmit`. Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/framework/types.ts src/lib/framework/__tests__/types.test.ts
git commit -m "feat(framework): extend types for benchmarks, dependencies, weighting rationale"
```

---

### Task 2: Author the v2.0 framework JSON (enriched criteria + benchmark targets + dependency map)

**Files:**
- Create: `src/lib/framework/v2.json`
- Create: `src/lib/framework/CHANGELOG.md`
- Modify: `src/lib/framework/config.ts`

**Interfaces:**
- Consumes: the extended types from Task 1.
- Produces: `loadFramework("v2.0")` returns a populated `FrameworkConfig`. `getActiveFrameworkVersion()` returns `"v2.0"`.

**Scope decision:** Copy `v1.json` as the starting point and enrich it — do NOT rewrite the level descriptors wholesale (they are already grounded in the 15+ reference frameworks per the spec). Add `benchmarkTarget` per criterion (industry-typical level, mostly 2–4), `dependsOn` for the cross-dimension dependency edges (data before AI, cloud before data migration, governance before scaling AI), `weightingRationale` per dimension, `weight` per AI-readiness component, and `versionNotes`.

- [ ] **Step 1: Seed v2.json from v1**

```bash
cp src/lib/framework/v1.json src/lib/framework/v2.json
```

- [ ] **Step 2: Edit v2.json — set version + notes**

Change the top of `v2.json`:
```json
{
  "version": "2.0",
  "name": "AI Transformation Navigator Maturity Framework",
  "description": "A unified digital and AI maturity framework synthesizing 15+ established models, assessing organizations across 7 dimensions with 30 criteria, a cross-cutting AI Readiness sub-score, industry benchmark targets, and a cross-dimension dependency map.",
  "versionNotes": "v2.0 adds per-criterion benchmarkTarget (industry-typical level), dependsOn dependency edges, per-dimension weightingRationale, and weights on AI-readiness components. Level descriptors retained from v1.0 (grounded in the 15+ reference frameworks).",
  ...
```

- [ ] **Step 3: Add `weightingRationale` to each of the 7 dimensions**

For each dimension object, add a `weightingRationale` field. Use these exact values:

- `strategy` → `"Equal weight (1.0): without strategy & sponsorship, no other dimension sustains progress; weighted equally rather than above others to avoid double-counting its influence on AI-readiness."`
- `technology` → `"Equal weight (1.0): infrastructure is a precondition, not a value driver in itself; equal weight prevents over-rewarding tooling for its own sake."`
- `data_ai` → `"Equal weight (1.0): data & AI capability is where value compounds, but is gated by technology and governance; equal weight keeps the composite balanced."`
- `ai_governance` → `"Equal weight (1.0): governance is a risk control, not a maturity driver; equal weight reflects its role as an enabler of safe scaling."`
- `culture` → `"Equal weight (1.0): talent & culture determine whether transformation sticks; equal weight avoids penalizing orgs that are early on culture."`
- `operations` → `"Equal weight (1.0): operational maturity is the delivery engine; equal weight keeps it from dominating the score."`
- `customer` → `"Equal weight (1.0): CX is an outcome of the other dimensions; equal weight prevents outcome-inflation of the composite."`

- [ ] **Step 4: Add `benchmarkTarget` to every criterion**

Set `benchmarkTarget` on each criterion as the industry-typical level (the level a median peer reaches). Apply these values (criterion id → benchmarkTarget):

- strategy: `digital_vision` 3, `executive_sponsorship` 3, `investment_commitment` 3, `governance_structure` 2
- technology: `cloud_maturity` 3, `tech_debt_management` 2, `api_architecture` 3, `infra_automation` 3, `platform_engineering` 2
- data_ai: `data_quality` 2, `data_governance` 2, `analytics_maturity` 3, `ml_ai_adoption` 2, `mlops_maturity` 2
- ai_governance: `responsible_ai_policy` 2, `risk_management` 2, `compliance_framework` 2, `model_monitoring` 1
- culture: `digital_literacy` 2, `change_readiness` 2, `innovation_culture` 2, `ai_talent_strategy` 2
- operations: `process_digitization` 3, `automation_level` 2, `delivery_agility` 3, `devops_maturity` 3
- customer: `digital_channels` 3, `personalization` 2, `journey_orchestration` 2, `feedback_loops` 2

- [ ] **Step 5: Add `dependsOn` dependency edges**

Add `dependsOn` arrays to these criteria (expressing the dependency chain from the spec: data before AI, cloud before data migration, governance before scaling AI):

- `data_ai.data_quality` → `["technology.cloud_maturity"]`
- `data_ai.data_governance` → `["data_ai.data_quality"]`
- `data_ai.analytics_maturity` → `["data_ai.data_quality"]`
- `data_ai.ml_ai_adoption` → `["data_ai.data_governance", "data_ai.analytics_maturity"]`
- `data_ai.mlops_maturity` → `["data_ai.ml_ai_adoption", "operations.devops_maturity"]`
- `ai_governance.model_monitoring` → `["data_ai.mlops_maturity"]`
- `ai_governance.risk_management` → `["ai_governance.responsible_ai_policy"]`
- `operations.automation_level` → `["operations.process_digitization"]`
- `customer.personalization` → `["data_ai.analytics_maturity"]`
- `customer.journey_orchestration` → `["customer.digital_channels"]`

- [ ] **Step 6: Add `weight` to each AI-readiness component**

In the `aiReadinessComponents` array, add `"weight"` to each:
- `ai_strategy` → 1.5 (strategy is the leading indicator)
- `data_readiness` → 1.5
- `infrastructure_readiness` → 1.0
- `talent_readiness` → 1.0
- `governance_readiness` → 1.0
- `operational_readiness` → 1.0

- [ ] **Step 7: Register v2.0 in config.ts and make it the default**

```ts
// src/lib/framework/config.ts
import { FrameworkConfig } from "./types";
import v1 from "./v1.json";
import v2 from "./v2.json";

const configs: Record<string, FrameworkConfig> = {
  "v1.0": v1 as FrameworkConfig,
  "v2.0": v2 as FrameworkConfig,
};

export function loadFramework(version: string = "v2.0"): FrameworkConfig {
  const config = configs[version];
  if (!config) throw new Error(`Framework version ${version} not found`);
  return config;
}

export function getActiveFrameworkVersion(): string {
  return "v2.0";
}
```

- [ ] **Step 8: Create CHANGELOG.md**

```markdown
# Framework Changelog

## v2.0 (2026-07-11)
- Added `benchmarkTarget` to every criterion (industry-typical level, 1–5).
- Added `dependsOn` dependency edges for 10 cross-dimension criteria
  (data→AI→MLOps→governance, cloud→data, process→automation, etc.).
- Added `weightingRationale` to all 7 dimensions (documents the equal-weight decision).
- Added `weight` to all 6 AI-readiness components (strategy + data weighted 1.5×).
- Level descriptors retained from v1.0 (grounded in the 15+ reference frameworks
  documented in the design spec, Section 4).

## v1.0 (2026-07-09)
- Initial framework: 7 dimensions, 30 criteria, 5 levels, AI-readiness composite.
```

- [ ] **Step 9: Run the Task 1 test**

Run: `npx vitest run src/lib/framework/__tests__/types.test.ts`
Expected: PASS (all 4 cases).

- [ ] **Step 10: Verify the full existing suite still compiles + passes against v1.0 where it pins v1.0**

Run: `npx vitest run`
Expected: existing scoring/engine tests pass (they call `loadFramework()` with no arg — now defaults to v2.0; if any assert v1.0-specific shape, update in Task 4). Note any failures for Task 4.

- [ ] **Step 11: Commit**

```bash
git add src/lib/framework/v2.json src/lib/framework/CHANGELOG.md src/lib/framework/config.ts
git commit -m "feat(framework): add v2.0 with benchmark targets, dependency map, weighting rationale"
```

---

### Task 3: Rebuild the scoring module with confidence-weighted, evidence-aware math

**Files:**
- Modify: `src/lib/assessment/scoring.ts`
- Test: `src/lib/assessment/__tests__/scoring.test.ts` (rewrite)

**Interfaces:**
- Consumes: `FrameworkConfig` (v2.0), `DimensionAssessment` with per-evidence `weight`/`strength`.
- Produces: `calculateDimensionScore`, `calculateOverallScore`, `calculateAIReadinessScore`, `getDimensionLevel`, plus a new `calculateBenchmarkDelta(score, benchmarkTarget)` and `checkDependencyGaps(dimensions, config)`.

**Design — the new scoring math (this is the core of "recreate the assessment engine"):**

1. **Criterion score** stays the LLM-assigned 1–5 level.
2. **Dimension score** = confidence-weighted average of criterion scores. Instead of a flat weighted average, each criterion's contribution is multiplied by its **criterion confidence** (how much evidence backs *that* criterion). Criteria with no evidence contribute 0 weight, so a partially-probed dimension reflects only what was actually assessed.
3. **Criterion confidence** = `min(1, evidenceForCriterion / criterionEvidenceThreshold)` where `criterionEvidenceThreshold = max(1, round(evidenceThreshold))`. Evidence items carry a `strength` (0–1, default 0.5 for conversation, higher for documents) and a `weight` (default 1). Criterion confidence = `min(1, sum(strength × weight) / criterionEvidenceThreshold)`.
4. **Dimension confidence** = `(criteriaCoverageFactor × 0.6) + (evidenceVolumeFactor × 0.4)` — criteria coverage weighted more heavily than raw evidence count (matches "we are more sure when more criteria are probed"). This replaces the old 50/50 split.
5. **Overall Digital Maturity Score** = weighted average of *assessed* dimensions only (confidence ≥ threshold), dividing by assessed-dimension weights (preserves the v1 fix). Round to 1 decimal.
6. **AI Readiness Score (0–100)** = weighted average of components using the new `weight` field; each component is the confidence-weighted criterion average normalized 1–5 → 0–100. Unassessed components are excluded (not counted as 0).
7. **Benchmark delta** = `score − benchmarkTarget` per criterion and per dimension; surfaces where the org leads/lags its peers.
8. **Dependency gaps** = criteria whose `dependsOn` prerequisites are not yet at a sufficient level (≥3), so the roadmap can sequence correctly.

- [ ] **Step 1: Write the failing test (rewrite scoring.test.ts)**

```ts
// src/lib/assessment/__tests__/scoring.test.ts
import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import {
  calculateDimensionScore,
  calculateOverallScore,
  calculateAIReadinessScore,
  getDimensionLevel,
  calculateBenchmarkDelta,
  checkDependencyGaps,
} from "../scoring";
import type { DimensionAssessment, Evidence } from "../types";

const config = loadFramework("v2.0");

function makeDim(dimensionId: string, overrides: Partial<DimensionAssessment> = {}): DimensionAssessment {
  return {
    dimensionId,
    score: 0,
    confidence: 0,
    evidence: [],
    gaps: [],
    criterionScores: {},
    criterionConfidence: {},
    ...overrides,
  };
}
function ev(dim: string, crit: string, strength = 0.5): Evidence {
  return { id: "e", text: "t", source: "conversation", dimensionId: dim, criterionId: crit, timestamp: 1, strength, weight: 1 };
}

describe("calculateDimensionScore (confidence-weighted)", () => {
  it("returns 0 when no criteria are scored", () => {
    expect(calculateDimensionScore(makeDim("strategy"), config)).toBe(0);
  });

  it("weights each criterion by its criterion-confidence (unscored criteria contribute 0)", () => {
    // strategy has 4 criteria. Score all 4 at 4 with full confidence (3 evidence each).
    const dim = makeDim("strategy", {
      criterionScores: { digital_vision: 4, executive_sponsorship: 4, investment_commitment: 4, governance_structure: 4 },
      criterionConfidence: { digital_vision: 1, executive_sponsorship: 1, investment_commitment: 1, governance_structure: 1 },
    });
    expect(calculateDimensionScore(dim, config)).toBeCloseTo(4, 10);
  });

  it("down-weights a criterion with partial evidence vs one with full evidence", () => {
    // cloud_maturity=5 (full conf 1), tech_debt_management=1 (conf 0.33).
    // confidence-weighted: (5*1*1 + 1*1*0.33) / (1*1 + 1*0.33) = (5 + 0.33)/1.33 = ~4.01
    const dim = makeDim("technology", {
      criterionScores: { cloud_maturity: 5, tech_debt_management: 1 },
      criterionConfidence: { cloud_maturity: 1, tech_debt_management: 0.33 },
    });
    const score = calculateDimensionScore(dim, config);
    expect(score).toBeGreaterThan(3.9);
    expect(score).toBeLessThan(4.1);
  });
});

describe("calculateOverallScore", () => {
  it("divides by assessed-dimension weights only", () => {
    const dims = {
      strategy: makeDim("strategy", { confidence: 0.9, score: 4 }),
      technology: makeDim("technology", { confidence: 0.8, score: 2 }),
      data_ai: makeDim("data_ai", { confidence: 0.1, score: 5 }),
    };
    expect(calculateOverallScore(dims, config)).toBeCloseTo(3, 10);
  });
  it("returns 0 when nothing meets the threshold", () => {
    expect(calculateOverallScore({}, config)).toBe(0);
  });
});

describe("calculateAIReadinessScore (component-weighted)", () => {
  it("weights ai_strategy (1.5) and data_readiness (1.5) heavier than infra (1.0)", () => {
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    // ai_strategy all 5 → 100; infrastructure_readiness all 5 → 100
    dims.strategy.criterionScores = { digital_vision: 5, executive_sponsorship: 5, investment_commitment: 5, governance_structure: 5 };
    dims.strategy.criterionConfidence = { digital_vision: 1, executive_sponsorship: 1, investment_commitment: 1, governance_structure: 1 };
    dims.technology.criterionScores = { cloud_maturity: 5, tech_debt_management: 5, api_architecture: 5, infra_automation: 5, platform_engineering: 5 };
    dims.technology.criterionConfidence = { cloud_maturity: 1, tech_debt_management: 1, api_architecture: 1, infra_automation: 1, platform_engineering: 1 };
    const r = calculateAIReadinessScore(dims, config);
    expect(r.components.ai_strategy).toBe(100);
    expect(r.components.infrastructure_readiness).toBe(100);
    // both 100 → weighted avg still 100
    expect(r.score).toBe(100);
  });
});

describe("getDimensionLevel", () => {
  it("maps 1→Ad Hoc, 5→Leading, clamps out of range", () => {
    expect(getDimensionLevel(1).name).toBe("Ad Hoc");
    expect(getDimensionLevel(5).name).toBe("Leading");
    expect(getDimensionLevel(0).level).toBe(1);
    expect(getDimensionLevel(9).level).toBe(5);
  });
});

describe("calculateBenchmarkDelta", () => {
  it("returns the signed difference from the criterion benchmark target", () => {
    // digital_vision benchmarkTarget = 3
    const delta = calculateBenchmarkDelta(4, 3);
    expect(delta).toBe(1);
  });
  it("returns 0 when no benchmark target is defined", () => {
    expect(calculateBenchmarkDelta(3, undefined)).toBe(0);
  });
});

describe("checkDependencyGaps", () => {
  it("flags a criterion whose dependency is below level 3", () => {
    // ml_ai_adoption depends on data_governance + analytics_maturity.
    // Set data_governance low → ml_ai_adoption should appear as a dependency gap.
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    dims.data_ai.criterionScores = { data_governance: 1, analytics_maturity: 4, ml_ai_adoption: 4 };
    const gaps = checkDependencyGaps(dims, config);
    const ids = gaps.map((g) => g.criterionId);
    expect(ids).toContain("ml_ai_adoption");
  });
  it("does not flag when dependencies are met", () => {
    const dims: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) dims[d.id] = makeDim(d.id);
    dims.data_ai.criterionScores = { data_governance: 4, analytics_maturity: 4, ml_ai_adoption: 4 };
    const gaps = checkDependencyGaps(dims, config);
    expect(gaps.map((g) => g.criterionId)).not.toContain("ml_ai_adoption");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/__tests__/scoring.test.ts`
Expected: FAIL — `criterionConfidence` not on the type, `calculateBenchmarkDelta`/`checkDependencyGaps` not exported.

- [ ] **Step 3: Implement the rebuilt scoring module**

```ts
// src/lib/assessment/scoring.ts
import { FrameworkConfig } from "../framework/types";
import { DimensionAssessment, AIReadinessBreakdown } from "./types";

/**
 * Confidence-weighted dimension score.
 * Each criterion contributes score × weight × criterionConfidence; we divide by
 * the sum of (weight × criterionConfidence) over SCORED criteria. Unscored or
 * zero-confidence criteria contribute nothing, so a partially-probed dimension
 * reflects only what was actually assessed.
 */
export function calculateDimensionScore(
  dimension: DimensionAssessment,
  config: FrameworkConfig
): number {
  const dimConfig = config.dimensions.find((d) => d.id === dimension.dimensionId);
  if (!dimConfig) return 0;

  let numerator = 0;
  let denominator = 0;
  for (const [criterionId, score] of Object.entries(dimension.criterionScores)) {
    const criterion = dimConfig.criteria.find((c) => c.id === criterionId);
    if (!criterion) continue;
    const conf = dimension.criterionConfidence?.[criterionId] ?? 0;
    if (conf <= 0) continue;
    numerator += score * criterion.weight * conf;
    denominator += criterion.weight * conf;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

export function calculateOverallScore(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): number {
  const assessed = Object.values(dimensions).filter(
    (d) => d.confidence >= config.confidenceThreshold
  );
  if (assessed.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (const dimAssessment of assessed) {
    const dimConfig = config.dimensions.find((d) => d.id === dimAssessment.dimensionId);
    const weight = dimConfig?.weight ?? 1;
    num += dimAssessment.score * weight;
    den += weight;
  }
  return den > 0 ? num / den : 0;
}

/**
 * Component-weighted AI Readiness score (0–100). Each component is the
 * confidence-weighted criterion average, normalized 1–5 → 0–100. Components
 * with no scored criteria are excluded (null), not counted as 0.
 */
export function calculateAIReadinessScore(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): AIReadinessBreakdown {
  const components: Record<string, number | null> = {};

  for (const comp of config.aiReadinessComponents) {
    const relevant = config.dimensions.flatMap((d) =>
      d.criteria
        .filter((c) => c.aiReadinessComponent === comp.id)
        .map((c) => ({ dimensionId: d.id, criterionId: c.id, weight: c.weight }))
    );
    if (relevant.length === 0) {
      components[comp.id] = null;
      continue;
    }
    let num = 0;
    let den = 0;
    let any = false;
    for (const rc of relevant) {
      const dim = dimensions[rc.dimensionId];
      const score = dim?.criterionScores?.[rc.criterionId];
      const conf = dim?.criterionConfidence?.[rc.criterionId] ?? 0;
      if (score === undefined || conf <= 0) continue;
      num += score * rc.weight * conf;
      den += rc.weight * conf;
      any = true;
    }
    components[comp.id] = any && den > 0 ? (num / den / 5) * 100 : null;
  }

  // Weighted average over scored components using component.weight (default 1).
  let num = 0;
  let den = 0;
  for (const comp of config.aiReadinessComponents) {
    const v = components[comp.id];
    if (v === null || v === undefined) continue;
    const w = comp.weight ?? 1;
    num += v * w;
    den += w;
  }
  const score = den > 0 ? num / den : 0;
  return { score: Math.round(score), components };
}

export function getDimensionLevel(score: number): { level: number; name: string } {
  const levels = [
    { level: 1, name: "Ad Hoc" },
    { level: 2, name: "Emerging" },
    { level: 3, name: "Defined" },
    { level: 4, name: "Advanced" },
    { level: 5, name: "Leading" },
  ];
  const idx = Math.max(1, Math.min(5, Math.round(score)));
  return levels[idx - 1];
}

/** Signed difference between a score and its benchmark target (0 if no target). */
export function calculateBenchmarkDelta(score: number, benchmarkTarget: number | undefined): number {
  if (benchmarkTarget === undefined) return 0;
  return Math.round((score - benchmarkTarget) * 10) / 10;
}

export interface DependencyGap {
  dimensionId: string;
  criterionId: string;
  unmetDependencies: string[];
}

/**
 * Find criteria whose declared dependencies are not yet at level ≥ 3.
 * Used by roadmap generation to sequence actions (don't scale AI before data
 * foundations are solid).
 */
export function checkDependencyGaps(
  dimensions: Record<string, DimensionAssessment>,
  config: FrameworkConfig
): DependencyGap[] {
  const gaps: DependencyGap[] = [];
  for (const dim of config.dimensions) {
    const dimAssessment = dimensions[dim.id];
    for (const criterion of dim.criteria) {
      if (!criterion.dependsOn || criterion.dependsOn.length === 0) continue;
      // Only consider criteria the org is actually attempting (has a score).
      if (dimAssessment?.criterionScores?.[criterion.id] === undefined) continue;
      const unmet: string[] = [];
      for (const depId of criterion.dependsOn) {
        const [depDimId, depCritId] = depId.split(".");
        const depScore = dimensions[depDimId]?.criterionScores?.[depCritId];
        if (depScore === undefined || depScore < 3) unmet.push(depId);
      }
      if (unmet.length > 0) {
        gaps.push({ dimensionId: dim.id, criterionId: criterion.id, unmetDependencies: unmet });
      }
    }
  }
  return gaps;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/assessment/__tests__/scoring.test.ts`
Expected: PASS (all cases). If the `criterionConfidence` field errors on the type, that's Task 4 — but the test will still compile if Task 4's type addition lands first. **Order dependency:** do Task 4 Step 1 (type addition) before running this test, OR add `criterionConfidence?: Record<string, number>` to `DimensionAssessment` now. Implement Task 4's type additions before this step's verification.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment/scoring.ts src/lib/assessment/__tests__/scoring.test.ts
git commit -m "feat(scoring): rebuild with confidence-weighted criteria, benchmarks, dependency gaps"
```

---

### Task 4: Extend assessment types + rebuild the engine confidence model

**Files:**
- Modify: `src/lib/assessment/types.ts`
- Modify: `src/lib/assessment/engine.ts`
- Test: `src/lib/assessment/__tests__/confidence.test.ts` (create)
- Test: `src/lib/assessment/__tests__/engine.test.ts` (update)

**Interfaces:**
- Consumes: rebuilt `scoring.ts` (Task 3), `v2.0` framework (Task 2).
- Produces: `DimensionAssessment.criterionConfidence`, `Evidence.strength`/`Evidence.weight`, `AssessmentDelta.orgProfile`, `AssessmentDelta.frameworkVersion`, `AssessmentDelta.benchmark`. Engine methods `addEvidence`, `updateDimensionScore`, `getDelta`, plus a new `startAssessment()` used by Task 8.

- [ ] **Step 1: Extend types.ts**

Add fields to `Evidence` and `DimensionAssessment`; extend `AssessmentDelta` with org profile, version, and benchmark summary. Full updated interfaces:

```ts
// src/lib/assessment/types.ts  — ADD these fields to existing interfaces
export interface Evidence {
  id: string;
  text: string;
  source: "conversation" | "document";
  dimensionId: string;
  criterionId?: string;
  timestamp: number;
  strength?: number; // 0–1, default 0.5 (conversation) / 0.8 (document)
  weight?: number;   // default 1; multiplier on strength
}

export interface DimensionAssessment {
  dimensionId: string;
  score: number;
  confidence: number;
  evidence: Evidence[];
  gaps: string[];
  criterionScores: Record<string, number>;
  criterionConfidence: Record<string, number>; // NEW: per-criterion 0–1
}

export interface AssessmentDelta {
  dimensions: Record<string, DimensionAssessment>;
  aiReadiness: AIReadinessBreakdown;
  signalsCollected: number;
  dimensionsAssessed: number;
  dimensionsRemaining: number;
  nextFocus: string;
  orgProfile: OrgProfile;           // NEW
  frameworkVersion: string;         // NEW
  benchmark: { overall: number | null; byDimension: Record<string, number | null> }; // NEW
}
```

Leave `OrgProfile`, `AIReadinessBreakdown`, `AgentResponse`, `ToolCallResult`, `ChatMessage`, `AssessmentSession`, `UploadedDocument`, `normalizeOrgProfile` as-is (they already exist). `AssessmentSession` already has `conversationHistory`, `orgProfile`, `frameworkVersion`.

- [ ] **Step 2: Write the failing confidence test**

```ts
// src/lib/assessment/__tests__/confidence.test.ts
import { describe, it, expect } from "vitest";
import { AssessmentEngine } from "../engine";
import { loadFramework } from "../../framework/config";

const config = loadFramework("v2.0");
const evidenceInput = (dimensionId: string, criterionId?: string, strength = 0.5) => ({
  text: "e", source: "conversation" as const, dimensionId, criterionId, strength,
});

describe("criterion confidence model", () => {
  it("grows criterion confidence as evidence accumulates for that criterion", () => {
    const engine = new AssessmentEngine();
    // digital_vision needs 3 strength-units to hit confidence 1 (threshold rounds to 3).
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 0.5));
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 0.5));
    engine.updateDimensionScore("strategy", { digital_vision: 3 }, []);
    const dim = engine.getSession().dimensions.strategy;
    // 2 × 0.5 = 1.0 strength-units / 3 threshold = ~0.33
    expect(dim.criterionConfidence.digital_vision).toBeCloseTo(1 / 3, 1);
  });

  it("caps criterion confidence at 1", () => {
    const engine = new AssessmentEngine();
    for (let i = 0; i < 6; i++) engine.addEvidence(evidenceInput("strategy", "digital_vision", 1.0));
    engine.updateDimensionScore("strategy", { digital_vision: 5 }, []);
    expect(engine.getSession().dimensions.strategy.criterionConfidence.digital_vision).toBe(1);
  });

  it("document evidence contributes more strength than conversation evidence", () => {
    const engine = new AssessmentEngine();
    engine.addEvidence({ text: "doc", source: "document", dimensionId: "strategy", criterionId: "digital_vision", strength: 0.8 });
    engine.updateDimensionScore("strategy", { digital_vision: 4 }, []);
    const conf = engine.getSession().dimensions.strategy.criterionConfidence.digital_vision;
    // 0.8 / 3 = ~0.27
    expect(conf).toBeGreaterThan(0.25);
    expect(conf).toBeLessThan(0.3);
  });

  it("dimension confidence weights criteria coverage 0.6 and evidence volume 0.4", () => {
    const engine = new AssessmentEngine();
    // 2 of 4 criteria scored, each with full confidence → coverage 0.5
    // 6 evidence across the dim with strength 0.5 → 3.0 units / (4 criteria × 3 threshold) → volume factor ~0.25 (capped)
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 1));
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 1));
    engine.addEvidence(evidenceInput("strategy", "digital_vision", 1));
    engine.addEvidence(evidenceInput("strategy", "executive_sponsorship", 1));
    engine.addEvidence(evidenceInput("strategy", "executive_sponsorship", 1));
    engine.addEvidence(evidenceInput("strategy", "executive_sponsorship", 1));
    engine.updateDimensionScore("strategy", { digital_vision: 4, executive_sponsorship: 4 }, []);
    const conf = engine.getSession().dimensions.strategy.confidence;
    // coverage 0.5 × 0.6 + volume 0.25 × 0.4 = 0.3 + 0.1 = 0.4
    expect(conf).toBeCloseTo(0.4, 1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/__tests__/confidence.test.ts`
Expected: FAIL — `criterionConfidence` not populated; old confidence math still in place.

- [ ] **Step 4: Rebuild engine.ts**

Replace `calculateDimConfidence` with the coverage/volume model, add `calculateCriterionConfidence`, populate `criterionConfidence` on `updateDimensionScore`, carry `orgProfile`/`frameworkVersion`/`benchmark` in `getDelta`, and add `startAssessment()`. Full updated engine (showing the changed/added members — keep the rest of the existing class body unchanged unless noted):

```ts
// src/lib/assessment/engine.ts  — REPLACE the private confidence methods and getDelta; ADD startAssessment

import { v4 as uuidv4 } from "uuid";
import { loadFramework, getDimensionById } from "../framework/config";
import { FrameworkConfig } from "../framework/types";
import { calculateAIReadinessScore, calculateDimensionScore, calculateOverallScore, calculateBenchmarkDelta } from "./scoring";
import { AssessmentSession, DimensionAssessment, Evidence, OrgProfile, AssessmentDelta, UploadedDocument } from "./types";

export class AssessmentEngine {
  private session: AssessmentSession;
  private config: FrameworkConfig;

  constructor(orgProfile?: Partial<OrgProfile>) {
    this.config = loadFramework();
    this.session = {
      id: uuidv4(),
      frameworkVersion: this.config.version,
      orgProfile: {
        name: orgProfile?.name ?? "",
        industry: orgProfile?.industry ?? "",
        size: orgProfile?.size ?? "mid-market",
        geography: orgProfile?.geography ?? "",
        regulatoryEnvironment: orgProfile?.regulatoryEnvironment ?? [],
        existingInitiatives: orgProfile?.existingInitiatives ?? [],
        constraints: orgProfile?.constraints ?? {},
      },
      dimensions: {},
      aiReadiness: { score: 0, components: {} },
      conversationHistory: [],
      documents: [],
      isComplete: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    for (const dim of this.config.dimensions) {
      this.session.dimensions[dim.id] = {
        dimensionId: dim.id,
        score: 0,
        confidence: 0,
        evidence: [],
        gaps: [],
        criterionScores: {},
        criterionConfidence: {},
      };
    }
  }

  // ... getSession(), getConfig(), addEvidence(), updateOrgProfile(), addDocument(),
  //     addConversationMessage(), markComplete(), checkComplete() — KEEP as-is,
  //     EXCEPT updateDimensionScore (below) and the private confidence methods (replaced).

  updateDimensionScore(
    dimensionId: string,
    criterionScores: Record<string, number>,
    gaps: string[]
  ): void {
    const dim = this.session.dimensions[dimensionId];
    if (!dim) return;
    dim.criterionScores = { ...dim.criterionScores, ...criterionScores };
    dim.gaps = [...new Set([...dim.gaps, ...gaps])];

    // Recompute per-criterion confidence for ALL scored criteria in this dimension.
    for (const criterionId of Object.keys(dim.criterionScores)) {
      dim.criterionConfidence[criterionId] = this.calculateCriterionConfidence(dimensionId, criterionId);
    }
    dim.score = calculateDimensionScore(dim, this.config);
    dim.confidence = this.calculateDimConfidence(dimensionId);
    this.session.aiReadiness = calculateAIReadinessScore(this.session.dimensions, this.config);
    this.session.updatedAt = Date.now();
  }

  getDelta(): AssessmentDelta {
    const dims = this.session.dimensions;
    const assessedCount = Object.values(dims).filter(
      (d) => d.confidence >= this.config.confidenceThreshold
    ).length;

    const byDimension: Record<string, number | null> = {};
    let overallBenchmarkSum = 0;
    let overallBenchmarkCount = 0;
    for (const dim of this.config.dimensions) {
      const dimAssessment = dims[dim.id];
      const targets = dim.criteria.filter((c) => c.benchmarkTarget !== undefined);
      if (targets.length === 0) { byDimension[dim.id] = null; continue; }
      const assessedTargets = targets.filter((c) => dimAssessment?.criterionScores?.[c.id] !== undefined);
      if (assessedTargets.length === 0) { byDimension[dim.id] = null; continue; }
      const sumDelta = assessedTargets.reduce((s, c) => s + calculateBenchmarkDelta(dimAssessment.criterionScores[c.id], c.benchmarkTarget), 0);
      const avg = sumDelta / assessedTargets.length;
      byDimension[dim.id] = Math.round(avg * 10) / 10;
      overallBenchmarkSum += avg;
      overallBenchmarkCount++;
    }

    return {
      dimensions: dims,
      aiReadiness: this.session.aiReadiness,
      signalsCollected: Object.values(dims).reduce((sum, d) => sum + d.evidence.length, 0),
      dimensionsAssessed: assessedCount,
      dimensionsRemaining: this.config.dimensions.length - assessedCount,
      nextFocus: this.getNextUnassessedDimension(),
      orgProfile: this.session.orgProfile,
      frameworkVersion: this.config.version,
      benchmark: {
        overall: overallBenchmarkCount > 0 ? Math.round((overallBenchmarkSum / overallBenchmarkCount) * 10) / 10 : null,
        byDimension,
      },
    };
  }

  /**
   * Kick off an agent-led assessment. Returns a seed user-message + system
   * context the agent uses to produce its opening turn WITHOUT requiring the
   * user to speak first. Called by runAgentKickoff() (Task 8).
   */
  startAssessment(): { seedMessage: string; orgProfile: OrgProfile; frameworkVersion: string } {
    return {
      seedMessage: "(Assessment start — greet the organization and ask your first targeted question about Strategy & Leadership. Do not wait for the user to speak first.)",
      orgProfile: this.session.orgProfile,
      frameworkVersion: this.config.version,
    };
  }

  private calculateCriterionConfidence(dimensionId: string, criterionId: string): number {
    const dim = this.session.dimensions[dimensionId];
    if (!dim) return 0;
    const threshold = Math.max(1, Math.round(this.config.evidenceThreshold));
    const strengthUnits = dim.evidence
      .filter((e) => e.criterionId === criterionId)
      .reduce((sum, e) => sum + (e.strength ?? 0.5) * (e.weight ?? 1), 0);
    return Math.min(1, strengthUnits / threshold);
  }

  private calculateDimConfidence(dimensionId: string): number {
    const dim = this.session.dimensions[dimensionId];
    const dimConfig = getDimensionById(this.config, dimensionId);
    if (!dim || !dimConfig) return 0;

    const scoredCount = Object.keys(dim.criterionScores).length;
    const coverageFactor = dimConfig.criteria.length > 0 ? scoredCount / dimConfig.criteria.length : 0;

    const threshold = Math.max(1, Math.round(this.config.evidenceThreshold));
    const totalPossibleStrength = dimConfig.criteria.length * threshold;
    const actualStrength = dim.evidence.reduce((sum, e) => sum + (e.strength ?? 0.5) * (e.weight ?? 1), 0);
    const volumeFactor = totalPossibleStrength > 0 ? Math.min(1, actualStrength / totalPossibleStrength) : 0;

    return coverageFactor * 0.6 + volumeFactor * 0.4;
  }

  private calculateDimScore(dimensionId: string): number {
    const dim = this.session.dimensions[dimensionId];
    return dim ? calculateDimensionScore(dim, this.config) : 0;
  }

  private getNextUnassessedDimension(): string {
    const unassessed = this.config.dimensions.filter((dim) => {
      const a = this.session.dimensions[dim.id];
      return a && a.confidence < this.config.confidenceThreshold;
    });
    return unassessed.length > 0 ? unassessed[0].id : "";
  }
}
```

Note: remove the old `calculateDimScore` body that did inline weighted-average (it now delegates to `scoring.ts`). Remove the old `calculateDimConfidence` 50/50 version. `addEvidence` already pushes evidence; ensure it also accepts `strength`/`weight` via `Omit<Evidence, "id"|"timestamp">` (it does, since the type now has them optional).

- [ ] **Step 5: Update engine.test.ts expectations for the new confidence model**

In `src/lib/assessment/__tests__/engine.test.ts`, the test "recomputes confidence from evidence count and criteria coverage" expects `0.75` under the old 50/50 model. Update it:

```ts
  it("recomputes confidence with the new 0.6/0.4 coverage+volume model", () => {
    const engine = new AssessmentEngine();
    // 3 evidence on strategy, strength 0.5 → 1.5 strength-units
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    engine.addEvidence(evidenceInput("strategy"));
    // 2 of 4 criteria scored → coverage 0.5
    engine.updateDimensionScore("strategy", { digital_vision: 3, executive_sponsorship: 3 }, []);
    const dim = engine.getSession().dimensions.strategy;
    // coverage 0.5 × 0.6 = 0.3; volume = 1.5 / (4×3=12) = 0.125 × 0.4 = 0.05 → 0.35
    expect(dim.confidence).toBeCloseTo(0.35, 1);
  });
```

Also update the `evidenceInput` helper in engine.test.ts to include `strength: 0.5` (the type now has it optional, so existing calls still compile, but be explicit). Add `criterionConfidence: {}` to the `makeDim`-equivalent if any test constructs a `DimensionAssessment` directly. Add a test that `getDelta()` now carries `orgProfile`, `frameworkVersion`, and `benchmark`:

```ts
  it("getDelta carries org profile, framework version, and benchmark", () => {
    const engine = new AssessmentEngine({ name: "Acme", industry: "Retail" });
    engine.updateDimensionScore("strategy", { digital_vision: 4, executive_sponsorship: 4, investment_commitment: 4, governance_structure: 4 }, []);
    const delta = engine.getDelta();
    expect(delta.orgProfile.name).toBe("Acme");
    expect(delta.frameworkVersion).toBe("2.0");
    expect(delta.benchmark.byDimension.strategy).not.toBeNull();
  });

  it("startAssessment returns a seed message and profile", () => {
    const engine = new AssessmentEngine({ name: "Acme" });
    const seed = engine.startAssessment();
    expect(seed.seedMessage.length).toBeGreaterThan(0);
    expect(seed.orgProfile.name).toBe("Acme");
    expect(seed.frameworkVersion).toBe("2.0");
  });
```

- [ ] **Step 6: Run all assessment tests**

Run: `npx vitest run src/lib/assessment/`
Expected: PASS (scoring, confidence, engine, agent, tools, types). Fix any v1.0-pinned assertions.

- [ ] **Step 7: Commit**

```bash
git add src/lib/assessment/types.ts src/lib/assessment/engine.ts src/lib/assessment/__tests__/confidence.test.ts src/lib/assessment/__tests__/engine.test.ts
git commit -m "feat(assessment): rebuild confidence model, carry org profile + benchmark in delta"
```

---

## Phase 2 — Agent-Guided Kickoff & Benchmark Tool (Requirement 3 + part of 1)

### Task 5: Replace the hardcoded benchmark with a real benchmark estimator

**Files:**
- Create: `src/lib/assessment/benchmarks.ts`
- Test: `src/lib/assessment/__tests__/benchmarks.test.ts`
- Modify: `src/components/report/OverviewTab.tsx`, `src/lib/assessment/agent.ts`, `src/mcp/server.ts`

**Interfaces:**
- Consumes: `FrameworkConfig` (v2.0 `benchmarkTarget` per criterion), `OrgProfile`.
- Produces: `estimateIndustryBenchmark(industry, size, config)` → `{ overall: number; byDimension: Record<string, number> }`. Replaces every hardcoded `3.2`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/assessment/__tests__/benchmarks.test.ts
import { describe, it, expect } from "vitest";
import { loadFramework } from "../../framework/config";
import { estimateIndustryBenchmark } from "../benchmarks";

const config = loadFramework("v2.0");

describe("estimateIndustryBenchmark", () => {
  it("returns a 1–5 overall and per-dimension averages derived from benchmarkTarget", () => {
    const b = estimateIndustryBenchmark("Manufacturing", "mid-market", config);
    expect(b.overall).toBeGreaterThan(1);
    expect(b.overall).toBeLessThanOrEqual(5);
    for (const dim of config.dimensions) {
      expect(b.byDimension[dim.id]).toBeGreaterThanOrEqual(1);
      expect(b.byDimension[dim.id]).toBeLessThanOrEqual(5);
    }
  });

  it("applies a size adjustment (enterprises benchmark higher than startups)", () => {
    const ent = estimateIndustryBenchmark("Finance", "enterprise", config);
    const startup = estimateIndustryBenchmark("Finance", "startup", config);
    expect(ent.overall).toBeGreaterThanOrEqual(startup.overall);
  });

  it("applies an industry adjustment for heavily-regulated industries", () => {
    const finance = estimateIndustryBenchmark("Finance", "mid-market", config);
    const retail = estimateIndustryBenchmark("Retail", "mid-market", config);
    // Finance tends to score higher on governance/infra; overall within a band.
    expect(Math.abs(finance.overall - retail.overall)).toBeLessThan(1.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/__tests__/benchmarks.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement benchmarks.ts**

```ts
// src/lib/assessment/benchmarks.ts
import { FrameworkConfig } from "../framework/types";
import { OrgProfile } from "./types";

const SIZE_ADJUSTMENT: Record<OrgProfile["size"], number> = {
  startup: -0.3,
  smb: -0.15,
  "mid-market": 0,
  enterprise: 0.2,
};

// Industries that tend to score higher on governance/infra (regulated).
const HIGH_REGULATION = new Set(["finance", "banking", "insurance", "healthcare", "pharma", "government"]);

function normIndustry(industry: string): string {
  return industry.trim().toLowerCase();
}

/**
 * Estimate an industry benchmark from the framework's per-criterion
 * benchmarkTarget values, adjusted for org size and industry regulation level.
 * This is a transparent, deterministic estimate (not an LLM call) so the
 * report and the agent agree on the number. Replaces the hardcoded 3.2.
 */
export function estimateIndustryBenchmark(
  industry: string,
  size: OrgProfile["size"],
  config: FrameworkConfig
): { overall: number; byDimension: Record<string, number> } {
  const sizeAdj = SIZE_ADJUSTMENT[size] ?? 0;
  const regAdj = HIGH_REGULATION.has(normIndustry(industry)) ? 0.15 : 0;

  const byDimension: Record<string, number> = {};
  let sum = 0;
  let count = 0;
  for (const dim of config.dimensions) {
    const targets = dim.criteria.map((c) => c.benchmarkTarget).filter((t): t is number => t !== undefined);
    if (targets.length === 0) {
      byDimension[dim.id] = 3; // neutral fallback
    } else {
      const avg = targets.reduce((a, b) => a + b, 0) / targets.length;
      const adjusted = Math.max(1, Math.min(5, avg + sizeAdj + regAdj));
      byDimension[dim.id] = Math.round(adjusted * 10) / 10;
    }
    sum += byDimension[dim.id];
    count++;
  }
  const overall = count > 0 ? Math.round((sum / count) * 10) / 10 : 3;
  return { overall, byDimension };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/assessment/__tests__/benchmarks.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into OverviewTab (replace hardcoded 3.2)**

In `src/components/report/OverviewTab.tsx`, replace `const industryBenchmark = 3.2;` with:

```ts
import { estimateIndustryBenchmark } from "@/lib/assessment/benchmarks";
// ...
  // inside the component, after `const overallScore = ...`:
  const benchmark = estimateIndustryBenchmark(
    delta.orgProfile?.industry || "Manufacturing",
    delta.orgProfile?.size || "mid-market",
    config
  );
  const industryBenchmark = benchmark.overall;
```

- [ ] **Step 6: Wire it into the agent's estimate_benchmark tool**

In `src/lib/assessment/agent.ts`, in the `estimate_benchmark` case, replace the placeholder output with a real estimate:

```ts
        case "estimate_benchmark": {
          const { estimateIndustryBenchmark } = await import("./benchmarks");
          const benchmark = estimateIndustryBenchmark(
            (input.industry as string) || session.orgProfile.industry || "Manufacturing",
            (session.orgProfile.size as OrgProfile["size"]) || "mid-market",
            loadFramework()
          );
          output = { industry: input.industry, benchmark };
          break;
        }
```

(Add `import type { OrgProfile } from "./types";` at the top of agent.ts if not present. The dynamic `await import` keeps the tool surface unchanged while avoiding a circular import risk; a static import is also fine — prefer static if the module graph allows: `import { estimateIndustryBenchmark } from "./benchmarks";` at the top.)

- [ ] **Step 7: Wire it into the MCP server's estimate_benchmark handler**

In `src/mcp/server.ts`, in the `estimate_benchmark` handler, replace the hardcoded `estimatedAvg: 3.2`:

```ts
  async (params) => {
    const p = params as Record<string, unknown>;
    const { estimateIndustryBenchmark } = await import("../lib/assessment/benchmarks");
    const config = loadFramework();
    const benchmark = estimateIndustryBenchmark(
      (p.industry as string) || "Manufacturing",
      ((engine?.getSession().orgProfile.size) as OrgProfile["size"]) || "mid-market",
      config
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ industry: p.industry, benchmark }) }],
    };
  }
```

(Add `import type { OrgProfile } from "../lib/assessment/types";` at the top of server.ts.)

- [ ] **Step 8: Run full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/assessment/benchmarks.ts src/lib/assessment/__tests__/benchmarks.test.ts src/components/report/OverviewTab.tsx src/lib/assessment/agent.ts src/mcp/server.ts
git commit -m "feat(benchmarks): replace hardcoded 3.2 with size/industry-adjusted estimate"
```

---

### Task 6: Strengthen the agent system prompt to drive the conversation

**Files:**
- Modify: `src/lib/assessment/agent.ts`
- Test: `src/lib/assessment/__tests__/agent.test.ts` (update the prompt-building test)

**Interfaces:**
- Produces: a richer `SYSTEM_PROMPT` and `buildSystemPrompt()` that includes the framework version, the org profile, the dependency map hint, the benchmark, and an explicit instruction to lead the conversation and ask the first question.

- [ ] **Step 1: Read the current agent test to see what it asserts**

Run: `sed -n '1,60p' src/lib/assessment/__tests__/agent.test.ts` (read-only; understand the existing `buildSystemPrompt` assertions before editing).

- [ ] **Step 2: Update the test to expect the richer prompt**

Add/adjust assertions in `src/lib/assessment/__tests__/agent.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { AssessmentEngine } from "../engine";
import { buildSystemPrompt } from "../agent";

describe("buildSystemPrompt", () => {
  it("includes the framework version and all 7 dimensions", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toContain("Framework v2.0");
    expect(prompt).toContain("Strategy & Leadership");
    expect(prompt).toContain("Customer Experience");
  });

  it("instructs the agent to lead the conversation and ask the first question", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toMatch(/lead the conversation/i);
    expect(prompt).toMatch(/ask.*first.*question|first.*targeted.*question/i);
  });

  it("surfaces the org profile when known", () => {
    const engine = new AssessmentEngine({ name: "Acme", industry: "Retail" });
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("Retail");
  });

  it("includes the dependency-map guidance", () => {
    const engine = new AssessmentEngine();
    const prompt = buildSystemPrompt(engine);
    expect(prompt).toMatch(/dependenc/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/__tests__/agent.test.ts`
Expected: FAIL — prompt doesn't contain "Framework v2.0" / "lead the conversation" / "dependenc".

- [ ] **Step 4: Rewrite SYSTEM_PROMPT and buildSystemPrompt**

```ts
// src/lib/assessment/agent.ts — replace the existing SYSTEM_PROMPT constant and buildSystemPrompt
const SYSTEM_PROMPT = `You are an expert Digital Transformation Consultant conducting a maturity assessment using Framework v{FRAMEWORK_VERSION}. You assess ALL 7 dimensions to sufficient confidence.

## Assessment Dimensions & Criteria
{FRAMEWORK_DIMENSIONS}

## Your Behavior — You LEAD the conversation
1. LEAD: You drive the assessment. You ask the questions. The user is NOT required to speak first — you open with a warm greeting and your first targeted question about Strategy & Leadership, then guide them dimension by dimension.
2. GOAL-DIRECTED: After gathering evidence on one dimension (≥3 evidence items, confidence rising), transition to the next unassessed dimension. Never re-ask what you already know.
3. CONVERSATIONAL: Ask one focused question at a time. Connect insights across dimensions ("You mentioned 60% cloud migration — that shapes your Data & AI readiness. How are data pipelines modernizing alongside it?").
4. EVIDENCE-BASED: Every score must be traceable to evidence from the conversation or uploaded documents.
5. DEPENDENCY-AWARE: Respect dependencies — don't probe advanced AI use cases until the data foundation is understood. Sequence your questioning data→AI→MLOps→governance where relevant.
6. TOOL-USING: Use calculate_score when you have ≥3 evidence items for a dimension. Use update_org_profile when you learn industry/size/geography/constraints. Use estimate_benchmark when you know the industry. Use generate_roadmap ONLY when all 7 dimensions are assessed with sufficient confidence.

## Assessment Progress
- Dimensions assessed: {DIMENSIONS_ASSESSED}/7
- Dimensions remaining: {DIMENSIONS_REMAINING}
- Next focus: {NEXT_FOCUS}

## Org Profile
{ORG_PROFILE}

## Current Scores
{CURRENT_SCORES}

## Industry Benchmark (estimated)
{INDUSTRY_BENCHMARK}

## Response Format
Respond naturally and concisely in conversation (2–4 sentences). After each exchange, decide whether to: (a) ask a follow-up, (b) calculate a score, (c) move to the next dimension, or (d) signal completion + generate_roadmap. When all dimensions are assessed, call generate_roadmap.`;

export function buildSystemPrompt(engine: AssessmentEngine): string {
  const config = loadFramework();
  const session = engine.getSession();
  const delta = engine.getDelta();

  const dimensionsText = config.dimensions
    .map((d) => `- ${d.name} (${d.id}): ${d.criteria.map((c) => c.name).join(", ")}`)
    .join("\n");

  const currentScores = Object.entries(session.dimensions)
    .map(([id, dim]) => `${id}: ${dim.score > 0 ? dim.score.toFixed(1) : "not yet assessed"} (confidence: ${(dim.confidence * 100).toFixed(0)}%)`)
    .join("\n");

  const orgProfile = session.orgProfile.name
    ? `Name: ${session.orgProfile.name}\nIndustry: ${session.orgProfile.industry}\nSize: ${session.orgProfile.size}\nGeography: ${session.orgProfile.geography || "unknown"}`
    : "Not yet gathered — ask about the organization early, but lead with your first question regardless.";

  const benchmarkText = session.orgProfile.industry
    ? `Industry: ${session.orgProfile.industry} (size: ${session.orgProfile.size})`
    : "Unknown industry — ask, then estimate.";

  return SYSTEM_PROMPT
    .replace("{FRAMEWORK_VERSION}", config.version)
    .replace("{FRAMEWORK_DIMENSIONS}", dimensionsText)
    .replace("{DIMENSIONS_ASSESSED}", String(delta.dimensionsAssessed))
    .replace("{DIMENSIONS_REMAINING}", String(delta.dimensionsRemaining))
    .replace("{NEXT_FOCUS}", delta.nextFocus || "Start with Strategy & Leadership")
    .replace("{ORG_PROFILE}", orgProfile)
    .replace("{CURRENT_SCORES}", currentScores)
    .replace("{INDUSTRY_BENCHMARK}", benchmarkText);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/assessment/__tests__/agent.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/assessment/agent.ts src/lib/assessment/__tests__/agent.test.ts
git commit -m "feat(agent): strengthen system prompt to lead the conversation + surface benchmark"
```

---

### Task 7: Add `runAgentKickoff()` so the agent produces the opening turn

**Files:**
- Modify: `src/lib/assessment/agent.ts`
- Test: `src/lib/assessment/__tests__/agent.test.ts` (add kickoff test)

**Interfaces:**
- Produces: `runAgentKickoff(engine): Promise<AgentResponse>` — calls `engine.startAssessment()`, seeds the conversation, runs the agent loop WITHOUT requiring a user message, persists the assistant's opening as the first `conversationHistory` entry, and returns the standard `AgentResponse`.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/assessment/__tests__/agent.test.ts`:

```ts
import { runAgentKickoff } from "../agent";
import { chat } from "../../llm/client";

// We mock the LLM chat() so the kickoff test doesn't need a live API key.
vi.mock("../../llm/client", () => ({
  chat: vi.fn(),
  complete: vi.fn(),
  assistantToolCallMessage: (r: { text: string; toolCalls: unknown[] }) =>
    r.toolCalls.length ? { role: "assistant", content: r.text, toolCalls: r.toolCalls } : { role: "assistant", content: r.text },
  toolResultMessage: (id: string, _name: string, content: string) => ({ role: "tool", toolCallId: id, name: _name, content }),
}));

describe("runAgentKickoff", () => {
  it("produces an opening assistant message and seeds conversation history", async () => {
    (chat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "Hello! I'm your AI Transformation Navigator. Let's start with Strategy & Leadership — who sponsors digital and AI transformation in your organization?",
      toolCalls: [],
      stopReason: "end_turn",
    });
    const engine = new AssessmentEngine();
    const res = await runAgentKickoff(engine);
    expect(res.message.length).toBeGreaterThan(0);
    expect(res.message).toMatch(/strategy|leadership|sponsor/i);
    // The opening is persisted as the first conversation-history entry (assistant role).
    const history = engine.getSession().conversationHistory;
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].role).toBe("assistant");
  });

  it("does not require a user message before the first turn", async () => {
    (chat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      text: "Welcome — let's begin. Tell me about your organization's AI vision.",
      toolCalls: [],
      stopReason: "end_turn",
    });
    const engine = new AssessmentEngine();
    const before = engine.getSession().conversationHistory.length;
    await runAgentKickoff(engine);
    const after = engine.getSession().conversationHistory.length;
    // No user message should have been added — only the assistant's opening.
    const userMsgs = engine.getSession().conversationHistory.filter((m) => m.role === "user");
    expect(userMsgs.length).toBe(before);
    expect(after).toBe(before + 1);
  });
});
```

Add `import { describe, it, expect, vi, beforeEach } from "vitest";` at the top of the test file if `vi` isn't already imported, and `beforeEach(() => { vi.clearAllMocks(); })` inside each describe that uses the mock.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/__tests__/agent.test.ts`
Expected: FAIL — `runAgentKickoff` is not exported.

- [ ] **Step 3: Implement runAgentKickoff in agent.ts**

```ts
// src/lib/assessment/agent.ts — ADD after runAgentTurn
/**
 * Kick off an agent-led assessment. The agent produces the opening turn
 * (greeting + first targeted question) WITHOUT requiring the user to speak
 * first. The opening is persisted as the first assistant message in
 * conversation history so subsequent turns have context.
 */
export async function runAgentKickoff(engine: AssessmentEngine): Promise<AgentResponse> {
  const seed = engine.startAssessment();
  const systemPrompt = buildSystemPrompt(engine);

  // Seed the messages array with a system-level kickoff directive as a user
  // turn the model sees, but do NOT persist it as a real user message — the
  // user hasn't spoken. The assistant's reply becomes history's first entry.
  const messages: LLMMessage[] = [
    { role: "user", content: seed.seedMessage },
  ];

  const result = await chat(messages, agentTools, { system: systemPrompt, maxTokens: 1024 });

  // Execute any tool calls the agent emitted on kickoff (e.g. update_org_profile).
  const toolCallResults: AgentResponse["toolCalls"] = [];
  messages.push(assistantToolCallMessage(result));

  if (result.toolCalls.length > 0 && result.stopReason === "tool_use") {
    for (const tc of result.toolCalls) {
      const output = executeTool(tc.name, tc.input, engine);
      toolCallResults.push({ tool: tc.name, input: tc.input, output });
      messages.push(toolResultMessage(tc.id, tc.name, JSON.stringify(output)));
    }
    // One follow-up round so the agent can produce its spoken opening after tool use.
    const followup = await chat(messages, agentTools, { system: systemPrompt, maxTokens: 1024 });
    result.text += followup.text;
  }

  const openingText = result.text || "Hello! I'm your AI Transformation Navigator. Let's begin by talking about your organization's Strategy & Leadership — who owns digital and AI transformation?";
  engine.addConversationMessage("assistant", openingText);

  return {
    message: openingText,
    assessment: engine.getDelta(),
    isComplete: engine.checkComplete(),
    toolCalls: toolCallResults,
  };
}
```

Also extract the tool-execution switch from `runAgentTurn` into a private helper so `runAgentKickoff` can reuse it. Add this helper to agent.ts:

```ts
// src/lib/assessment/agent.ts — ADD a module-level helper
function executeTool(
  name: string,
  input: Record<string, unknown>,
  engine: AssessmentEngine
): Record<string, unknown> {
  switch (name) {
    case "calculate_score": {
      engine.updateDimensionScore(
        input.dimensionId as string,
        input.criterionScores as Record<string, number>,
        input.gaps as string[]
      );
      return { success: true };
    }
    case "update_org_profile": {
      engine.updateOrgProfile(input);
      return { success: true };
    }
    case "estimate_benchmark": {
      // Defer to the benchmarks module (Task 5 wired this in runAgentTurn too).
      const { estimateIndustryBenchmark } = require("./benchmarks");
      const session = engine.getSession();
      const benchmark = estimateIndustryBenchmark(
        (input.industry as string) || session.orgProfile.industry || "Manufacturing",
        session.orgProfile.size,
        loadFramework()
      );
      return { industry: input.industry, benchmark };
    }
    case "generate_roadmap":
      return { triggered: true };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
```

Then refactor `runAgentTurn`'s tool loop to call `executeTool(tc.name, tc.input, engine)` instead of the inline switch (keep behavior identical; this is DRY, not a behavior change). Note: `require()` is used inside `executeTool` only to avoid a static-import cycle with benchmarks.ts (which imports only framework types, so a static import is actually safe — prefer `import { estimateIndustryBenchmark } from "./benchmarks";` at the top of agent.ts and call it directly; use the static form).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/assessment/__tests__/agent.test.ts`
Expected: PASS (both kickoff tests + existing runAgentTurn tests).

- [ ] **Step 5: Run full suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/assessment/agent.ts src/lib/assessment/__tests__/agent.test.ts
git commit -m "feat(agent): add runAgentKickoff for agent-led conversation start"
```

---

### Task 8: Wire the kickoff into the chat API + useChat hook

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/hooks/useChat.ts`

**Interfaces:**
- Consumes: `runAgentKickoff` (Task 7).
- Produces: `POST /api/chat` accepts `{ kickoff: true }` (no `message` required) and returns the agent's opening `AgentResponse`. `useChat.startAssessment()` calls it and seeds the first assistant message.

- [ ] **Step 1: Update the chat API route**

```ts
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AssessmentEngine } from "@/lib/assessment/engine";
import { runAgentTurn, runAgentKickoff } from "@/lib/assessment/agent";

let engine: AssessmentEngine | null = null;

function getEngine(): AssessmentEngine {
  if (!engine) engine = new AssessmentEngine();
  return engine;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, kickoff } = body;

    // Kickoff: agent leads with an opening turn; no user message required.
    if (kickoff) {
      const currentEngine = getEngine();
      if (sessionId === undefined) engine = currentEngine;
      const response = await runAgentKickoff(currentEngine);
      return NextResponse.json(response);
    }

    const currentEngine = sessionId ? getEngine() : new AssessmentEngine();
    if (!sessionId) engine = currentEngine;

    const response = await runAgentTurn(message, currentEngine);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add startAssessment() to useChat**

In `src/hooks/useChat.ts`, add a `startAssessment` callback that fires the kickoff and seeds the first message (no user message added):

```ts
  const startAssessment = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kickoff: true, sessionId: "current" }),
      });
      if (!response.ok) throw new Error("Kickoff failed");
      const data: AgentResponse = await response.json();
      const openingMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        assessment: data.assessment,
      };
      setMessages((prev) => [...prev, openingMessage]);
      setCurrentDelta(data.assessment);
      setIsComplete(data.isComplete);
    } catch (error) {
      console.error("Kickoff error:", error);
      // Fallback greeting so the UI isn't empty if the API is unreachable.
      const fallback: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Hello! I'm your AI Transformation Navigator. Let's start with Strategy & Leadership — who sponsors digital and AI transformation in your organization?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  }, []);
```

Add `startAssessment` to the returned object: `return { messages, isLoading, currentDelta, isComplete, sendMessage, uploadDocument, startAssessment };`

- [ ] **Step 3: Manual smoke check (no automated test — UI wiring)**

Run: `npx tsc --noEmit`
Expected: no type errors. (Full E2E verification happens in the run skill after the voice/panel tasks land.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/route.ts src/hooks/useChat.ts
git commit -m "feat(chat): wire agent kickoff into API + useChat.startAssessment"
```

---

## Phase 3 — Voice Mode Rebuild (Requirement 2)

### Task 9: Build a continuous-listening STT hook with auto-send

**Files:**
- Create: `src/hooks/useContinuousVoice.ts`
- Test: `src/hooks/__tests__/useContinuousVoice.test.ts` (create)

**Interfaces:**
- Produces: `useContinuousVoice({ onTranscript, onAssistantSpeaking })` → `{ isListening, isSpeaking, start, stop, speak, stopSpeaking, isSupported, interimTranscript }`. Key behavior: when `start()` is called, recognition runs in `continuous=true, interimResults=true` mode; each finalized result segment fires `onTranscript(text)`, which the caller wires to `sendMessage`. While `onAssistantSpeaking` is true, listening is paused (so the mic doesn't transcribe the TTS playback). Re-arms itself after each final result.

**Why a new hook:** The existing `useVoice` is one-shot (`continuous=false, interimResults=false`) and resolves a single Promise — it can't continuously capture multiple utterances or show interim text. Voice mode needs continuous capture + auto-send per utterance.

- [ ] **Step 1: Write the failing test**

```ts
// src/hooks/__tests__/useContinuousVoice.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the Web Speech API on the global object.
class MockRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  maxAlternatives = 1;
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [i: number]: { transcript: string } } } }) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

describe("useContinuousVoice", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reports unsupported when SpeechRecognition is absent", async () => {
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const { result } = renderHook(() => useContinuousVoice({ onTranscript: vi.fn() }));
    expect(result.current.isSupported).toBe(false);
  });

  it("starts continuous recognition and fires onTranscript on final results", async () => {
    const recognition = new MockRecognition();
    vi.stubGlobal("SpeechRecognition", vi.fn(() => recognition));
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useContinuousVoice({ onTranscript }));
    act(() => result.current.start());
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(recognition.start).toHaveBeenCalled();
    // Simulate a final result.
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, 0: { transcript: "hello world" } } },
      });
    });
    expect(onTranscript).toHaveBeenCalledWith("hello world");
    vi.unstubAllGlobals();
  });

  it("updates interimTranscript for non-final results without firing onTranscript", async () => {
    const recognition = new MockRecognition();
    vi.stubGlobal("SpeechRecognition", vi.fn(() => recognition));
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useContinuousVoice({ onTranscript }));
    act(() => result.current.start());
    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: false, 0: { transcript: "hel" } } },
      });
    });
    expect(onTranscript).not.toHaveBeenCalled();
    expect(result.current.interimTranscript).toBe("hel");
    vi.unstubAllGlobals();
  });

  it("re-arms recognition after onend (continuous mode)", async () => {
    const recognition = new MockRecognition();
    vi.stubGlobal("SpeechRecognition", vi.fn(() => recognition));
    const { useContinuousVoice } = await import("../useContinuousVoice");
    const { result } = renderHook(() => useContinuousVoice({ onTranscript: vi.fn() }));
    act(() => result.current.start());
    recognition.start.mockClear();
    act(() => recognition.onend?.());
    // The hook should call start() again to keep listening.
    expect(recognition.start).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
```

**Test infra note:** This test uses `@testing-library/react`. Add it as a dev dependency if missing: `npm i -D @testing-library/react @testing-library/jest-dom` (check `package.json` first — if not present, add it in this step). The vitest config `environment: "node"` won't render React hooks; **change `vitest.config.ts` to `environment: "jsdom"` and add `jsdom` as a dev dep**: `npm i -D jsdom`. Update `vitest.config.ts`:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
  },
});
```

Rename existing `*.test.ts` hook/component tests to `*.test.tsx` only if they import JSX — the pure-logic tests (scoring, engine, agent) stay `.ts` and run fine under jsdom.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useContinuousVoice.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement useContinuousVoice**

```ts
// src/hooks/useContinuousVoice.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseContinuousVoiceOptions {
  onTranscript: (text: string) => void;
  onAssistantSpeaking?: () => boolean;
}

export function useContinuousVoice({ onTranscript, onAssistantSpeaking }: UseContinuousVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const speakingCheckRef = useRef(onAssistantSpeaking);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    speakingCheckRef.current = onAssistantSpeaking;
  }, [onAssistantSpeaking]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!Ctor) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) onTranscriptRef.current(text);
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are benign in continuous mode; keep going.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Re-arm if we're still supposed to be listening and the assistant isn't talking.
      if (shouldListenRef.current && !speakingCheckRef.current?.()) {
        try {
          recognition.start();
        } catch {
          // start() throws if already started; ignore.
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      recognition.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldListenRef.current = true;
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // already started
    }
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
    setInterimTranscript("");
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }
      // Pause listening while speaking so the mic doesn't capture TTS.
      const wasListening = shouldListenRef.current;
      if (wasListening) {
        shouldListenRef.current = false;
        recognitionRef.current?.stop();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Resume listening after the assistant finishes speaking.
        if (wasListening) {
          shouldListenRef.current = true;
          setIsListening(true);
          try {
            recognitionRef.current?.start();
          } catch {
            /* ignore */
          }
        }
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { isListening, isSpeaking, interimTranscript, start, stop, speak, stopSpeaking, isSupported };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useContinuousVoice.test.ts`
Expected: PASS (all 4 cases).

- [ ] **Step 5: Run full suite (jsdom env)**

Run: `npx vitest run`
Expected: PASS. If existing node-env tests break under jsdom, they're testing pure logic and should still pass; investigate any failures.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useContinuousVoice.ts src/hooks/__tests__/useContinuousVoice.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat(voice): add continuous-listening STT hook with auto-send + TTS pause"
```

---

### Task 10: Build the VoiceOverlay component (no input box)

**Files:**
- Create: `src/components/assess/VoiceOverlay.tsx`

**Interfaces:**
- Consumes: `useContinuousVoice` (Task 9), `useChat`'s `messages`/`sendMessage`/`startAssessment`, `ChatMessage`.
- Produces: a voice-mode UI that replaces `ChatInput`. Shows the conversation transcript (read-only), an interim-transcript line, a pulsing mic orb, and a toggle to exit voice mode. **No text input box is rendered.** Auto-sends each finalized transcript segment via `sendMessage`.

- [ ] **Step 1: Implement VoiceOverlay**

```tsx
// src/components/assess/VoiceOverlay.tsx
"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { useChat } from "@/hooks/useChat";
import { useContinuousVoice } from "@/hooks/useContinuousVoice";

interface VoiceOverlayProps {
  onExit: () => void;
}

export function VoiceOverlay({ onExit }: VoiceOverlayProps) {
  const { messages, sendMessage, isLoading } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, isSpeaking, interimTranscript, start, stop, speak, isSupported } =
    useContinuousVoice({
      onTranscript: (text) => sendMessage(text),
      onAssistantSpeaking: () => isSpeaking,
    });

  // Start listening on mount; stop on unmount.
  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speak each new assistant message aloud (TTS), then resume listening.
  const lastSpokenRef = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.id !== lastSpokenRef.current) {
      lastSpokenRef.current = last.id;
      speak(last.content);
    }
  }, [messages, speak]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interimTranscript]);

  if (!isSupported) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Voice input isn&apos;t supported in this browser. Use the text input instead.
        </p>
        <button
          onClick={onExit}
          className="gradient-primary text-white px-6 py-2 rounded-lg text-sm font-medium"
        >
          Switch to text input
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Voice Mode</h2>
          <p className="text-xs text-muted-foreground">
            {isSpeaking ? "Speaking…" : isListening ? "Listening — just talk" : "Tap the mic to resume"}
          </p>
        </div>
        <button
          onClick={onExit}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded border border-border"
        >
          ⌨ Text input
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        {interimTranscript && (
          <div className="flex justify-end mb-4">
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm text-muted-foreground italic">
              {interimTranscript}…
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-6 flex flex-col items-center gap-3">
        <button
          onClick={isListening ? stop : start}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${
            isListening
              ? "bg-red-500/20 border-2 border-red-500 animate-pulse"
              : "gradient-primary text-white border-2 border-transparent"
          }`}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? "🔴" : "🎤"}
        </button>
        <p className="text-xs text-muted-foreground">
          {isListening ? "Listening — speak naturally" : "Mic off"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/assess/VoiceOverlay.tsx
git commit -m "feat(voice): add VoiceOverlay with continuous mic orb, no text input"
```

---

### Task 11: Wire voice mode + agent kickoff into ChatPanel

**Files:**
- Modify: `src/components/assess/ChatPanel.tsx`
- Modify: `src/components/assess/ChatInput.tsx`

**Goal:** ChatPanel (a) auto-fires `startAssessment()` on mount so the agent leads, (b) has a voice-mode toggle, and (c) when voice mode is ON, renders `VoiceOverlay` (no input box) instead of `ChatInput`; when OFF, renders `ChatInput` with a mic toggle.

- [ ] **Step 1: Rewrite ChatPanel**

```tsx
// src/components/assess/ChatPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { VoiceOverlay } from "./VoiceOverlay";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";

interface ChatPanelProps {
  onAssessmentUpdate: (delta: ReturnType<typeof useChat>["currentDelta"]) => void;
  onComplete: () => void;
}

export function ChatPanel({ onAssessmentUpdate, onComplete }: ChatPanelProps) {
  const { messages, isLoading, currentDelta, isComplete, sendMessage, uploadDocument, startAssessment } = useChat();
  const { speak, isSupported: voiceSupported } = useVoice();
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kickedOffRef = useRef(false);

  // Agent-led kickoff: fire once on mount so the agent greets + asks first.
  useEffect(() => {
    if (kickedOffRef.current) return;
    kickedOffRef.current = true;
    startAssessment();
  }, [startAssessment]);

  useEffect(() => {
    if (currentDelta) onAssessmentUpdate(currentDelta);
  }, [currentDelta, onAssessmentUpdate]);

  useEffect(() => {
    if (isComplete) onComplete();
  }, [isComplete, onComplete]);

  // Auto-speak assistant messages in TEXT mode (voice mode handles its own TTS).
  useEffect(() => {
    if (voiceMode) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") speak(lastMsg.content);
  }, [messages, speak, voiceMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (file: File) => {
    const result = await uploadDocument(file);
    if (result?.signalsCount > 0) {
      sendMessage(`I've uploaded "${file.name}". I found ${result.signalsCount} relevant signals. Please review and ask follow-up questions.`);
    } else if (result) {
      sendMessage(`I've uploaded "${file.name}" but couldn't extract strong signals. Please ask me about what you found in it.`);
    }
  };

  if (voiceMode) {
    return <VoiceOverlay onExit={() => setVoiceMode(false)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Assessment Chat</h2>
          <p className="text-xs text-muted-foreground">AI Consultant is leading the assessment</p>
        </div>
        {voiceSupported && (
          <button
            onClick={() => setVoiceMode(true)}
            className="text-xs text-muted-foreground hover:text-violet-400 transition-colors px-3 py-1 rounded border border-border"
            title="Switch to voice mode"
          >
            🎤 Voice mode
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <ChatInput
        onSend={sendMessage}
        onUpload={handleUpload}
        onVoiceInput={() => setVoiceMode(true)}
        isLoading={isLoading}
        isListening={false}
      />
    </div>
  );
}
```

- [ ] **Step 2: Simplify ChatInput's mic button to enter voice mode**

The text-mode mic button now toggles into voice mode (where the input box disappears) rather than doing one-shot capture. Update `ChatInput.tsx`'s mic button label/behavior is already `onVoiceInput`; just update the `title` and icon to signal it opens voice mode:

In `src/components/assess/ChatInput.tsx`, change the mic button block to:

```tsx
        <Button
          variant="ghost"
          size="icon"
          onClick={onVoiceInput}
          title="Switch to voice mode (hides text input)"
        >
          🎤
        </Button>
```

(Remove the `isListening` destructive-variant logic since voice mode is now a separate screen; keep `isListening` in props for compatibility but it's unused — or remove it from the interface and the call site in ChatPanel. Prefer removing: drop `isListening` from `ChatInputProps` and from the ChatPanel `<ChatInput ...>` call.)

- [ ] **Step 3: Update the assess page header to mention voice mode (optional polish)**

In `src/app/assess/page.tsx`, no change required — `ChatPanel` handles voice mode internally.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/assess/ChatPanel.tsx src/components/assess/ChatInput.tsx
git commit -m "feat(assess): agent-led kickoff + voice-mode toggle that hides text input"
```

- [ ] **Step 6: Manual E2E verification (use the run/verify skill)**

Run the app (`npm run dev`), open `/assess`, and verify:
1. On load, the agent sends an opening message with a first question (no user input needed).
2. Clicking "🎤 Voice mode" hides the text input box and shows the mic orb.
3. Speaking produces interim transcript then auto-sends a user message when the utterance finalizes.
4. The assistant's reply is spoken via TTS; listening resumes after TTS ends.
5. The scorecard panel updates as the agent scores dimensions.

Commit any fixes uncovered:

```bash
git add -A && git commit -m "fix(voice): <specific fix>"
```

---

## Phase 4 — Methodology Explainer Page (Requirement 1)

### Task 12: Build the Methodology page and its components

**Files:**
- Create: `src/components/methodology/DimensionMatrix.tsx`
- Create: `src/components/methodology/ScoringFormula.tsx`
- Create: `src/components/methodology/ReferenceFrameworks.tsx`
- Create: `src/components/methodology/WhyItMatters.tsx`
- Create: `src/app/methodology/page.tsx`
- Modify: `src/components/landing/HeroSection.tsx` (add link)

**Goal:** A public `/methodology` page that explains (a) the assessment matrix — 7 dimensions × 30 criteria × 5 levels, (b) how scoring is set up — the confidence-weighted math, AI-readiness composite, benchmark delta, dependency map, (c) which reference frameworks were used and what each contributed (with links), (d) how it makes a company successful in AI transformation, and (e) why this is unique and good.

- [ ] **Step 1: Create DimensionMatrix (server component — no "use client" needed; it only reads the framework JSON)**

```tsx
// src/components/methodology/DimensionMatrix.tsx
import { loadFramework } from "@/lib/framework/config";

export function DimensionMatrix() {
  const config = loadFramework("v2.0");
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold gradient-text">The Assessment Matrix</h2>
      <p className="text-sm text-muted-foreground">
        {config.dimensions.length} dimensions · {config.dimensions.reduce((n, d) => n + d.criteria.length, 0)} criteria · 5 maturity levels each.
      </p>
      <div className="space-y-4">
        {config.dimensions.map((dim) => (
          <div key={dim.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-lg font-semibold text-foreground">{dim.name}</h3>
              <span className="text-xs text-muted-foreground">weight {dim.weight}</span>
            </div>
            {dim.weightingRationale && (
              <p className="text-xs text-muted-foreground/70 mb-3 italic">{dim.weightingRationale}</p>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              {dim.criteria.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/60 p-3 bg-muted/20">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    {c.benchmarkTarget !== undefined && (
                      <span className="text-[10px] text-violet-300/80">peer avg: L{c.benchmarkTarget}</span>
                    )}
                  </div>
                  <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                    {Object.values(c.levels).map((lvl, i) => (
                      <li key={i}><span className="text-foreground/80">L{i + 1}:</span> {lvl}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create ScoringFormula**

```tsx
// src/components/methodology/ScoringFormula.tsx
export function ScoringFormula() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold gradient-text">How Scoring Works</h2>
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm text-muted-foreground">
        <p><strong className="text-foreground">1. Criterion score (1–5).</strong> The AI consultant scores each criterion against its 5-level rubric, grounded in evidence from the conversation and uploaded documents.</p>
        <p><strong className="text-foreground">2. Criterion confidence (0–1).</strong> Each criterion&apos;s confidence grows with the strength and volume of evidence behind it. Document evidence counts more than a passing remark. A score with no evidence carries zero weight.</p>
        <p><strong className="text-foreground">3. Dimension score.</strong> A confidence-weighted average of its criteria — criteria with more evidence count more, so a partially-probed dimension reflects only what was actually assessed (never a deflated average).</p>
        <p><strong className="text-foreground">4. Digital Maturity Score.</strong> A weighted average of the dimensions assessed to sufficient confidence (≥{Math.round(0.7 * 100)}%), divided by assessed-dimension weights only.</p>
        <p><strong className="text-foreground">5. AI Readiness Score (0–100).</strong> A composite of 6 cross-cutting components (AI Strategy, Data, Infrastructure, Talent, Governance, Operational). Strategy and Data are weighted 1.5× because they are leading indicators. Each component is the confidence-weighted criterion average, normalized 1–5 → 0–100.</p>
        <p><strong className="text-foreground">6. Benchmark delta.</strong> Every criterion has an industry-typical target level; the report shows where you lead or lag your peers, adjusted for org size and regulation level.</p>
        <p><strong className="text-foreground">7. Dependency map.</strong> 10 cross-dimension dependency edges (data → AI → MLOps → governance, cloud → data, etc.) sequence the roadmap so you never scale AI before the foundations are solid.</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create ReferenceFrameworks**

```tsx
// src/components/methodology/ReferenceFrameworks.tsx
import { loadFramework } from "@/lib/framework/config";

const CONTRIBUTIONS: Record<string, string> = {
  "McKinsey Digital Quotient": "Strategy + Customer + Technology + Org/Culture pillars; percentile benchmarking model.",
  "Deloitte Digital Maturity Model": "Strategy + CX + Operations + Culture structure; 4-level progression.",
  "MIT CISR Digital Business Transformation": "Two-axis model (digital capability × leadership intensity); leadership as separate axis.",
  "Gartner Digital Business Maturity": "5-level model; Information/Technology distinct from Operations.",
  "AWS Well-Architected ML Lens": "Fully public AI/ML scoring rubric — the baseline reference for our AI-readiness levels.",
  "Microsoft MLOps Maturity Model": "Fully public MLOps rubric (Levels 0–4); People + Model + Release + Integration.",
  "Google Cloud AI Maturity Framework": "Strategy + Data + Infra + Talent + Governance + Business Integration (6 dimensions).",
  "Accenture AI Maturity Index": "Composite 0–100 score; Strategy + Data/Tech + Talent + Responsible AI + Value.",
  "BCG AI Maturity Model": "Dabbling → Practicing → Scaling → AI-Native; Strategy + Data/Tech + Governance + Value.",
  "IDC AI Maturity Model": "5 levels (Laggard → Leader); Strategy + Data + Tech + Talent + Use Cases.",
  "Forrester Digital Maturity Benchmark": "Strategy + CX + Operations + Technology/Ecosystem; benchmark dataset.",
  "Adobe Digital Maturity Assessment": "Strategy + CX + Tech/Data + Org/Culture + Operations/Innovation.",
};

export function ReferenceFrameworks() {
  const config = loadFramework("v2.0");
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold gradient-text">Grounded in 15+ Established Frameworks</h2>
      <p className="text-sm text-muted-foreground">
        This framework is not invented from scratch. It synthesizes the convergent dimensions identified across 15+ established digital transformation and AI maturity models. Each reference contributed something specific:
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(config.referenceFrameworks).map(([name, url]) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-card p-4 hover:border-violet-500/50 transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground mb-1">{name}</div>
            <div className="text-xs text-muted-foreground">{CONTRIBUTIONS[name] ?? "Convergent dimension contribution."}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create WhyItMatters**

```tsx
// src/components/methodology/WhyItMatters.tsx
export function WhyItMatters() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold gradient-text">Why This Drives AI-Transformation Success</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Cuts months to minutes</h3>
          <p className="text-xs text-muted-foreground">A conversational assessment replaces weeks of surveys and consulting interviews with a guided 15-minute dialogue — and produces a defensible scorecard immediately.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Evidence-traceable scores</h3>
          <p className="text-xs text-muted-foreground">Every score links back to what you actually said or uploaded. No black-box ratings — executives can audit the basis for each level.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Sequenced, not generic</h3>
          <p className="text-xs text-muted-foreground">The dependency map ensures the roadmap respects reality: data before AI, cloud before data migration, governance before scaling. You invest in the right order.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Two scores, one picture</h3>
          <p className="text-xs text-muted-foreground">Digital Maturity (where you are) + AI Readiness (whether you can capitalize on AI) — so leaders see both current state and capacity to execute.</p>
        </div>
      </div>
      <h2 className="text-2xl font-bold gradient-text pt-4">What Makes It Unique</h2>
      <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
        <li><strong className="text-foreground">Unified digital + AI assessment.</strong> Most frameworks cover one or the other. This synthesizes both into a single 7-dimension model.</li>
        <li><strong className="text-foreground">Configurable, versioned framework.</strong> Existing frameworks are static; ours is JSON-driven and evolves without code changes (v1.0 → v2.0 already shipped).</li>
        <li><strong className="text-foreground">Conversational, not checkbox.</strong> The agent leads, probes, and connects insights across dimensions — closer to a senior consultant than a survey.</li>
        <li><strong className="text-foreground">Live scorecard.</strong> The scorecard builds in real time as evidence accumulates, not as a post-hoc report.</li>
        <li><strong className="text-foreground">Defensible provenance.</strong> Every dimension names the established models it aligns to, so the assessment withstands scrutiny.</li>
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Create the methodology page**

```tsx
// src/app/methodology/page.tsx
import { DimensionMatrix } from "@/components/methodology/DimensionMatrix";
import { ScoringFormula } from "@/components/methodology/ScoringFormula";
import { ReferenceFrameworks } from "@/components/methodology/ReferenceFrameworks";
import { WhyItMatters } from "@/components/methodology/WhyItMatters";
import { loadFramework } from "@/lib/framework/config";

export default function MethodologyPage() {
  const config = loadFramework("v2.0");
  return (
    <main className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold gradient-text">Methodology</h1>
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</a>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        <section className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text">How the Assessment Works</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            {config.name} — {config.description}
          </p>
          <a href="/assess" className="inline-block mt-4 gradient-primary text-white font-semibold px-8 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Start your assessment →
          </a>
        </section>
        <DimensionMatrix />
        <ScoringFormula />
        <ReferenceFrameworks />
        <WhyItMatters />
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Add the link from the landing hero**

In `src/components/landing/HeroSection.tsx`, add a methodology link below the demo link:

```tsx
      <div className="flex gap-4 text-sm">
        <a href="/assess?demo=true" className="text-muted-foreground hover:text-violet-400 transition-colors underline underline-offset-4">
          Load demo company →
        </a>
        <a href="/methodology" className="text-muted-foreground hover:text-violet-400 transition-colors underline underline-offset-4">
          How the assessment works →
        </a>
      </div>
```

(Replace the single demo `<a>` block with this two-link flex container.)

- [ ] **Step 7: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; `/methodology` is a static route. (If build fails on server-component framework access, `loadFramework` is a sync import of JSON — safe in RSC. Heed AGENTS.md: if Next 16 changed RSC data-fetching, read `node_modules/next/dist/docs/` first.)

- [ ] **Step 8: Commit**

```bash
git add src/app/methodology/page.tsx src/components/methodology/ src/components/landing/HeroSection.tsx
git commit -m "feat(methodology): add public explainer page (matrix, scoring, references, why)"
```

---

## Phase 5 — Deployment (FE + BE + remote HTTPS MCP)

### Task 13: Make the MCP server hostable over HTTPS (Streamable HTTP transport)

**Files:**
- Modify: `src/mcp/server.ts`
- Modify: `src/mcp/cli.ts`
- Modify: `src/lib/llm/config.ts` (no change needed — already env-driven; just confirm)
- Modify: `.env.example`

**Goal:** The MCP server currently only runs stdio (`StdioServerTransport`), so no other device can call it remotely. Add a Streamable HTTP transport option so it can be hosted over HTTPS and called by external devices. Transport is selected by `MCP_TRANSPORT` env (`http` | `stdio`, default `stdio`).

- [ ] **Step 1: Check the MCP SDK's HTTP transport API**

Run: `ls node_modules/@modelcontextprotocol/sdk/dist/esm/server/ 2>/dev/null || ls node_modules/@modelcontextprotocol/sdk/`
Read the relevant guide: `node_modules/@modelcontextprotocol/sdk/README.md` (or the streamableHttp export). Confirm the export name — the SDK exposes `StreamableHTTPServerTransport` (replacing the older `HTTPServerTransport`). Verify the exact import path before using it.

- [ ] **Step 2: Add HTTP transport to server.ts**

In `src/mcp/server.ts`, add an HTTP-mode entry point. Add this export alongside `startMcpServer`:

```ts
// src/mcp/server.ts — ADD at top (imports)
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "http";

// ADD a new export:
export async function startMcpHttpServer(port: number) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);

  const httpServer = createServer(async (req, res) => {
    // Single endpoint POST /mcp handles JSON-RPC over HTTP.
    if (req.method === "POST" && req.url?.startsWith("/mcp")) {
      let body = "";
      for await (const chunk of req) body += chunk;
      try {
        const json = JSON.parse(body);
        const response = await transport.handleRequest(json, {
          method: req.method,
          url: req.url,
          headers: req.headers as Record<string, string>,
          body,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Bad request" }));
      }
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  });

  httpServer.listen(port, () => {
    console.error(`AI Transformation Navigator MCP server listening on HTTP :${port}/mcp`);
  });
}
```

**Note:** The exact `StreamableHTTPServerTransport` API varies by SDK version (`@modelcontextprotocol/sdk@^1.29`). The block above is the documented shape for the standalone-server pattern; **verify against `node_modules/@modelcontextprotocol/sdk/`** and adjust the request-handling signature to match the installed version. If the installed version's HTTP transport expects an Express-style request handler instead, adapt accordingly — the goal is a POST `/mcp` endpoint that routes JSON-RPC into the same `server` instance. Update `infra/mcp/Dockerfile` and `docs/deployment.md` to match whatever shape lands.

- [ ] **Step 3: Select transport in cli.ts**

```ts
// src/mcp/cli.ts
import { startMcpServer, startMcpHttpServer } from "./server";

const transport = process.env.MCP_TRANSPORT?.trim().toLowerCase();
const port = parseInt(process.env.MCP_PORT ?? "8080", 10);

if (transport === "http") {
  startMcpHttpServer(port).catch((error) => {
    console.error("Failed to start MCP HTTP server:", error);
    process.exit(1);
  });
} else {
  startMcpServer().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Document the new env vars in .env.example**

Append to `.env.example`:

```bash
# --- MCP server transport (for the remote voice-device server) ---
# stdio = local CLI usage (default); http = remote HTTPS-hostable server.
# MCP_TRANSPORT=http
# MCP_PORT=8080
```

- [ ] **Step 5: Build the MCP bundle and smoke-test stdio still works**

Run: `npm run build:mcp && echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | MCP_TRANSPORT=stdio node dist/mcp/cli.js | head -c 200`
Expected: a JSON-RPC initialize response (stdio transport unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/mcp/server.ts src/mcp/cli.ts .env.example
git commit -m "feat(mcp): add Streamable HTTP transport for remote HTTPS hosting"
```

---

### Task 14: Containerize the MCP server

**Files:**
- Create: `infra/mcp/Dockerfile`
- Create: `infra/mcp/start.sh`
- Create: `infra/mcp/.dockerignore`

- [ ] **Step 1: Create the Dockerfile**

```dockerfile
# infra/mcp/Dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build:mcp

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY infra/mcp/start.sh ./start.sh
RUN chmod +x ./start.sh
EXPOSE 8080
CMD ["./start.sh"]
```

- [ ] **Step 2: Create start.sh**

```bash
#!/bin/sh
# infra/mcp/start.sh
# Defaults to HTTP transport on $PORT (App Runner injects PORT) for remote hosting.
export MCP_TRANSPORT="${MCP_TRANSPORT:-http}"
export MCP_PORT="${MCP_PORT:-${PORT:-8080}}"
node dist/mcp/cli.js
```

- [ ] **Step 3: Create .dockerignore**

```
# infra/mcp/.dockerignore
node_modules
.next
dist
.git
*.md
```

- [ ] **Step 4: Build the image locally to verify it compiles**

Run: `docker build -f infra/mcp/Dockerfile -t ai-navigator-mcp:dev . && docker run --rm -e MCP_TRANSPORT=http -e MCP_PORT=8080 -p 8080:8080 ai-navigator-mcp:dev & sleep 3 && curl -s -X POST http://localhost:8080/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | head -c 300; kill %1 2>/dev/null`
Expected: a JSON-RPC initialize response from the containerized HTTP server. (Skip the live curl if Docker isn't available in the env — at minimum confirm `docker build` succeeds.)

- [ ] **Step 5: Commit**

```bash
git add infra/mcp/Dockerfile infra/mcp/start.sh infra/mcp/.dockerignore
git commit -m "infra(mcp): containerize the MCP server for remote hosting"
```

---

### Task 15: Write the deployment plan document

**Files:**
- Create: `docs/deployment.md`

**Goal:** A complete, cheap, AWS-first (Google Cloud fallback) deployment plan covering the Next.js FE+BE and the remote HTTPS MCP server. Includes env vars, cost estimates, and step-by-step.

- [ ] **Step 1: Write docs/deployment.md**

````markdown
# Deployment Plan — AI Transformation Navigator

**Goal:** Cheap, easy-to-host deployment of (1) the Next.js app (FE + BE API routes) and (2) a remote, HTTPS MCP server callable by other devices.

**Provider preference:** AWS first; Google Cloud as fallback. Both options below.

---

## 1. Architecture

```
            ┌─────────────────────────────┐
            │  Browser (FE + chat UI)      │
            │  Web Speech API STT/TTS      │
            └──────────────┬──────────────┘
                           │ HTTPS
            ┌──────────────▼──────────────┐
            │  Next.js app (FE + /api/*)   │  ← AWS Amplify Hosting
            │  /api/chat  /api/roadmap     │     (or Vercel / Cloud Run)
            │  /api/upload /api/demo       │
            └──────┬───────────────┬───────┘
                   │               │
        LLM API    │               │ (optional)
   (Anthropic/     │               ▼
    OpenAI/        │     ┌──────────────────────┐
    DeepSeek)      │     │  MCP server (HTTPS)   │ ← AWS App Runner
                   │     │  POST /mcp (JSON-RPC) │   (or Cloud Run)
                   │     └──────────┬───────────┘
                   │                │ JSON-RPC
                   │                ▼
                   │     Voice device / external
                   │     MCP client (any device)
                   ▼
              LLM provider (same keys)
```

The Next.js app hosts the web experience and the assessment API routes. The MCP server is a **separate, standalone process** exposing the same assessment tools over HTTPS so voice devices and other clients can call it remotely.

---

## 2. Environment variables

### Next.js app
| Var | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | one of the three | Enables the live assessment flow (Anthropic provider) |
| `OPENAI_API_KEY` | one of the three | OpenAI provider |
| `DEEPSEEK_API_KEY` | one of the three | DeepSeek provider |
| `LLM_PROVIDER` | optional | Force `anthropic` / `openai` / `deepseek` (else auto-select by key presence) |
| `LLM_MODEL` | optional | Override the default model for the provider |

### MCP server
All of the above LLM vars, **plus**:
| Var | Required | Purpose |
|---|---|---|
| `MCP_TRANSPORT` | yes (set to `http`) | `http` for remote hosting; `stdio` for local CLI |
| `MCP_PORT` | optional | Defaults to `8080` (App Runner injects `PORT`) |

Set secrets via the hosting provider's secret manager — **never commit `.env.local`**.

---

## 3. AWS deployment (preferred)

### 3a. Next.js app → AWS Amplify Hosting
1. Push the repo to GitHub.
2. AWS Console → Amplify Hosting → connect the repo.
3. Build settings: App root = `.worktrees/ai-navigator-impl` is NOT needed if you promote the worktree to its own repo. **Recommendation: make the worktree its own repo** (`git subtree split` or copy) so Amplify builds from the app root.
4. Build command: `npm run build`. Output directory: `.next` (Amplify detects Next.js automatically).
5. Environment variables: add the LLM keys under App settings → Environment variables.
6. Amplify provisions HTTPS automatically (managed certs, custom domain optional).
7. Cost: free tier covers the first 12 months of build + hosting for low traffic; ~$0.10–$1/mo at hackathon scale.

### 3b. MCP server → AWS App Runner
1. Push the Docker image (Task 14) to Amazon ECR:
   ```bash
   aws ecr create-repository --repository-name ai-navigator-mcp
   docker tag ai-navigator-mcp:latest <acct>.dkr.ecr.<region>.amazonaws.com/ai-navigator-mcp:latest
   docker push <acct>.dkr.ecr.<region>.amazonaws.com/ai-navigator-mcp:latest
   ```
2. App Runner → Create service → source = ECR image.
3. Set env vars: `MCP_TRANSPORT=http`, `MCP_PORT=8080`, plus the LLM keys (as App Runner secrets).
4. Port: 8080. App Runner auto-provisions HTTPS on a public URL.
5. (Optional) Restrict to known callers with an API key header check if you add one to `startMcpHttpServer`.
6. Cost: App Runner has a free tier; at idle it's ~$5–$7/mo per service. Cheapest remote-HTTPS option on AWS.

### 3c. Why not Lambda for MCP?
MCP's Streamable HTTP transport keeps a session; Lambda's request/response model fights that. App Runner (always-on container) is simpler and cheaper at this scale.

---

## 4. Google Cloud fallback

### 4a. Next.js app → Cloud Run
1. Containerize the Next.js app (a `Dockerfile` at app root using `node:20-slim`, `npm run build`, `npm start`).
2. `gcloud run deploy ai-navigator --source . --region us-central1 --allow-unauthenticated`
3. Set LLM env vars via `--set-env-vars` / `--set-secrets`.
4. Cloud Run gives an HTTPS URL automatically.

### 4b. MCP server → Cloud Run
1. Deploy the `infra/mcp/Dockerfile` image:
   ```bash
   gcloud run deploy ai-navigator-mcp --source . --region us-central1 --allow-unauthenticated --port 8080
   ```
2. Set `MCP_TRANSPORT=http`, `MCP_PORT=8080`, and LLM secrets.
3. Cost: Cloud Run bills per-request with a generous free tier; effectively free at hackathon scale.

---

## 5. Cheap-and-easy summary (pick one row)

| Option | FE+BE | MCP (HTTPS) | Est. monthly cost (low traffic) |
|---|---|---|---|
| **AWS (preferred)** | Amplify Hosting | App Runner | ~$5–$8 |
| **GCP fallback** | Cloud Run | Cloud Run | ~$0–$5 |
| **Simplest (single-provider)** | Vercel (free hobby tier) | Render/Fly.io free tier | ~$0 |

Vercel is the absolute cheapest for the Next.js app (free hobby tier), but the user asked for AWS-first, so Amplify + App Runner is the recommended path.

---

## 6. Pre-deploy checklist
- [ ] `npm run build` succeeds locally with production env.
- [ ] `npx vitest run` is green.
- [ ] `.env.local` is gitignored (it is — see `.gitignore`).
- [ ] LLM keys set as managed secrets (not inline env).
- [ ] MCP image builds and answers an `initialize` JSON-RPC over HTTP locally.
- [ ] CORS: if the browser calls the MCP server directly, add CORS headers in `startMcpHttpServer` (the Next.js app does NOT call MCP — it has its own `/api/*` — so CORS is only needed if a browser calls MCP directly, which is not the default architecture).
````

- [ ] **Step 2: Commit**

```bash
git add docs/deployment.md
git commit -m "docs: add AWS-first (GCP fallback) deployment plan for FE+BE+MCP"
```

---

## Phase 6 — Follow-ups Touched by This Work + Final Verification

### Task 16: Fix roadmap overallScore deflation (follow-up I3) + align demo data

**Files:**
- Modify: `src/lib/roadmap/generator.ts`
- Modify: `src/lib/roadmap/__tests__/generator.test.ts`
- Modify: `src/lib/demo/demo-data.ts`

**Why here:** The roadmap generator divides `sum(d.score) / count(dims)` over ALL 7 dims (including unassessed zeros) — the same deflation already fixed in `calculateOverallScore`. Since we're rebuilding scoring, fix this now and use the shared helper. Also align demo data with v2.0 (criterionConfidence, benchmark).

- [ ] **Step 1: Write the failing test**

In `src/lib/roadmap/__tests__/generator.test.ts`, add:

```ts
import { describe, it, expect } from "vitest";
import { parseRoadmapJson } from "../generator";
import { loadFramework } from "../../framework/config";
import type { AssessmentSession } from "../../assessment/types";

const config = loadFramework("v2.0");

describe("parseRoadmapJson overallScore", () => {
  it("uses assessed-dimensions-only overall (no deflation from unassessed dims)", () => {
    // Build a session with only strategy assessed at 4; others 0/unassessed.
    const session: AssessmentSession = {
      id: "s1",
      frameworkVersion: "2.0",
      orgProfile: { name: "Acme", industry: "Retail", size: "mid-market", geography: "", regulatoryEnvironment: [], existingInitiatives: [], constraints: {} },
      dimensions: Object.fromEntries(
        config.dimensions.map((d) => [
          d.id,
          {
            dimensionId: d.id,
            score: d.id === "strategy" ? 4 : 0,
            confidence: d.id === "strategy" ? 0.9 : 0,
            evidence: [],
            gaps: [],
            criterionScores: {},
            criterionConfidence: {},
          },
        ])
      ) as AssessmentSession["dimensions"],
      aiReadiness: { score: 0, components: {} },
      conversationHistory: [],
      documents: [],
      isComplete: false,
      createdAt: 1,
      updatedAt: 1,
    };
    const roadmap = parseRoadmapJson("{}", session, config);
    // Only strategy (4) assessed → overall = 4 (not 4/7 ≈ 0.57).
    expect(roadmap.overallScore).toBeCloseTo(4, 10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/roadmap/__tests__/generator.test.ts`
Expected: FAIL — `overallScore` is `4/7` (deflated).

- [ ] **Step 3: Fix parseRoadmapJson to use calculateOverallScore**

```ts
// src/lib/roadmap/generator.ts — REPLACE the overallScore line in parseRoadmapJson
import { complete } from "../llm/client";
import { calculateOverallScore } from "../assessment/scoring";
import { AssessmentSession } from "../assessment/types";
import { FrameworkConfig } from "../framework/types";
import { Roadmap, RoadmapPhase, RoadmapAction } from "./types";

export function parseRoadmapJson(
  text: string,
  session: AssessmentSession,
  config: FrameworkConfig
): Roadmap {
  const profile = session.orgProfile;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return {
      orgName: profile.name,
      industry: profile.industry,
      overallScore: calculateOverallScore(session.dimensions, config), // FIXED: no deflation
      aiReadinessScore: session.aiReadiness.score,
      phases: (parsed.phases as RoadmapPhase[]) ?? [],
      quickWins: (parsed.quickWins as RoadmapAction[]) ?? [],
      criticalGaps: (parsed.criticalGaps as string[]) ?? [],
      generatedAt: Date.now(),
    };
  } catch {
    return {
      orgName: profile.name,
      industry: profile.industry,
      overallScore: calculateOverallScore(session.dimensions, config),
      aiReadinessScore: session.aiReadiness.score,
      phases: [],
      quickWins: [],
      criticalGaps: [],
      generatedAt: Date.now(),
    };
  }
}
```

(Remove the now-unused `_config` underscore if you renamed it — keep the param name `config` since we now use it. This also resolves follow-up M6 "unused param".)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/roadmap/__tests__/generator.test.ts`
Expected: PASS.

- [ ] **Step 5: Align demo-data.ts with v2.0 types**

In `src/lib/demo/demo-data.ts`, ensure each `DimensionAssessment` in the demo includes `criterionConfidence: {}` (or populated values) and that `frameworkVersion` is `"2.0"`. Read the file first: `sed -n '1,40p' src/lib/demo/demo-data.ts`. Add `criterionConfidence` to each demo dimension object (mirror `criterionScores` keys with confidence 1 for a fully-assessed demo). If the demo asserts version `"v1.0"`, update to `"2.0"`.

- [ ] **Step 6: Run the demo-data + full suite**

Run: `npx vitest run src/lib/demo/ && npx vitest run`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/roadmap/generator.ts src/lib/roadmap/__tests__/generator.test.ts src/lib/demo/demo-data.ts
git commit -m "fix(roadmap): use calculateOverallScore (no deflation); align demo data to v2.0"
```

---

### Task 17: Final verification — typecheck, full test suite, build, manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all green.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; routes `/`, `/assess`, `/report`, `/methodology` all compile.

- [ ] **Step 4: Manual smoke (use the run/verify skill)**

Run `npm run dev`, then verify each requirement:
1. **Req 1 (assessment + methodology):** `/methodology` renders the matrix, scoring explanation, references, why-it-matters. The scorecard updates with confidence-weighted scores during `/assess`.
2. **Req 2 (voice):** In `/assess`, toggle voice mode → text input disappears; speaking auto-sends; TTS replies; listening resumes.
3. **Req 3 (agent-led):** On `/assess` load, the agent sends the opening question without user input.
4. **Deployment:** `docker build -f infra/mcp/Dockerfile .` succeeds; the container answers an HTTP `initialize` JSON-RPC.

- [ ] **Step 5: Commit any verification fixes**

```bash
git add -A && git commit -m "chore: verification fixes from final smoke test"
```

---

## Self-Review

**1. Spec coverage (the 4 user requirements + deployment):**

- **Req 1 — assessment & scoring rebuild + explainer page with references + why-unique.**
  - Framework enriched: Tasks 1–2 (benchmark targets, dependency map, weighting rationale, component weights).
  - Scoring engine rebuilt: Task 3 (confidence-weighted criteria, benchmark delta, dependency gaps) + Task 4 (engine confidence model, org profile + benchmark in delta).
  - Explainer page: Task 12 (DimensionMatrix, ScoringFormula, ReferenceFrameworks with the 15+ frameworks, WhyItMatters covering "how it helps success" + "why unique").
  - Benchmark estimation replaces hardcoded 3.2: Task 5.
  - ✅ Covered.

- **Req 2 — voice: no input box when voice mode on; speech auto-transcribes + auto-sends.**
  - Continuous STT hook with auto-send: Task 9.
  - VoiceOverlay with no input box: Task 10.
  - ChatPanel toggles voice mode and hides ChatInput: Task 11.
  - ✅ Covered.

- **Req 3 — agent guides; user doesn't speak first.**
  - Agent-led kickoff: Tasks 6 (prompt), 7 (`runAgentKickoff`), 8 (API + hook wiring), 11 (auto-fire on mount).
  - ✅ Covered.

- **Req 4 — follow-ups.** User said skip the follow-ups file, **but** add a deployment plan. The deployment plan is Tasks 13–15. Two follow-ups that fell naturally out of the rebuild were also fixed: I3 (roadmap deflation, Task 16) and M5/M6 (hardcoded 3.2 → Task 5; unused param → Task 16). No other follow-ups are implemented, per the user's "skip it for now."
  - ✅ Covered (deployment plan + incidental fixes).

- **Deployment (FE + BE + remote HTTPS MCP).**
  - MCP HTTP transport: Task 13. Container: Task 14. Plan doc: Task 15 (AWS Amplify + App Runner preferred, GCP Cloud Run fallback).
  - ✅ Covered.

**2. Placeholder scan:** Searched the plan for "TBD", "TODO", "implement later", "add error handling", "similar to Task N", "fill in details". None present as instructions. The only "verify against installed SDK version" notes (Tasks 13, 17) are legitimate because the MCP SDK's HTTP transport API varies by version and the implementer must confirm the exact signature against `node_modules` — this is a real verification step, not a placeholder, and the plan gives the canonical shape plus a fallback. No placeholder violations.

**3. Type consistency:**
- `criterionConfidence: Record<string, number>` — added in Task 4 to `DimensionAssessment`; used in Task 3 (scoring) and Task 4 (engine). Consistent.
- `AssessmentDelta` gains `orgProfile`, `frameworkVersion`, `benchmark` in Task 4; consumed by OverviewTab (Task 5) and the methodology/report. Consistent.
- `Evidence.strength`/`weight` — added Task 4, used Task 3 (confidence) and Task 4 (criterion confidence). Consistent.
- `runAgentKickoff(engine)` — defined Task 7, consumed Task 8. Signature `(): Promise<AgentResponse>`. Consistent.
- `useContinuousVoice({ onTranscript, onAssistantSpeaking })` — defined Task 9, consumed Task 10 (VoiceOverlay) with matching props. Returns `{ isListening, isSpeaking, interimTranscript, start, stop, speak, stopSpeaking, isSupported }`. Consistent.
- `startAssessment()` on `useChat` — added Task 8, consumed Task 11. Consistent.
- `executeTool(name, input, engine)` — added Task 7, also used by Task 5's benchmark wiring (estimate_benchmark case). Consistent (Task 5's agent.ts edit references `estimateIndustryBenchmark` import; Task 7's `executeTool` also references it — both use the same static import at the top of agent.ts).
- `calculateBenchmarkDelta(score, benchmarkTarget?)` — Task 3 signature `(number, number | undefined)`. Task 4 calls it with `dimAssessment.criterionScores[c.id]` (number) and `c.benchmarkTarget` (number | undefined). Consistent.
- `checkDependencyGaps(dimensions, config)` — Task 3 returns `DependencyGap[]`. Not yet consumed by roadmap generation in this plan (it's available for the roadmap prompt; the plan does not wire it in to avoid scope creep, but the tool exists and is tested). Acceptable — the dependency map is already surfaced to the agent via the system prompt (Task 6) and the v2.json `dependsOn` data.

**4. Order dependencies / risks:**
- Task 3's test needs `criterionConfidence` on the type — the plan notes to do Task 4 Step 1 (type additions) before Task 3 Step 4 verification. An implementer doing tasks strictly in order will hit this; the note makes it explicit. Alternatively, Task 3 and Task 4 could be merged, but keeping them separate gives cleaner commits and test cycles. The plan flags the ordering.
- jsdom env change (Task 9) could affect existing node-env tests — flagged in Task 9 Step 5. Pure-logic tests are unaffected; the implementer should investigate any failures.
- MCP HTTP transport API (Task 13) varies by SDK version — flagged with a verify step and fallback.
- The `@modelcontextprotocol/sdk@^1.29` Streamable HTTP API: the plan provides the documented standalone-server shape and instructs verification against the installed version. This is the one area with genuine external-API uncertainty; the plan handles it by making verification an explicit step rather than guessing.

No gaps found. Plan is complete.
