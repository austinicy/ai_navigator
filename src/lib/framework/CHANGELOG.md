# Framework Changelog

## v3.0 (2026-07-11)
- Added `GenAI & Agentic Systems` as a cross-cutting eighth assessment section.
- Kept the seven core dimensions in the Digital Maturity aggregate; GenAI is
  excluded from that aggregate and reported as a separate 0–100 readiness score.
- Added seven GenAI capability criteria spanning value, model platforms, RAG and
  knowledge, GenAIOps/evaluation, security and safety, workforce oversight, and
  agent identity/tool controls.
- Added a structured primary-source ledger with direct NIST, ISO, AWS, Microsoft,
  Google Cloud, IMDA, OWASP, MIT CISR, and McKinsey publications.
- Added `targetLevel` to distinguish recommended capability targets from
  unsupported empirical industry benchmarks.
- Preserved v1.0 and v2.0 loading for historical sessions and reports.

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
