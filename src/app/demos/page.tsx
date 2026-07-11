import Link from "next/link";
import { ArrowRight, FileText, MessageSquareText, PlayCircle } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { demoScenarios } from "@/lib/demo/scenarios";

export default function DemoScenariosPage() {
  return (
    <SiteShell maxWidth="max-w-6xl">
      <div className="py-10 md:py-14">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
            <PlayCircle className="size-4" /> Continue-ready examples
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Start from a realistic assessment in progress.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
            Each scenario starts a separate session with company context, uploaded documents,
            scored evidence, and a focused next question. Answer a few follow-ups to evolve the
            scorecard, then open its report.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {demoScenarios.map((scenario) => (
            <article
              key={scenario.id}
              className="flex flex-col rounded-2xl border border-border bg-card/60 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {scenario.industry}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{scenario.companyName}</h2>
              <p className="mt-1 text-sm font-medium text-foreground/80">{scenario.title}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{scenario.description}</p>
              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <p className="flex items-start gap-2"><FileText className="mt-0.5 size-3.5 shrink-0 text-primary" /> {scenario.documents.length} uploaded documents already analyzed</p>
                <p className="flex items-start gap-2"><MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-primary" /> {scenario.progressLabel}</p>
              </div>
              <Link
                href={`/assess?scenario=${encodeURIComponent(scenario.id)}`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Continue assessment <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
