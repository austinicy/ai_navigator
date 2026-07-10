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
        <p><strong className="text-foreground">7. Dependency map.</strong> 12 cross-dimension dependency edges (data → AI → MLOps → governance, cloud → data, etc.) sequence the roadmap so you never scale AI before the foundations are solid.</p>
      </div>
    </section>
  );
}
