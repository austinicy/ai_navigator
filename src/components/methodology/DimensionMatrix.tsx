// src/components/methodology/DimensionMatrix.tsx
import { loadFramework } from "@/lib/framework/config";

export function DimensionMatrix() {
  const config = loadFramework("v2.0");
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold gradient-text">The Assessment Matrix</h2>
      <p className="text-sm text-muted-foreground">
        {config.dimensions.length} dimensions · {config.dimensions.reduce((n, d) => n + d.criteria.length, 0)} criteria · 5 maturity levels each.
      </p>
      <div className="space-y-4">
        {config.dimensions.map((dim) => (
          <div key={dim.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-lg font-semibold text-foreground">{dim.name}</h3>
              <span className="text-xs text-muted-foreground">weight {dim.weight}</span>
            </div>
            {dim.weightingRationale && (
              <p className="text-xs text-muted-foreground/70 mb-3 italic">{dim.weightingRationale}</p>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              {dim.criteria.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/60 p-3 bg-muted/20">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    {c.benchmarkTarget !== undefined && (
                      <span className="text-[10px] text-violet-300/80">peer avg: L{c.benchmarkTarget}</span>
                    )}
                  </div>
                  <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                    {Object.values(c.levels).map((lvl, i) => (
                      <li key={i}><span className="text-foreground/80">L{i + 1}:</span> {lvl}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
