// src/components/methodology/ScoreSimulator.tsx
"use client";

import { useMemo, useState } from "react";
import { loadFramework } from "@/lib/framework/config";
import {
  calculateDimensionScore,
  calculateAIReadinessScore,
  getDimensionLevel,
} from "@/lib/assessment/scoring";
import type { DimensionAssessment } from "@/lib/assessment/types";

export function ScoreSimulator() {
  const config = useMemo(() => loadFramework("v2.0"), []);
  const strategy = config.dimensions.find((d) => d.id === "strategy")!;
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(strategy.criteria.map((c) => [c.id, 3]))
  );

  // For the simulator, give every scored criterion full confidence (1.0) so the
  // slider directly drives the score. The real engine derives confidence from
  // evidence; here we isolate the scoring math.
  const dimAssessment: DimensionAssessment = {
    dimensionId: "strategy",
    score: 0,
    confidence: 1,
    evidence: [],
    gaps: [],
    criterionScores: scores,
    criterionConfidence: Object.fromEntries(Object.keys(scores).map((k) => [k, 1])),
  };

  const dimScore = calculateDimensionScore(dimAssessment, config);
  const level = getDimensionLevel(dimScore);

  // Build a dimensions map where only strategy has scores, for the AI-readiness calc.
  const allDims = useMemo(() => {
    const map: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) {
      map[d.id] = d.id === "strategy"
        ? dimAssessment
        : { dimensionId: d.id, score: 0, confidence: 0, evidence: [], gaps: [], criterionScores: {}, criterionConfidence: {} };
    }
    return map;
  }, [config, scores]);
  const ai = calculateAIReadinessScore(allDims, config);
  const aiStrategy = ai.components.ai_strategy ?? 0;

  return (
    <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Try it: score Strategy &amp; Leadership</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag each criterion&apos;s level (1–5). The dimension score and AI-readiness recompute live,
          using the same functions as the real assessment.
        </p>
        <div className="mt-5 space-y-4">
          {strategy.criteria.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between">
                <label htmlFor={c.id} className="text-sm font-medium text-foreground">{c.name}</label>
                <span className="text-sm font-mono text-primary">{scores[c.id].toFixed(1)}</span>
              </div>
              <input
                id={c.id}
                aria-label={c.name}
                type="range"
                min={1}
                max={5}
                step={1}
                value={scores[c.id]}
                onChange={(e) => setScores((s) => ({ ...s, [c.id]: Number(e.target.value) }))}
                className="mt-2 w-full accent-primary"
                style={{ accentColor: "var(--primary)" }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-4 rounded-xl bg-muted/30 p-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Dimension score</div>
          <div data-testid="dim-score" className="text-4xl font-bold text-primary">{dimScore.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Level {level.level} · {level.name}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">AI Strategy readiness</div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-accent transition-all" style={{ width: `${aiStrategy}%` }} />
          </div>
          <div className="mt-1 text-sm font-mono text-accent">{aiStrategy}/100</div>
        </div>
      </div>
    </div>
  );
}
