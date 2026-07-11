"use client";

import { AssessmentDelta } from "@/lib/assessment/types";
import { loadFramework } from "@/lib/framework/config";
import { calculateOverallScore } from "@/lib/assessment/scoring";
import { AssessmentRadarChart } from "./RadarChart";
import { DimensionBar } from "./DimensionBar";
import { AIReadinessScore } from "./AIReadinessScore";
import { EvidenceList } from "./EvidenceList";
import { StatusBar } from "./StatusBar";
import { AssessmentProgress } from "./AssessmentProgress";

interface ScorecardPanelProps {
  delta: AssessmentDelta | null;
  documentCount: number;
}

export function ScorecardPanel({ delta, documentCount }: ScorecardPanelProps) {
  const config = loadFramework(delta?.frameworkVersion);
  const overallScore = delta
    ? calculateOverallScore(delta.dimensions, config)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Live Scorecard</h2>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold gradient-text">
              {overallScore > 0 ? overallScore.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AssessmentRadarChart delta={delta} />

        <AssessmentProgress delta={delta} config={config} />

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Dimensions
          </h3>
          {config.dimensions.filter((dim) => dim.includeInOverall !== false).map((dim) => (
            <DimensionBar
              key={dim.id}
              name={dim.name}
              assessment={delta?.dimensions[dim.id]}
            />
          ))}
        </div>

        <AIReadinessScore
          aiReadiness={delta?.aiReadiness}
          genAIReadiness={delta?.genAIReadiness}
        />

        <EvidenceList delta={delta} />
      </div>

      <StatusBar delta={delta} documentCount={documentCount} />
    </div>
  );
}
