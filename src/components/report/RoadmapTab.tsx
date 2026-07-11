"use client";

import { useState, useEffect } from "react";
import { Zap, AlertCircle } from "lucide-react";
import { AssessmentDelta } from "@/lib/assessment/types";
import { Roadmap, RoadmapAction } from "@/lib/roadmap/types";
import { PhaseTimeline } from "@/components/shared/PhaseTimeline";
import { GradientCard } from "@/components/shared/GradientCard";

interface RoadmapTabProps {
  delta: AssessmentDelta;
  orgName: string;
  industry: string;
  initialRoadmap?: Roadmap;
}

const effortColors: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-400/10",
  medium: "text-amber-400 bg-amber-400/10",
  high: "text-red-400 bg-red-400/10",
};

function ActionCard({ action }: { action: RoadmapAction }) {
  return (
    <div className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">{action.title}</h4>
        <div className="flex gap-1 shrink-0 ml-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${effortColors[action.effort]}`}>
            {action.effort} effort
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
      {action.successMetrics.length > 0 && (
        <div className="border-t border-border pt-2 mt-2">
          <p className="text-[10px] text-muted-foreground mb-1">Success Metrics:</p>
          {action.successMetrics.map((metric, i) => (
            <p key={i} className="text-[11px] text-foreground/70 pl-2">• {metric}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function RoadmapTab({ delta, orgName, industry, initialRoadmap }: RoadmapTabProps) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(initialRoadmap ?? null);
  const [isLoading, setIsLoading] = useState(!initialRoadmap);
  const [activePhase, setActivePhase] = useState(0);
  const effectiveRoadmap = initialRoadmap ?? roadmap;
  const effectiveIsLoading = initialRoadmap ? false : isLoading;

  useEffect(() => {
    if (initialRoadmap) return;

    const sessionData = {
      // Construct minimal session for roadmap API
      dimensions: delta.dimensions,
      aiReadiness: delta.aiReadiness,
      genAIReadiness: delta.genAIReadiness,
      orgProfile: { name: orgName, industry },
      isComplete: true,
      id: "report",
      frameworkVersion: delta.frameworkVersion,
      conversationHistory: [],
      documents: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    })
      .then((res) => res.json())
      .then((data) => {
        // Only store a well-formed Roadmap. An error response (e.g. HTTP 500
        // from a missing API key) has body { error: "..." } with no `phases`,
        // which would crash the render guard below — leave roadmap null so
        // the existing !roadmap guard shows the graceful fallback message.
        if (data && Array.isArray(data.phases)) {
          setRoadmap(data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [delta, orgName, industry, initialRoadmap]);

  if (effectiveIsLoading) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center gap-1 mb-4">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]" />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
        </div>
        <p className="text-muted-foreground text-sm">Generating personalized roadmap...</p>
      </div>
    );
  }

  if (!effectiveRoadmap || effectiveRoadmap.phases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to generate roadmap. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PhaseTimeline phases={effectiveRoadmap.phases} activePhase={activePhase} />

      {/* Phase selector buttons */}
      <div className="flex gap-2">
        {effectiveRoadmap.phases.map((phase, i) => (
          <button
            key={phase.id}
            onClick={() => setActivePhase(i)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              i === activePhase
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Phase {i + 1}: {phase.name}
          </button>
        ))}
      </div>

      {/* Active phase actions */}
      {effectiveRoadmap.phases[activePhase] && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {effectiveRoadmap.phases[activePhase].description}
          </p>
          <div className="grid gap-3">
            {effectiveRoadmap.phases[activePhase].actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Quick wins */}
      {effectiveRoadmap.quickWins.length > 0 && (
        <GradientCard>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Zap className="size-4 text-accent" />
            Quick Wins
          </h3>
          <div className="grid md:grid-cols-2 gap-2">
            {effectiveRoadmap.quickWins.map((qw) => (
              <div key={qw.id} className="border border-emerald-500/20 rounded-lg p-3 bg-emerald-500/5">
                <h4 className="text-xs font-semibold text-foreground">{qw.title}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">{qw.description}</p>
              </div>
            ))}
          </div>
        </GradientCard>
      )}

      {/* Critical gaps */}
      {effectiveRoadmap.criticalGaps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <AlertCircle className="size-4 text-red-400" />
            Critical Gaps Addressed
          </h3>
          <ul className="space-y-1">
            {effectiveRoadmap.criticalGaps.map((gap, i) => (
              <li key={i} className="text-xs text-red-400/80 flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
