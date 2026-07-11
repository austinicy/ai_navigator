// src/components/methodology/DimensionMatrix.tsx
"use client";

import { useState } from "react";
import { loadFramework } from "@/lib/framework/config";
import { ChevronDown, Target } from "lucide-react";

export function DimensionMatrix() {
  const config = loadFramework();
  const [open, setOpen] = useState<string | null>(config.dimensions[0]?.id ?? null);
  const totalCriteria = config.dimensions.reduce((n, d) => n + d.criteria.length, 0);

  return (
    <section id="matrix" className="py-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">The assessment matrix</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {config.dimensions.length} dimensions · {totalCriteria} criteria · 5 maturity levels each.
        </p>
      </div>
      <div className="space-y-3">
        {config.dimensions.map((dim) => {
          const isOpen = open === dim.id;
          return (
            <div key={dim.id} className="rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : dim.id)}
                className="flex w-full items-center justify-between p-4 text-left"
                aria-expanded={isOpen}
              >
                <div>
                  <div className="text-base font-semibold text-foreground">{dim.name}</div>
                  {dim.weightingRationale && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dim.weightingRationale}</div>
                  )}
                </div>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="grid gap-3 border-t border-border p-4 md:grid-cols-2">
                  {dim.criteria.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        {(c.targetLevel ?? c.benchmarkTarget) !== undefined && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                            <Target className="size-2.5" /> {c.targetLevel ? "target" : "peer"} L{c.targetLevel ?? c.benchmarkTarget}
                          </span>
                        )}
                      </div>
                      <ol className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                        {Object.values(c.levels).map((lvl, i) => (
                          <li key={i}><span className="text-foreground/70">L{i + 1}:</span> {lvl}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
