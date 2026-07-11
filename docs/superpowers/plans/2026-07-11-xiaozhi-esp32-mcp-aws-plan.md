# Xiaozhi ESP32 MCP + AWS Implementation Plan

> **Execution gate:** This plan is intentionally not executed yet. Confirm the decisions at the end of the companion specification before starting implementation.

**Goal:** Make Xiaozhi ESP32 a reliable voice interface for full and seeded-demo assessments, backed by the same durable scoring/session model as the web UI, then deploy it safely on AWS.

**Companion specification:** `docs/superpowers/specs/2026-07-11-xiaozhi-esp32-mcp-assessment-design.md`

**Character/config guide:** `docs/xiaozhi-esp32-agent-prompt-and-settings.md`

**Confirmed context:** The device character is hosted by Agora MyBot, which is expected to manage audio, STT, dialogue, and TTS. App Runner is unavailable.

**Recommended first deployment:** One AWS Lightsail Container Service containing a public gateway, Next.js 16 web container, MCP container, and an optional Agora/Xiaozhi bridge only if MyBot does not accept Streamable HTTP directly. Use DynamoDB for shared durable sessions. Promote the same images to ECS Express Mode/Fargate later if production scaling, stronger IAM, or richer observability is needed.

## Phase 0 — Freeze contracts and establish a green baseline

### Task 0.1: Confirm deployment/integration choices

- [x] Confirm hosted voice backend: Agora MyBot manages the character/device voice path.
- [x] Confirm App Runner is unavailable.
- [ ] Inspect/export the authenticated Agora MyBot MCP/tool configuration and record whether it accepts Streamable HTTP, WSS MCP, or webhook tools.
- [ ] Confirm production authentication scope: single demo device vs multi-device/multi-tenant.
- [ ] Confirm report-link and document-retention policy.
- [ ] Record decisions in the companion specification; do not proceed with unstated security assumptions.

### Task 0.2: Add a dedicated MCP build configuration

**Files:**

- Create `tsconfig.mcp.json`.
- Update `package.json` `build:mcp`.
- Update `infra/mcp/Dockerfile` if the output/runtime format changes.

**Steps:**

- [ ] Reproduce the current `pdf-parse/worker` package-export failure.
- [ ] Configure NodeNext/ESM or an explicit server bundler compatible with `pdf-parse`, the MCP SDK, and JSON imports.
- [ ] Keep browser-only modules out of the MCP graph.
- [ ] Run the built artifact, not only TypeScript checking.
- [ ] Add a clean-build test in CI.

**Acceptance:** `npm run build:mcp` succeeds from a clean install and `node dist/mcp/cli.js` starts.

### Task 0.3: Add protocol-level smoke tests

**Files:**

- Add MCP server/transport integration tests under `src/mcp/__tests__/`.
- Add a reusable test client/helper.

**Steps:**

- [ ] Test stdio `initialize`, `tools/list`, and one non-LLM tool call.
- [ ] Start HTTP transport on an ephemeral port and test initialize/list/call.
- [ ] Assert malformed JSON, unsupported methods, and missing auth are handled predictably.
- [ ] Add `GET /health` and `GET /ready` behavior to the test contract.

## Phase 1 — Extract shared durable assessment state

### Task 1.1: Make assessment sessions serializable and restorable

**Files:**

- Update `src/lib/assessment/engine.ts`.
- Update `src/lib/assessment/types.ts`.
- Add engine hydration/serialization tests.

**Steps:**

- [ ] Add an explicit `AssessmentSessionSnapshot` schema and version.
- [ ] Add `AssessmentEngine.fromSnapshot` and `toSnapshot` without exposing mutable internal state.
- [ ] Validate/migrate v1/v2/v3 sessions and normalize legacy gaps.
- [ ] Preserve conversation, documents, evidence, GenAI readiness, timestamps, mode, and demo metadata.
- [ ] Reject corrupt or incompatible snapshots with typed errors.

### Task 1.2: Introduce repository interfaces

**Files:**

