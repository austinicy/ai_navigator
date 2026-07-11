import { AIReadinessBreakdown, GenAIReadinessBreakdown } from "@/lib/assessment/types";

interface AIReadinessScoreProps {
  aiReadiness: AIReadinessBreakdown | undefined;
  genAIReadiness?: GenAIReadinessBreakdown;
}

export function AIReadinessScore({ aiReadiness, genAIReadiness }: AIReadinessScoreProps) {
  const score = aiReadiness?.score ?? 0;
  const components = aiReadiness?.components ?? {};

  const labelColors: Record<string, string> = {
    ai_strategy: "text-primary",
    data_readiness: "text-cyan-400",
    infrastructure_readiness: "text-blue-400",
    talent_readiness: "text-amber-400",
    governance_readiness: "text-emerald-400",
    operational_readiness: "text-orange-400",
  };

  const labelNames: Record<string, string> = {
    ai_strategy: "AI Strategy",
    data_readiness: "Data",
    infrastructure_readiness: "Infra",
    talent_readiness: "Talent",
    governance_readiness: "Governance",
    operational_readiness: "Ops",
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">AI Readiness</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold gradient-text">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {Object.entries(components).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className={`text-xs ${labelColors[key] ?? "text-muted-foreground"}`}>
              {labelNames[key] ?? key}
            </span>
            <span className="text-xs text-muted-foreground">
              {value !== null ? `${Math.round(value)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
      {genAIReadiness && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">GenAI &amp; Agentic Readiness</h4>
              <p className="text-[10px] text-muted-foreground">
                {genAIReadiness.assessedCriteria}/{genAIReadiness.totalCriteria} capabilities evidenced
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-accent">{genAIReadiness.score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {Object.entries(genAIReadiness.components).map(([key, value]) => (
              <div key={key} className="rounded bg-muted/30 px-2 py-1.5">
                <div className="truncate text-[10px] text-muted-foreground">
                  {key.replaceAll("_", " ")}
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {value === null ? "—" : `${Math.round(value)}%`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
