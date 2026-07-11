"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock3, FileText, History, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SiteShell } from "@/components/layout/SiteShell";
import { AssessmentHistoryEntry, useAssessment } from "@/hooks/useAssessment";
import { loadFramework } from "@/lib/framework/config";
import { calculateOverallScore } from "@/lib/assessment/scoring";

export default function HistoryPage() {
  const router = useRouter();
  const {
    history,
    isHydrated,
    sessionId: activeSessionId,
    startNewAssessment,
    deleteHistoryEntry,
  } = useAssessment();
  const [sharedHistory, setSharedHistory] = useState<AssessmentHistoryEntry[]>([]);

  useEffect(() => {
    let active = true;
    const loadSharedHistory = () => {
      fetch("/api/assess?history=true")
        .then(async (response) => {
          if (!response.ok) throw new Error("Unable to load shared history");
          return response.json() as Promise<{ sessions: AssessmentHistoryEntry[] }>;
        })
        .then((data) => {
          if (active) setSharedHistory(data.sessions);
        })
        .catch(() => undefined);
    };

    loadSharedHistory();
    const interval = window.setInterval(loadSharedHistory, 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const allHistory = useMemo(() => {
    const sessions = new Map(history.map((entry) => [entry.sessionId, entry]));
    for (const entry of sharedHistory) sessions.set(entry.sessionId, entry);
    return [...sessions.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [history, sharedHistory]);

  const beginAssessment = () => {
    startNewAssessment();
    router.push("/assess");
  };

  return (
    <SiteShell maxWidth="max-w-5xl">
      <div className="py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <History className="size-4" /> Assessment archive
            </div>
            <h1 className="text-3xl font-bold text-foreground">Session history</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Shared sessions refresh automatically from the assessment service.
            </p>
          </div>
          <Button onClick={beginAssessment} className="gradient-primary text-white">
            <Plus className="size-4" /> New assessment
          </Button>
        </div>

        {!isHydrated ? (
          <div className="rounded-2xl border border-border bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
            Loading saved sessions…
          </div>
        ) : allHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <History className="mx-auto mb-4 size-9 text-muted-foreground/60" />
            <h2 className="font-semibold text-foreground">No saved sessions yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Assessment results are saved automatically as your scorecard changes.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
          {allHistory.map((entry) => {
              const config = loadFramework(entry.delta.frameworkVersion);
              const overallScore = calculateOverallScore(entry.delta.dimensions, config);
              const companyName = entry.delta.orgProfile.name || entry.orgName || "Untitled assessment";
              const title = `${companyName} · ${new Date(entry.createdAt || entry.updatedAt).toLocaleString()}`;
              const industry = entry.delta.orgProfile.industry || entry.industry || "Industry not set";
              const active = entry.sessionId === activeSessionId;

              return (
                <article
                  key={entry.sessionId}
                  className="rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/35"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
                        {active && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{industry}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="size-3.5" />
                          {new Date(entry.updatedAt).toLocaleString()}
                        </span>
                        <span>{entry.delta.dimensionsAssessed}/{config.dimensions.length} sections assessed</span>
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="size-3.5" /> {entry.delta.documentCount ?? 0} documents
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="mr-2 text-right">
                        <div className="text-2xl font-bold gradient-text">
                          {overallScore > 0 ? overallScore.toFixed(1) : "—"}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">of 5.0</div>
                      </div>
                      <Link
                        href={`/report?session=${encodeURIComponent(entry.sessionId)}`}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        View report
                      </Link>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${title}`}
                        title="Delete saved session"
                        onClick={() => deleteHistoryEntry(entry.sessionId)}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
