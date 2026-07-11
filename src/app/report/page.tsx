"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/report/OverviewTab";
import { DeepDiveTab } from "@/components/report/DeepDiveTab";
import { RoadmapTab } from "@/components/report/RoadmapTab";
import { ExportTab } from "@/components/report/ExportTab";
import { SiteShell } from "@/components/layout/SiteShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAssessment } from "@/hooks/useAssessment";
import { getDemoDelta } from "@/lib/demo/demo-delta";
import { getDemoRoadmap } from "@/lib/demo/demo-data";
import type { AssessmentDelta } from "@/lib/assessment/types";

function ReportPageContent() {
  const {
    delta: savedDelta,
    orgName: savedOrgName,
    industry: savedIndustry,
    getHistoryEntry,
    isHydrated,
  } = useAssessment();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const requestedSessionId = searchParams.get("session");
  const historyEntry = getHistoryEntry(requestedSessionId);
  const demoDelta = useMemo(() => getDemoDelta(), []);
  const [sharedSession, setSharedSession] = useState<{
    sessionId: string;
    delta: AssessmentDelta;
  } | null>(null);

  useEffect(() => {
    if (!requestedSessionId || isDemo) return;

    let active = true;
    fetch(`/api/assess?sessionId=${encodeURIComponent(requestedSessionId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load assessment session");
        return response.json() as Promise<{ assessment: AssessmentDelta }>;
      })
      .then((data) => {
        if (active) setSharedSession({ sessionId: requestedSessionId, delta: data.assessment });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [requestedSessionId, isDemo]);
  // Demo reports are read-only and never touch the active assessment session.
  const sharedDelta =
    sharedSession?.sessionId === requestedSessionId ? sharedSession.delta : null;
  const delta = isDemo ? demoDelta : sharedDelta ?? historyEntry?.delta ?? savedDelta ?? demoDelta;

  const effectiveOrgName =
    delta?.orgProfile.name || historyEntry?.orgName || savedOrgName || "Acme Corporation";
  const effectiveIndustry =
    delta?.orgProfile.industry || historyEntry?.industry || savedIndustry || "Manufacturing";

  if (!isHydrated) {
    return (
      <SiteShell maxWidth="max-w-6xl">
        <div className="py-16 text-center text-sm text-muted-foreground">
          Loading assessment report…
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell maxWidth="max-w-6xl">
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{effectiveOrgName} transformation report</h1>
            <p className="text-sm text-muted-foreground">
              {isDemo
                ? "Demo company · read-only example"
                : historyEntry
                  ? "Saved assessment session"
                  : "Current assessment session"}
              {historyEntry && (
                <Link href="/history" className="ml-2 text-primary hover:underline">
                  Back to history
                </Link>
              )}
            </p>
          </div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted/30">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <OverviewTab delta={delta} />
            </TabsContent>
            <TabsContent value="deepdive" className="mt-6">
              <DeepDiveTab delta={delta} />
            </TabsContent>
            <TabsContent value="roadmap" className="mt-6">
              <RoadmapTab
                delta={delta}
                orgName={effectiveOrgName}
                industry={effectiveIndustry}
                initialRoadmap={isDemo ? getDemoRoadmap() : undefined}
              />
            </TabsContent>
            <TabsContent value="export" className="mt-6">
              <ExportTab delta={delta} orgName={effectiveOrgName} />
            </TabsContent>
          </Tabs>
        </div>
    </SiteShell>
  );
}

export default function ReportPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="h-screen flex items-center justify-center text-muted-foreground">Loading report...</div>}>
        <ReportPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
