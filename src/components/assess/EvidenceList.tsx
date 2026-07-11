"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText, MessageSquare } from "lucide-react";
import { AssessmentDelta } from "@/lib/assessment/types";
import { loadFramework } from "@/lib/framework/config";

interface EvidenceListProps {
  delta: AssessmentDelta | null;
}

export function EvidenceList({ delta }: EvidenceListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = loadFramework(delta?.frameworkVersion);
  const labels = useMemo(() => {
    const dimensionNames: Record<string, string> = {};
    const criterionNames: Record<string, string> = {};
    for (const dimension of config.dimensions) {
      dimensionNames[dimension.id] = dimension.name;
      for (const criterion of dimension.criteria) {
        criterionNames[criterion.id] = criterion.name;
      }
    }
    return { dimensionNames, criterionNames };
  }, [config]);

  if (!delta) return null;

  const allEvidence = Object.values(delta.dimensions).flatMap((d) => d.evidence);
  const evidence = allEvidence.slice(-8).reverse();

  return (
    <div className="border border-border rounded-lg p-3">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-semibold text-foreground">
          Evidence Collected ({allEvidence.length})
        </span>
        {isExpanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div className="space-y-2 mt-3">
          {evidence.map((e) => {
            const dimension = labels.dimensionNames[e.dimensionId] ?? e.dimensionId;
            const criterion = e.criterionId
              ? labels.criterionNames[e.criterionId] ?? e.criterionId
              : "General signal";
            const dimensionAssessment = delta.dimensions[e.dimensionId];
            const criterionConfidence = e.criterionId
              ? dimensionAssessment?.criterionConfidence[e.criterionId]
              : undefined;
            return (
              <div key={e.id} className="border border-border/60 rounded-md p-2">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0 mt-0.5">
                    {e.source === "document" ? (
                      <FileText className="size-3" />
                    ) : (
                      <MessageSquare className="size-3" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-foreground/80">{e.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {dimension} / {criterion}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Source: {e.source}
                      {typeof e.strength === "number" ? ` · Strength: ${Math.round(e.strength * 100)}%` : ""}
                      {typeof criterionConfidence === "number"
                        ? ` · Criterion confidence: ${Math.round(criterionConfidence * 100)}%`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {evidence.length === 0 && (
            <p className="text-[11px] text-muted-foreground/50 italic">
              No evidence collected yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
