import { AlertCircle, BarChart3, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { AssessmentDelta, normalizeGapList } from "@/lib/assessment/types";
import { loadFramework } from "@/lib/framework/config";
import { calculateOverallScore, getDimensionLevel } from "@/lib/assessment/scoring";
import { estimateIndustryBenchmark } from "@/lib/assessment/benchmarks";
import { GradientCard } from "@/components/shared/GradientCard";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { GapHighlight } from "./GapHighlight";

interface OverviewTabProps {
  delta: AssessmentDelta;
}

export function OverviewTab({ delta }: OverviewTabProps) {
  const config = loadFramework(delta.frameworkVersion);
  const overallScore = calculateOverallScore(delta.dimensions, config);
  const criticalGaps = Object.entries(delta.dimensions)
    .filter(([, d]) => d.score > 0 && d.score < 3 && normalizeGapList(d.gaps).length > 0)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3);

  const benchmark = estimateIndustryBenchmark(
    delta.orgProfile?.industry || "Manufacturing",
    delta.orgProfile?.size || "mid-market",
    config
  );
  const industryBenchmark = benchmark.overall;
  const companyName = delta.orgProfile?.name || "This organization";
  const assessedDimensions = config.dimensions
    .map((dimension) => ({
      dimension,
      assessment: delta.dimensions[dimension.id],
    }))
    .filter(({ assessment }) => (assessment?.score ?? 0) > 0);
  const strongestDimensions = [...assessedDimensions]
    .sort((a, b) => (b.assessment?.score ?? 0) - (a.assessment?.score ?? 0))
    .slice(0, 2);
  const maturity = overallScore > 0 ? getDimensionLevel(overallScore) : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card/60 p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Assessment report</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{companyName}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {maturity
                ? `${companyName} is currently at Level ${maturity.level}: ${maturity.name} digital maturity, based on ${delta.signalsCollected} evidence signals across ${assessedDimensions.length} assessed sections.`
                : `${companyName}'s assessment is ready to collect evidence. Continue the conversation or upload documents to build its scorecard.`}
              {delta.genAIReadiness && delta.genAIReadiness.assessedCriteria > 0
                ? ` Its GenAI and agentic readiness has evidence for ${delta.genAIReadiness.assessedCriteria} of ${delta.genAIReadiness.totalCriteria} criteria.`
                : " GenAI and agentic readiness will appear once concrete GenAI evidence is assessed."}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left md:text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Assessment scope</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{delta.orgProfile.industry || "Industry not set"}</div>
            <div className="mt-1 text-xs text-muted-foreground">{delta.documentCount ?? 0} documents · {delta.signalsCollected} signals</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Sparkles className="size-3.5 text-primary" /> Strongest areas</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {strongestDimensions.length > 0
                ? strongestDimensions.map(({ dimension, assessment }) => `${dimension.name} (${assessment!.score.toFixed(1)})`).join(" · ")
                : "No scored areas yet"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><AlertCircle className="size-3.5 text-red-400" /> Priority attention</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {criticalGaps.length > 0
                ? `${config.dimensions.find((dimension) => dimension.id === criticalGaps[0][0])?.name ?? criticalGaps[0][0]} needs focused action.`
                : "No critical scored gaps yet"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><FileText className="size-3.5 text-primary" /> Evidence base</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {delta.documentCount && delta.documentCount > 0
                ? `${delta.documentCount} uploaded document${delta.documentCount === 1 ? "" : "s"} plus conversation evidence inform this report.`
                : "Scores currently reflect conversation evidence."}
            </p>
          </div>
        </div>
      </section>

      <div className={`grid gap-4 ${delta.genAIReadiness ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"}`}>
        <GradientCard>
          <ScoreBadge score={overallScore} max={5} label="Digital Maturity" />
        </GradientCard>
        <GradientCard>
          <ScoreBadge score={delta.aiReadiness.score} max={100} label="AI Readiness" />
        </GradientCard>
        {delta.genAIReadiness && (
          <GradientCard>
            <ScoreBadge score={delta.genAIReadiness.score} max={100} label="GenAI Readiness" />
          </GradientCard>
        )}
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

      {assessedDimensions.length > 0 && (
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="size-4 text-emerald-400" /> Key highlights
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            {strongestDimensions.map(({ dimension, assessment }) => (
              <li key={dimension.id} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                {dimension.name} is a relative strength at {assessment!.score.toFixed(1)}/5.
              </li>
            ))}
            {criticalGaps.slice(0, 2).map(([id, assessment]) => (
              <li key={id} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                {config.dimensions.find((dimension) => dimension.id === id)?.name ?? id} is at {assessment.score.toFixed(1)}/5 and should be prioritized.
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
