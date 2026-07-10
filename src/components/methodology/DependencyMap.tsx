// src/components/methodology/DependencyMap.tsx
"use client";

import { useMemo, useState } from "react";
import { loadFramework } from "@/lib/framework/config";

// Ring layout positions for 7 dimensions (percentages of the viewBox).
const ORDER = ["strategy", "technology", "data_ai", "ai_governance", "culture", "operations", "customer"];
const POSITIONS: Record<string, { x: number; y: number }> = {
  strategy: { x: 50, y: 8 },
  technology: { x: 88, y: 30 },
  data_ai: { x: 92, y: 72 },
  ai_governance: { x: 66, y: 95 },
  culture: { x: 34, y: 95 },
  operations: { x: 8, y: 72 },
  customer: { x: 12, y: 30 },
};

export function DependencyMap() {
  const config = useMemo(() => loadFramework("v2.0"), []);
  const [active, setActive] = useState<string | null>(null);

  // Build edges from criterion dependsOn: "dim.crit" → "dim.crit"
  const edges = useMemo(() => {
    const list: { from: string; to: string }[] = [];
    for (const dim of config.dimensions) {
      for (const c of dim.criteria) {
        if (!c.dependsOn) continue;
        for (const dep of c.dependsOn) {
          const fromDim = dep.split(".")[0];
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
      <div className="rounded-2xl border border-border bg-card p-4">
        <svg viewBox="0 0 100 100" className="h-auto w-full" role="img" aria-label="Dimension dependency map">
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
                onMouseEnter={() => setActive(dimId)}
                onMouseLeave={() => setActive(null)}
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
    </section>
  );
}