- Create `src/lib/assessment/repository.ts`.
- Create `src/lib/assessment/repositories/in-memory.ts`.
- Create `src/lib/assessment/repositories/dynamodb.ts`.

**Contract:**

```ts
interface AssessmentRepository {
  create(record: AssessmentRecord): Promise<void>;
  get(sessionId: string, principal: Principal): Promise<AssessmentRecord | null>;
  save(record: AssessmentRecord, expectedVersion: number): Promise<number>;
  bindDevice(principal: Principal, sessionId: string): Promise<void>;
  getDeviceSession(principal: Principal): Promise<string | null>;
  delete(sessionId: string, principal: Principal): Promise<void>;
}
```

**Steps:**

- [ ] Use conditional DynamoDB writes for optimistic concurrency.
- [ ] Add TTL to demo sessions.
- [ ] Add owner/tenant fields and enforce ownership in repository methods.
- [ ] Unit-test concurrency conflicts and cross-tenant denial.

### Task 1.3: Create a transport-neutral application service

**Files:**

- Create `src/lib/assessment/application-service.ts`.
- Refactor `src/app/api/chat/route.ts`, upload/demo routes, and MCP handlers to use it.
- Retire direct transport access to the process-global engine stores.

**Steps:**

- [ ] Load snapshot → run one serialized turn → save with expected version.
- [ ] Make `turnId` idempotent so reconnect/retry does not double-score evidence.
- [ ] Return compact changed-section metadata alongside the full web delta.
- [ ] Add same-session web/device concurrency tests.

## Phase 2 — Replace the MCP singleton with session-safe handlers

### Task 2.1: Separate tool definitions from handlers

**Files:**

- Refactor `src/mcp/server.ts`.
- Create `src/mcp/handlers.ts` and `src/mcp/context.ts`.

**Steps:**

- [ ] Remove module-global `engine`.
- [ ] Resolve authenticated principal and `sessionId` for every stateful call.
- [ ] Return MCP `isError` results with stable error codes.
- [ ] Bound output sizes and avoid returning raw documents/transcripts by default.

### Task 2.2: Add the high-level Xiaozhi tool surface

**Files:**

- Update `src/mcp/tools.ts`.
- Update `src/mcp/server.ts` registrations.
- Add handler/tool-contract tests.

**Public Xiaozhi tools:**

- [ ] `assessment_list_demos`
- [ ] `assessment_start`
- [ ] `assessment_continue`
- [ ] `assessment_status`
- [ ] `assessment_resume`
- [ ] `assessment_finish`

**Internal/admin tools:**

- [ ] Keep raw `calculate_score`, `search_knowledge`, document reads, and benchmark calls hidden from the Xiaozhi agent, or register them on a separately authenticated MCP server.
- [ ] Add explicit feature flags/allowlists for public tool exposure.

### Task 2.3: Make results TTS-safe

**Steps:**

- [ ] Return `speakableReply` with at most two short sentences and one question.
- [ ] Return `reportUrl` separately; never include it in the text intended for TTS.
- [ ] Return score/progress metadata separately from the spoken answer.
- [ ] Add tests that prohibit JSON blobs, session IDs, raw URLs, stack traces, and secret-like strings in `speakableReply`.

## Phase 3 — Implement full and demo flows

### Task 3.1: Formalize assessment mode in session state

**Files:**

- Update assessment types and session records.
- Update the application service and agent prompt builder.

**Fields:** `mode: full | demo`, `demoScenarioId`, `demoTargetCriteria`, `demoAnsweredCriteria`, `reportReady`, `completionStatus`.

### Task 3.2: Connect existing demo scenarios to the application service

**Files:**

- Refactor `src/lib/demo/scenarios.ts` into data-only scenario definitions plus a server-side seeder.
- Reuse seeding from both `/api/demo/seed` and `assessment_start(mode=demo)`.

**Steps:**

