# Limitations and Future Work

## Current demo limitations

- **Single-person assessment access:** session IDs act as demo access links. There are no accounts, roles, organisations, or participant permissions.
- **No database:** GCS JSON objects are durable shared storage, but not a transactional assessment database or queryable enterprise history store.
- **No public MCP authentication:** anyone with the endpoint can call the demo MCP service. Add bearer authentication, ownership checks, quotas, and rate limits before broader use.
- **No agent tracing or observability:** there is no end-to-end trace of ASR, tool calls, LLM latency, scoring, TTS, retries, or cost.
- **Limited concurrency control:** generation-match writes prevent silent overwrites, but the system has no turn queue, idempotency key enforcement, or collaboration model.
- **No subcategory or company-specific assessment profile:** the framework is cross-industry. It does not yet adapt questions, criteria, evidence requirements, or benchmarks to a sector, country, company strategy, or regulatory regime.
- **Estimated benchmarks:** targets are framework guidance, not a calibrated peer dataset.
- **Document limits:** PDF/DOCX only, 10 MB maximum; scanned/image-only and password-protected PDFs are unsupported.
- **Voice limits:** RTC tokens expire after one hour; microphone/device selection and long-session renewal are limited.
- **No audit/certification claim:** results are advisory and must be reviewed by people with organisational and domain expertise.

## Required validation

Before relying on the framework for material decisions, validate it with participating companies and independent transformation, data, AI-risk, security, and industry experts. Test inter-rater consistency, whether evidence thresholds are practical, whether weights reflect outcomes, and whether recommendations improve implementation decisions.

## Priority next work

1. Add authentication, tenant/session ownership, signed report links, API keys for MCP, and rate/spend limits.
2. Replace GCS-only session objects with a database-backed repository, indexed history, durable document storage, and optimistic turn/idempotency controls.
3. Add structured tracing, audit logs, operational metrics, alerts, and cost/latency dashboards across MyBot, MCP, LLM, and Agora.
4. Add end-to-end tests for web ↔ MCP alternation, demos, reconnect/resume, document processing, and Cloud Run deployment.
5. Add sector, geography, company-size, regulatory, and strategic-priority overlays with explainable question selection.
6. Build an expert-reviewed benchmark dataset and validate scoring weights against real transformation outcomes.
7. Add continuous-improvement assessments: periodic re-checks, evidence refresh, progress against roadmap actions, framework version comparisons, and new AI capability modules as the field evolves.
8. Improve voice experience with token renewal, device management, streamed agent responses, multilingual support, and accessibility testing.
