"use client";

import { useState, useCallback, useEffect, useMemo, useRef, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/assess/ChatPanel";
import { ScorecardPanel } from "@/components/assess/ScorecardPanel";
import { SiteShell } from "@/components/layout/SiteShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAssessment } from "@/hooks/useAssessment";
import { AssessmentDelta, ChatMessage } from "@/lib/assessment/types";
import { getDemoDelta } from "@/lib/demo/demo-delta";
import { getDemoScenario } from "@/lib/demo/scenarios";

interface SeededScenario {
  assessment: AssessmentDelta;
  messages: ChatMessage[];
  isComplete: boolean;
}

function AssessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemo = searchParams.get("demo") === "true";
  const shouldStartNew = searchParams.get("new") === "true";
  const scenarioId = searchParams.get("scenario");
  const scenario = getDemoScenario(scenarioId);
  const [delta, setDelta] = useState<AssessmentDelta | null>(null);
  const [, setIsComplete] = useState(false);
  const [seededScenario, setSeededScenario] = useState<SeededScenario | null>(null);
  const [isReady, setIsReady] = useState(() => isDemo || (!shouldStartNew && !scenario));
  const [chatInstance, setChatInstance] = useState(0);
  const [, startTransition] = useTransition();
  const newSessionHandled = useRef(false);
  const seededScenarioRef = useRef<string | null>(null);
  const { saveAssessment, startNewAssessment } = useAssessment();
  const demoDelta = useMemo(() => (isDemo ? getDemoDelta() : null), [isDemo]);
  const activeDelta = demoDelta ?? (shouldStartNew || (scenario && !seededScenario) ? null : delta);
  const assessmentComplete = isDemo || Boolean(activeDelta && activeDelta.signalsCollected > 0);

  // Only an explicit "new" intent creates an assessment. Normal navigation to
  // /assess resumes the active session, including its shared text/voice state.
  useEffect(() => {
    if (scenario) return;
    if (isDemo || !shouldStartNew) {
      newSessionHandled.current = false;
      startTransition(() => setIsReady(true));
      return;
    }
    if (newSessionHandled.current) return;
    newSessionHandled.current = true;
    startNewAssessment();
    startTransition(() => {
      setDelta(null);
      setIsComplete(false);
      setChatInstance((current) => current + 1);
      setIsReady(true);
    });

    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    router.replace(`/assess${next.size > 0 ? `?${next.toString()}` : ""}`);
  }, [isDemo, router, scenario, searchParams, shouldStartNew, startNewAssessment, startTransition]);

  useEffect(() => {
    if (!scenario) {
      seededScenarioRef.current = null;
      return;
    }
    if (seededScenarioRef.current === scenario.id) return;
    seededScenarioRef.current = scenario.id;

    const sessionId = startNewAssessment();
    startTransition(() => {
      setDelta(null);
      setIsComplete(false);
      setSeededScenario(null);
      setChatInstance((current) => current + 1);
      setIsReady(false);
    });

    void fetch("/api/demo/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, scenarioId: scenario.id }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to start demo scenario");
        return (await response.json()) as SeededScenario;
      })
      .then((seed) => {
        startTransition(() => {
          setSeededScenario(seed);
          setDelta(seed.assessment);
          setIsComplete(seed.isComplete);
          setIsReady(true);
        });
      })
      .catch((error) => {
        console.error("Demo scenario setup error:", error);
        startTransition(() => setIsReady(true));
      });
  }, [scenario, startNewAssessment, startTransition]);

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

  const handleNewAssessment = useCallback(() => {
    startNewAssessment();
    setDelta(null);
    setIsComplete(false);
    setSeededScenario(null);
    setChatInstance((current) => current + 1);
    router.replace("/assess");
  }, [router, startNewAssessment]);

  return (
    <SiteShell footer={false} maxWidth="max-w-none">
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-border">
            {isReady && (
              <ChatPanel
                key={chatInstance}
                onAssessmentUpdate={handleAssessmentUpdate}
                onComplete={handleComplete}
                autoStart={!isDemo && !seededScenario}
                onNewAssessment={isDemo ? undefined : handleNewAssessment}
                initialMessages={seededScenario?.messages}
                initialAssessment={seededScenario?.assessment}
                initialComplete={seededScenario?.isComplete}
              />
            )}
            {!isReady && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Preparing assessment context…
              </div>
            )}
          </div>
          <div className="w-1/2">
            <ScorecardPanel
              delta={activeDelta}
              documentCount={activeDelta?.documentCount ?? 0}
            />
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
