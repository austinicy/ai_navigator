import { AlertCircle, BarChart3 } from "lucide-react";
import { AssessmentDelta } from "@/lib/assessment/types";
import { loadFramework } from "@/lib/framework/config";
import { calculateOverallScore } from "@/lib/assessment/scoring";
import { estimateIndustryBenchmark } from "@/lib/assessment/benchmarks";
import { GradientCard } from "@/components/shared/GradientCard";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { GapHighlight } from "./GapHighlight";

interface OverviewTabProps {
  delta: AssessmentDelta;
}

export function OverviewTab({ delta }: OverviewTabProps) {
  const config = loadFramework();
  const overallScore = calculateOverallScore(delta.dimensions, config);
  const criticalGaps = Object.entries(delta.dimensions)
    .filter(([_, d]) => d.score > 0 && d.score < 3 && d.gaps.length > 0)
    .sort(([_, a], [__, b]) => a.score - b.score)
    .slice(0, 3);

  const benchmark = estimateIndustryBenchmark(
    delta.orgProfile?.industry || "Manufacturing",
    delta.orgProfile?.size || "mid-market",
    config
  );
  const industryBenchmark = benchmark.overall;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <GradientCard>
          <ScoreBadge score={overallScore} max={5} label="Digital Maturity" />
        </GradientCard>
        <GradientCard>
          <ScoreBadge score={delta.aiReadiness.score} max={100} label="AI Readiness" />
        </GradientCard>
        <GradientCard>
          <ScoreBadge score={industryBenchmark} max={5} label="Industry Avg (est.)" size="sm" />
          <p className="text-[10px] text-muted-foreground/50 mt-1 text-center">AI-estimated benchmark</p>
        </GradientCard>
      </div>

      {criticalGaps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <AlertCircle className="size-4 text-red-400" />
            Critical Gaps
          </h3>
          <div className="space-y-2">
            {criticalGaps.map(([id, dim]) => {
              const dimConfig = config.dimensions.find((d) => d.id === id);
              return (
                <GapHighlight
                  key={id}
                  dimensionName={dimConfig?.name ?? id}
                  score={dim.score}
                  gaps={dim.gaps}
                />
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <BarChart3 className="size-4 text-primary" />
          Dimension Summary
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {config.dimensions.map((dim) => {
            const assessment = delta.dimensions[dim.id];
            const score = assessment?.score ?? 0;
            return (
              <div key={dim.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <span className="text-xs text-foreground">{dim.name}</span>
                <span className={`text-sm font-bold ${score < 2.5 ? "text-red-400" : score < 3.5 ? "text-amber-400" : "text-emerald-400"}`}>
                  {score > 0 ? score.toFixed(1) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
