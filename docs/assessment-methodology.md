# Assessment Methodology and Score Breakdown

## Scope

The framework uses a five-level maturity scale:

1. Ad Hoc
2. Emerging
3. Defined
4. Advanced
5. Leading

It assesses seven core dimensions: Strategy & Leadership, Technology Infrastructure, Data & AI Capabilities, AI Governance & Ethics, Culture & Talent, Operations & Processes, and Customer Experience.

It also assesses seven GenAI/agentic capabilities: value portfolio, model/platform strategy, knowledge/RAG readiness, GenAIOps/evaluation, security/safety, workforce oversight, and agent identity/tool controls.

## Evidence first

Each finding has a source (`conversation` or `document`), dimension, optional criterion, strength, and optional weight. The agent must use concrete user statements or extracted document signals. Unsupported criteria remain unscored.

Conversation evidence normally has lower strength than document evidence. Confidence grows with criterion coverage and cumulative evidence strength; it is not a claim that an untested capability is mature.

## Dimension scoring

For scored criteria, the engine calculates a confidence-weighted average:

```text
dimension score = Σ(criterion score × criterion weight × criterion confidence)
                  ─────────────────────────────────────────────────────────
                         Σ(criterion weight × criterion confidence)
```

An unscored or zero-confidence criterion does not contribute. A dimension becomes complete only when its confidence meets the framework threshold (currently 0.70).

## Digital Maturity

Digital Maturity is a weighted average of completed core dimensions. The GenAI module is excluded from this aggregate to avoid double-counting foundational capabilities already represented in the seven core dimensions.

## AI Readiness and GenAI & Agentic Readiness

Both are reported as 0–100 component-weighted scores. Relevant criterion scores are normalized from the 1–5 scale, weighted by criterion confidence and criterion weight, then averaged across assessed components. Components with no grounded criteria remain `null`, not zero.

This distinction matters: a low score means grounded evidence indicates low maturity; a missing score means there is not yet enough evidence.

## Dependencies and benchmarks

The framework contains dependency links, such as data quality before enterprise AI, and evaluation/security before autonomous actions. Roadmap sequencing surfaces unmet dependencies.

Historical v2 criteria include estimated benchmark targets. Framework v3 adds recommended target levels for GenAI capabilities; these targets are guidance, not empirical industry rankings.

## Interpretation

Scores are decision-support signals, not certification, audit evidence, legal advice, or a substitute for expert review. Read score, confidence, evidence, and gaps together. See [framework v3](framework-v3.md) for source provenance and [limitations](limitations-and-future-work.md) for validation needs.
