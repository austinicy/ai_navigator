// src/app/methodology/page.tsx
import { SiteShell } from "@/components/layout/SiteShell";
import { Reveal } from "@/components/landing/Reveal";
import { DimensionMatrix } from "@/components/methodology/DimensionMatrix";
import { ScoringWalkthrough } from "@/components/methodology/ScoringWalkthrough";
import { ScoreSimulator } from "@/components/methodology/ScoreSimulator";
import { DependencyMap } from "@/components/methodology/DependencyMap";
import { ReferencesCarousel } from "@/components/methodology/ReferencesCarousel";
import { WhyItMatters } from "@/components/methodology/WhyItMatters";
import { GenAIReadinessSection } from "@/components/methodology/GenAIReadinessSection";
import { loadFramework } from "@/lib/framework/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MethodologyPage() {
  const config = loadFramework();
  return (
    <SiteShell>
      <section className="py-16 md:py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">Methodology</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            How the assessment works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {config.description}
          </p>
          <Link
            href="/assess"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start your assessment <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>
      <DimensionMatrix />
      <GenAIReadinessSection />
      <ScoringWalkthrough />
      <section className="py-16">
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">See the math in action</h2>
          <p className="mt-1 text-sm text-muted-foreground">Drag the sliders. The score updates live.</p>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mx-auto max-w-4xl">
            <ScoreSimulator />
          </div>
        </Reveal>
      </section>
      <DependencyMap />
      <ReferencesCarousel />
      <WhyItMatters />
    </SiteShell>
  );
}
