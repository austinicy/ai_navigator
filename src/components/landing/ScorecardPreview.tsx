// src/components/landing/ScorecardPreview.tsx
"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Reveal } from "./Reveal";

const SAMPLE = [
  { dim: "Strategy", score: 3.4 },
  { dim: "Technology", score: 3.0 },
  { dim: "Data & AI", score: 2.6 },
  { dim: "Governance", score: 2.2 },
  { dim: "Culture", score: 3.1 },
  { dim: "Operations", score: 2.8 },
  { dim: "Customer", score: 2.9 },
];

export function ScorecardPreview() {
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">Live scorecard</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            The scorecard builds as you talk
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dimensions fill in real time as the agent gathers evidence. Every score is confidence-weighted
            and traceable to what you said or uploaded — no black-box ratings.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> Digital Maturity Score (1–5, weighted)</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" /> AI Readiness Score (0–100, composite)</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> Benchmark delta vs. industry peers</li>
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Maturity snapshot</span>
              <span className="text-xs text-muted-foreground">sample</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={SAMPLE}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
