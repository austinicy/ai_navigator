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