- [ ] Preserve source labels identifying seeded demo evidence.
- [ ] Define 3–5 remaining target questions per scenario.
- [ ] Ensure every scenario includes GenAI/agentic evidence and at least one meaningful unresolved area.
- [ ] Mark report ready after seed; mark demo complete only after target evidence or explicit finish.
- [ ] Test that a few grounded answers update scores and history without duplicating seed data.

### Task 3.3: Full-assessment voice pacing

- [ ] Ask one question per turn.
- [ ] Use exact framework IDs internally but plain language externally.
- [ ] Prefer high-information questions and transition after evidence sufficiency.
- [ ] Include explicit GenAI/agentic probing.
- [ ] Support “status,” “repeat,” “skip,” “finish,” and “resume later” intents.

## Phase 4 — Add Xiaozhi transport bridge

### Task 4.1: Test direct Agora MyBot attachment first

**Steps:**

- [ ] Inspect the authenticated MyBot tool/MCP settings.
- [ ] If a Streamable HTTP URL and headers are supported, register `https://<deployment>/mcp` directly and skip the bridge.
- [ ] If a webhook/function API is supported, implement a thin authenticated adapter over `AssessmentApplicationService`.
- [ ] Only proceed to the WebSocket bridge path if Agora supplies a Xiaozhi-style WSS MCP endpoint.

### Task 4.2: Prove the optional bridge locally

**Files:**

- Add a sample `infra/xiaozhi/mcp_config.example.json` without tokens.
- Add a local bridge runbook.

**Steps:**

- [ ] Obtain the agent-specific Xiaozhi `wss://.../mcp/?token=...` endpoint.
- [ ] Configure official `mcp_pipe` with the local/AWS Streamable HTTP MCP URL.
- [ ] Confirm initialize and tool discovery in the Xiaozhi console.
- [ ] Confirm the character prompt selects `assessment_start` and `assessment_continue` correctly.
- [ ] Run a real ESP32 microphone → ASR → MCP → TTS round trip.

### Task 4.3: Package the bridge worker if required

Choose after the local proof:

- **Preferred initial implementation:** official `mcp_pipe` in a dedicated small container, configured with one Streamable HTTP upstream.
- **Later option:** native Node WebSocket adapter after the protocol behavior is captured by integration tests.

**Steps:**

- [ ] Add exponential reconnection, jitter, ping/health state, and clean shutdown.
- [ ] Expose a health endpoint for AWS orchestration.
- [ ] Load Xiaozhi endpoint/token and MCP service credential from Secrets Manager.
- [ ] Ensure exactly one active connector per Xiaozhi agent endpoint; do not auto-scale duplicate workers.

## Phase 5 — Server-side reports and history

### Task 5.1: Make reports repository-backed

**Files:**

- Update report routes/pages to load server-side sessions by authorized token/session.
- Keep browser localStorage as a cache, not the source of truth.

**Steps:**

- [ ] Generate read-only signed report tokens with expiry and scope.
- [ ] Add `/report/device?t=...` or equivalent server route.
- [ ] Show company, timestamp, source/device, summary, highlights, evidence, GenAI readiness, and partial/complete status.
- [ ] Avoid exposing the raw DynamoDB key or bearer credential.

### Task 5.2: Device-friendly report delivery

- [ ] Tool returns `reportUrl` as metadata.
- [ ] If the ESP32 has a screen, optionally expose a safe QR-display action through Xiaozhi device tools.
- [ ] Otherwise let the companion web console/history retrieve the device-bound session.

## Phase 6 — Security, reliability, and observability

### Task 6.1: Protect MCP and paid-provider usage

- [ ] Bearer authentication before MCP dispatch.
- [ ] Per-principal session ownership checks.
- [ ] Rate limits and daily LLM/document quotas.
- [ ] Maximum transcript/document sizes and provider timeouts.
- [ ] Secret redaction and structured audit events.

### Task 6.2: Operational instrumentation

- [ ] Correlation fields: principal/device, session, turn, transport request.
- [ ] Metrics: active bridge, MCP calls, tool latency, LLM latency, score updates, conflicts, provider errors, report generation.
- [ ] CloudWatch alarms for bridge disconnected, error rate, latency, and DynamoDB throttling.
- [ ] `/health` checks process liveness; `/ready` checks repository/config and bridge state where applicable.

