// src/components/landing/StatTiles.tsx
"use client";

import { Reveal } from "./Reveal";

const STATS = [
  { value: "7", label: "Maturity dimensions", sub: "30 criteria, 5 levels each" },
  { value: "15 min", label: "Average assessment", sub: "replaces weeks of surveys" },
  { value: "11", label: "Reference frameworks", sub: "synthesized, not invented" },
  { value: "0–100", label: "AI Readiness score", sub: "composite, cross-cutting" },
];

export function StatTiles() {
  return (
    <section className="py-16 md:py-20">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm font-medium text-foreground">{stat.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
