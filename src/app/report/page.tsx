"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/report/OverviewTab";
import { DeepDiveTab } from "@/components/report/DeepDiveTab";
import { AssessmentDelta } from "@/lib/assessment/types";

export default function ReportPage() {
  const [delta, setDelta] = useState<AssessmentDelta | null>(null);
  const [roadmap, setRoadmap] = useState<unknown>(null);

  useEffect(() => {
    // Load demo data as fallback for hackathon
    fetch("/api/demo")
      .then((res) => res.json())
      .then((data) => {
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
      })
      .catch(console.error);
  }, []);

  if (!delta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  return (
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
            <div className="text-center text-muted-foreground py-12">
              Roadmap generation will be added in Task 12
            </div>
          </TabsContent>
          <TabsContent value="export" className="mt-6">
            <div className="text-center text-muted-foreground py-12">
              PDF export will be added in Task 13
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