### Task 6.3: End-to-end test matrix

- [ ] Full mode: 2–3 turns, restart, resume, continue.
- [ ] All three demo modes: seed, answer target questions, score changes, finish/report.
- [ ] GenAI evidence updates GenAI readiness.
- [ ] Two device sessions in parallel without crossover.
- [ ] Duplicate `turnId` is idempotent.
- [ ] Unauthorized session/report access fails.
- [ ] Bridge reconnect does not lose or duplicate the turn.
- [ ] Web and device alternating turns preserve one context.

## Phase 7 — Easy AWS deployment

### Task 7.1: Use Lightsail Container Service for the first deployment

- [ ] Do not assume Amplify supports Next.js 16; its July 2026 SSR documentation lists support through Next.js 15.
- [x] Do not select App Runner; it is unavailable for this deployment.
- [ ] Create one Lightsail Container Service deployment with up to four containers:
  - `gateway`: public endpoint and `/`/`/mcp` routing.
  - `web`: Next.js standalone server on port 3000.
  - `mcp`: authenticated Streamable HTTP server on port 8080.
  - `bridge`: optional; include only if Agora requires outbound WSS MCP.
- [ ] Configure the public gateway health path and use the Lightsail-managed HTTPS domain initially.
- [ ] Use same-deployment `localhost` networking between containers.
- [ ] Keep ECS Express Mode/Fargate as the scale-up path after the hardware demo.

### Task 7.2: Provision minimal shared AWS resources

- [ ] Push private local images directly to Lightsail Container Service for the first deployment; add ECR when moving to ECS/CI.
- [ ] DynamoDB session/binding tables with encryption, PITR, TTL, and least-privilege IAM.
- [ ] Optional encrypted S3 document bucket with lifecycle deletion.
- [ ] Store runtime credentials using the safest mechanism supported by the chosen Lightsail workflow; do not commit them. Move to Secrets Manager plus task roles when promoting to ECS.
- [ ] Use Lightsail container logs initially; define CloudWatch application metrics before production.
- [ ] Use the default Lightsail HTTPS domain first; add a Lightsail certificate/custom domain after validation.

### Task 7.3: Deploy the Lightsail containers

- [ ] Web: Next.js standalone image, Node 20/22, HTTPS endpoint.
- [ ] MCP: authenticated Streamable HTTP `/mcp`, `/health`, `/ready`.
- [ ] Bridge: omit when Agora calls Streamable HTTP directly; otherwise run one outbound WSS connector.
- [ ] Set `APP_BASE_URL`, DynamoDB/S3 resource names, and secret references.
- [ ] Use deployment health checks and rolling rollback.

### Task 7.4: Production verification

- [ ] Run standard MCP initialize/list/call against the deployed endpoint.
- [ ] Confirm Xiaozhi console shows the expected six tools only.
- [ ] Complete one full and each demo scenario through real hardware.
- [ ] Open report URLs in a clean browser.
- [ ] Restart/roll the MCP task and verify session resume.
- [ ] Review CloudWatch logs for secrets/PII before the public demo.

## Deliverables

- Green MCP build and transport test suite.
- Shared durable repository and application service.
- Session-safe voice-first MCP tools.
- Full and three seeded demo modes.
- Xiaozhi bridge container/runbook.
- Repository-backed signed reports.
- AWS IaC/deployment configuration and operational runbook.
- Final documentation updates to README, project information, and deployment docs.

## Stop/go gates

1. **After Phase 0:** build and protocol baseline green.
2. **After Phase 2:** two simulated clients isolated; security contract reviewed.
3. **After Phase 4.1:** Agora MyBot direct/adapter transport is known and a real hardware round trip works locally.
4. **Before AWS spend:** confirm architecture/cost and AWS account service eligibility.
5. **Before public demo:** security, concurrency, restart, and report-link acceptance criteria green.
