"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/assess/ChatPanel";
import { ScorecardPanel } from "@/components/assess/ScorecardPanel";
import { SiteShell } from "@/components/layout/SiteShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAssessment } from "@/hooks/useAssessment";
import { AssessmentDelta } from "@/lib/assessment/types";
import { getDemoDelta } from "@/lib/demo/demo-delta";

function AssessPageContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [delta, setDelta] = useState<AssessmentDelta | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { saveAssessment } = useAssessment();
  const demoDelta = useMemo(() => (isDemo ? getDemoDelta() : null), [isDemo]);
  const activeDelta = demoDelta ?? delta;
  const assessmentComplete = isDemo || isComplete;

  // Persist assessment state so the report page can read it
  useEffect(() => {
    if (delta && !isDemo) {
      saveAssessment(delta, delta.orgProfile.name, delta.orgProfile.industry);
    }
  }, [delta, isDemo, saveAssessment]);

  const handleAssessmentUpdate = useCallback((newDelta: AssessmentDelta | null) => {
    setDelta(newDelta);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  return (
    <SiteShell footer={false} maxWidth="max-w-none">
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-border">
            <ChatPanel
              onAssessmentUpdate={handleAssessmentUpdate}
              onComplete={handleComplete}
              autoStart={!isDemo}
            />
          </div>
          <div className="w-1/2">
            <ScorecardPanel delta={activeDelta} documentCount={0} />
          </div>
        </div>

        {assessmentComplete && activeDelta && (
          <div className="border-t border-border px-4 py-3 flex justify-center shrink-0">
            <a
              href={isDemo ? "/report?demo=true" : "/report"}
              className="gradient-primary text-white font-semibold px-8 py-2 rounded-lg hover:opacity-90 transition-opacity inline-block"
            >
              View Full Report & Roadmap →
            </a>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

export default function AssessPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>}>
        <AssessPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
