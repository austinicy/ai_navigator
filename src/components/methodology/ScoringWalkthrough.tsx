// src/components/methodology/ScoringWalkthrough.tsx
"use client";

import { Reveal } from "@/components/landing/Reveal";
import { ClipboardCheck, ShieldCheck, Layers, Gauge, Sparkles, TrendingUp, GitBranch } from "lucide-react";

const STEPS = [
  { icon: ClipboardCheck, title: "Criterion score (1–5)", body: "The AI scores each criterion against its 5-level rubric, grounded in evidence from the conversation and uploaded documents." },
  { icon: ShieldCheck, title: "Criterion confidence (0–1)", body: "Confidence grows with the strength and volume of evidence. Document evidence counts more than a passing remark. No evidence → zero weight." },
  { icon: Layers, title: "Dimension score", body: "A confidence-weighted average of its criteria. Partially-probed dimensions reflect only what was actually assessed — never a deflated average." },
  { icon: Gauge, title: "Digital Maturity Score", body: "Weighted average of dimensions assessed to ≥70% confidence, divided by assessed-dimension weights only." },
  { icon: Sparkles, title: "AI Readiness Score (0–100)", body: "Composite of 6 cross-cutting components. Strategy and Data weighted 1.5× as leading indicators. Normalized 1–5 → 0–100." },
  { icon: TrendingUp, title: "Benchmark delta", body: "Every criterion has an industry-typical target. The report shows where you lead or lag peers, adjusted for org size and regulation." },
  { icon: GitBranch, title: "Dependency map", body: "12 cross-dimension edges sequence the roadmap so you never scale AI before the foundations are solid." },
];

export function ScoringWalkthrough() {
  return (
    <section id="scoring" className="py-16">
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">How scoring works</h2>
        <p className="mt-1 text-sm text-muted-foreground">Seven steps from evidence to roadmap. Scroll to follow.</p>
      </Reveal>
      <div className="relative space-y-3 border-l border-border pl-6">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.04}>
            <div className="relative">
              <span className="absolute -left-[31px] top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card text-primary">
                <step.icon className="size-3.5" />
              </span>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
