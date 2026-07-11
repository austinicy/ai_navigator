// src/components/methodology/DependencyMap.tsx
"use client";

import { useMemo, useState } from "react";
import { loadFramework } from "@/lib/framework/config";

// Ring layout positions for 7 dimensions (percentages of the viewBox).
const ORDER = ["strategy", "technology", "data_ai", "ai_governance", "culture", "operations", "customer", "genai"];
const POSITIONS: Record<string, { x: number; y: number }> = {
  strategy: { x: 50, y: 8 },
  technology: { x: 88, y: 30 },
  data_ai: { x: 92, y: 72 },
  ai_governance: { x: 66, y: 95 },
  culture: { x: 34, y: 95 },
  operations: { x: 8, y: 72 },
  customer: { x: 12, y: 30 },
  genai: { x: 50, y: 52 },
};

export function DependencyMap() {
  const config = useMemo(() => loadFramework(), []);
  const [active, setActive] = useState<string | null>(null);

  // Build edges from criterion dependsOn: "dim.crit" → "dim.crit"
  // Skip self-loops (intra-dimension deps) and dedupe stacked edges so only
  // unique cross-dimension dependencies are visualized.
  const edges = useMemo(() => {
    const list: { from: string; to: string }[] = [];
    const seen = new Set<string>();
    for (const dim of config.dimensions) {
      for (const c of dim.criteria) {
        if (!c.dependsOn) continue;
        for (const dep of c.dependsOn) {
          const fromDim = dep.split(".")[0];
          if (fromDim === dim.id) continue; // skip self-loops (intra-dimension)
          const key = `${fromDim}:${dim.id}`;
          if (seen.has(key)) continue; // skip duplicate edges
          seen.add(key);
          list.push({ from: fromDim, to: dim.id });
        }
      }
    }
    return list;
  }, [config]);

  const isActive = (dimId: string) =>
    active === dimId || edges.some((e) => (e.from === dimId || e.to === dimId) && (active === e.from || active === e.to));

  return (
    <section className="py-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Dependency map</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {edges.length} cross-dimension dependencies sequence the roadmap. Hover a node to see its connections.
        </p>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[.9fr_1.1fr]">
        <div className="border-b border-border bg-muted/10 p-5 lg:border-b-0 lg:border-r">
        <svg viewBox="0 0 100 100" className="mx-auto h-auto w-full max-w-[440px]" role="img" aria-label="Dimension dependency map">
          {/* Edges */}
          {edges.map((e, i) => {
            const a = POSITIONS[e.from];
            const b = POSITIONS[e.to];
            const highlight = active && (active === e.from || active === e.to);
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={highlight ? "var(--accent)" : "var(--border)"}
                strokeWidth={highlight ? 0.8 : 0.4}
                strokeDasharray="2 1.5"
              />
            );
          })}
          {/* Nodes */}
          {ORDER.map((dimId) => {
            const dim = config.dimensions.find((d) => d.id === dimId)!;
            const p = POSITIONS[dimId];
            const on = isActive(dimId);
            return (
              <g
                key={dimId}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${dim.name} dependencies`}
                onMouseEnter={() => setActive(dimId)}
                onFocus={() => setActive(dimId)}
                onClick={() => setActive(dimId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setActive(dimId);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x} cy={p.y} r={on ? 5 : 4}
                  fill={on ? "var(--primary)" : "var(--card)"}
                  stroke="var(--primary)" strokeWidth={0.6}
                />
                <text
                  x={p.x} y={p.y - 6}
                  textAnchor="middle"
                  fontSize={3}
                  fill={on ? "var(--primary)" : "var(--muted-foreground)"}
                  fontWeight={on ? 600 : 400}
                >
                  {dim.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
        </div>
        <div className="flex min-h-[360px] flex-col justify-center p-7 md:p-10">
          {(() => {
            const dim = config.dimensions.find((item) => item.id === active)!;
            const incoming = edges.filter((edge) => edge.to === active).map((edge) => config.dimensions.find((item) => item.id === edge.from)?.name).filter(Boolean);
            const outgoing = edges.filter((edge) => edge.from === active).map((edge) => config.dimensions.find((item) => item.id === edge.to)?.name).filter(Boolean);
            return <>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Selected dimension</span>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{dim.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{dim.weightingRationale}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/50 p-4"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Depends on</span><p className="mt-2 text-sm font-medium text-foreground">{incoming.length ? incoming.join(" · ") : "Foundational starting point"}</p></div>
                <div className="rounded-xl border border-border bg-background/50 p-4"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Unlocks</span><p className="mt-2 text-sm font-medium text-foreground">{outgoing.length ? outgoing.join(" · ") : "Enterprise outcomes"}</p></div>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">Hover, focus, or click a node to inspect its role in roadmap sequencing.</p>
            </>;
          })()}
        </div>
      </div>
    </section>
  );
}
