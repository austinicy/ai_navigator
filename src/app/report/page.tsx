"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/report/OverviewTab";
import { DeepDiveTab } from "@/components/report/DeepDiveTab";
import { RoadmapTab } from "@/components/report/RoadmapTab";
import { ExportTab } from "@/components/report/ExportTab";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAssessment } from "@/hooks/useAssessment";
import { AssessmentDelta } from "@/lib/assessment/types";

export default function ReportPage() {
  const { delta: savedDelta, orgName: savedOrgName, industry: savedIndustry } = useAssessment();
  const [delta, setDelta] = useState<AssessmentDelta | null>(null);

  // Prefer saved session state; fall back to demo data only if none exists.
  // Guard against a race: on mount savedDelta is null (the hook's localStorage
  // read hasn't run yet), so a demo fetch fires. If saved state then loads
  // before that fetch resolves, the stale demo response would overwrite the
  // saved delta. The cancelled flag + savedDelta re-check drop stale results.
  useEffect(() => {
    if (savedDelta) {
      setDelta(savedDelta);
      return;
    }
    let cancelled = false;
    fetch("/api/demo")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || savedDelta) return;
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
          orgProfile: data.orgProfile,
          frameworkVersion: data.frameworkVersion,
          benchmark: { overall: null, byDimension: {} },
        };
        setDelta(demoDelta);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [savedDelta]);

  const effectiveOrgName = savedOrgName || "Acme Corporation";
  const effectiveIndustry = savedIndustry || "Manufacturing";

  if (!delta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <h1 className="text-lg font-bold gradient-text">Transformation Report</h1>
              <p className="text-xs text-muted-foreground">AI Transformation Navigator</p>
            </div>
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← New Assessment
            </a>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
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
              />
            </TabsContent>
            <TabsContent value="export" className="mt-6">
              <ExportTab delta={delta} orgName={effectiveOrgName} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ErrorBoundary>
  );
}
