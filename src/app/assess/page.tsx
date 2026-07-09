"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/assess/ChatPanel";
import { ScorecardPanel } from "@/components/assess/ScorecardPanel";
import { AssessmentDelta } from "@/lib/assessment/types";

function AssessPageContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [delta, setDelta] = useState<AssessmentDelta | null>(null);
  const [documentCount, setDocumentCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isDemo) {
      fetch("/api/demo")
        .then((res) => res.json())
        .then((data) => {
          // Build a delta from demo data
          const demoDelta: AssessmentDelta = {
            dimensions: data.dimensions,
            aiReadiness: data.aiReadiness,
            signalsCollected: Object.values(data.dimensions as Record<string, { evidence: unknown[] }>).reduce(
              (sum: number, d: { evidence: unknown[] }) => sum + d.evidence.length,
              0
            ),
            dimensionsAssessed: 7,
            dimensionsRemaining: 0,
            nextFocus: "",
          };
          setDelta(demoDelta);
          setIsComplete(true);
        })
        .catch(console.error);
    }
  }, [isDemo]);

  const handleAssessmentUpdate = useCallback((newDelta: AssessmentDelta | null) => {
    setDelta(newDelta);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-semibold gradient-text">AI Transformation Navigator</h1>
        <div className="flex gap-2">
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Start Over
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-border">
          <ChatPanel
            onAssessmentUpdate={handleAssessmentUpdate}
            onComplete={handleComplete}
          />
        </div>
        <div className="w-1/2">
          <ScorecardPanel delta={delta} documentCount={documentCount} />
        </div>
      </div>

      {isComplete && delta && (
        <div className="border-t border-border px-4 py-3 flex justify-center shrink-0">
          <a
            href="/report"
            className="gradient-primary text-white font-semibold px-8 py-2 rounded-lg hover:opacity-90 transition-opacity inline-block"
          >
            View Full Report & Roadmap →
          </a>
        </div>
      )}
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-muted-foreground">Loading…</div>}>
      <AssessPageContent />
    </Suspense>
  );
}
