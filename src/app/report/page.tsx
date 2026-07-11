"use client";

import { Suspense, useMemo } from "react";
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

function ReportPageContent() {
  const { delta: savedDelta, orgName: savedOrgName, industry: savedIndustry } = useAssessment();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const demoDelta = useMemo(() => getDemoDelta(), []);
  // Demo reports are read-only and never touch the active assessment session.
  const delta = isDemo ? demoDelta : savedDelta ?? demoDelta;

  const effectiveOrgName = delta?.orgProfile.name || savedOrgName || "Acme Corporation";
  const effectiveIndustry = delta?.orgProfile.industry || savedIndustry || "Manufacturing";

  return (
    <SiteShell maxWidth="max-w-6xl">
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Transformation report</h1>
            <p className="text-sm text-muted-foreground">AI Transformation Navigator</p>
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
