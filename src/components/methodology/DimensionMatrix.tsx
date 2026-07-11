// src/components/methodology/DimensionMatrix.tsx
"use client";

import { useState } from "react";
import { loadFramework } from "@/lib/framework/config";
import { ChevronRight, Eye, EyeOff, Target } from "lucide-react";

export function DimensionMatrix() {
  const config = loadFramework();
  const [active, setActive] = useState(config.dimensions[0]?.id ?? "");
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(
    () => new Set()
  );
  const totalCriteria = config.dimensions.reduce((n, d) => n + d.criteria.length, 0);
  const selected = config.dimensions.find((dim) => dim.id === active) ?? config.dimensions[0];
  const allSelectedExpanded = selected.criteria.every((criterion) =>
    expandedCriteria.has(`${selected.id}.${criterion.id}`)
  );

  const toggleAllDetails = () => {
    setExpandedCriteria((current) => {
      const next = new Set(current);
      for (const criterion of selected.criteria) {
        const key = `${selected.id}.${criterion.id}`;
        if (allSelectedExpanded) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  };

  const toggleCriterion = (criterionId: string) => {
    const key = `${selected.id}.${criterionId}`;
    setExpandedCriteria((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section id="matrix" className="py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Assessment architecture</span>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">The assessment matrix</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {config.dimensions.length} dimensions · {totalCriteria} criteria · 5 maturity levels each.
        </p>
        </div>
        <button onClick={toggleAllDetails} className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-primary/40" aria-pressed={allSelectedExpanded}>
          {allSelectedExpanded ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {allSelectedExpanded ? "Collapse all details" : "Expand all details"}
        </button>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[.8fr_1.2fr]">
        <div className="relative min-h-[420px] overflow-hidden border-b border-border bg-muted/10 p-6 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_62%)]" />
          <div className="relative mx-auto aspect-square max-w-[390px]">
            <div className="absolute inset-[23%] flex flex-col items-center justify-center rounded-full border border-primary/30 bg-background/80 text-center shadow-[0_0_40px_color-mix(in_oklab,var(--primary)_15%,transparent)]">
              <span className="text-4xl font-semibold text-primary">{totalCriteria}</span><span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">signals of maturity</span>
            </div>
            {config.dimensions.map((dim, index) => {
              const angle = (index / config.dimensions.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 42;
              const y = 50 + Math.sin(angle) * 42;
              const isActive = dim.id === active;
              return <button key={dim.id} onClick={() => setActive(dim.id)} className={`absolute w-[108px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-2 py-2 text-center text-[10px] font-semibold leading-tight transition ${isActive ? "scale-105 border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`} style={{ left: `${x}%`, top: `${y}%` }} aria-pressed={isActive}>{dim.name}</button>;
            })}
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><span className="font-mono text-xs text-primary">DIMENSION {String(config.dimensions.indexOf(selected) + 1).padStart(2, "0")}</span><h3 className="mt-1 text-2xl font-semibold text-foreground">{selected.name}</h3></div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{selected.criteria.length} criteria</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{selected.weightingRationale}</p>
          <div className="mt-6 space-y-3">
            {selected.criteria.map((c, index) => (
              <div key={c.id} className="rounded-xl border border-border/70 bg-muted/15 p-4 transition hover:border-primary/30">
                    <button
                      type="button"
                      onClick={() => toggleCriterion(c.id)}
                      className="flex w-full items-center justify-between gap-2 text-left"
                      aria-expanded={expandedCriteria.has(`${selected.id}.${c.id}`)}
                      aria-controls={`criterion-detail-${selected.id}-${c.id}`}
                    >
                      <div className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 font-mono text-[10px] text-primary">{index + 1}</span><span className="text-sm font-medium text-foreground">{c.name}</span></div>
                      <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedCriteria.has(`${selected.id}.${c.id}`) ? "rotate-90" : ""}`} />
                    </button>
                    {expandedCriteria.has(`${selected.id}.${c.id}`) && <div id={`criterion-detail-${selected.id}-${c.id}`} className="mt-3 border-t border-border/60 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        {(c.targetLevel ?? c.benchmarkTarget) !== undefined && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                            <Target className="size-2.5" /> {c.targetLevel ? "target" : "peer"} L{c.targetLevel ?? c.benchmarkTarget}
                          </span>
                        )}
                      </div>
                      <ol className="mt-3 grid gap-1.5 text-[11px] text-muted-foreground">
                        {Object.values(c.levels).map((lvl, i) => (
                          <li key={i} className="grid grid-cols-[28px_1fr] gap-2"><span className="font-mono text-primary">L{i + 1}</span><span>{lvl}</span></li>
                        ))}
                      </ol>
                    </div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
