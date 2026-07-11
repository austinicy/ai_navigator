// src/app/methodology/page.tsx
import { SiteShell } from "@/components/layout/SiteShell";
import { Reveal } from "@/components/landing/Reveal";
import { DimensionMatrix } from "@/components/methodology/DimensionMatrix";
import { ScoringWalkthrough } from "@/components/methodology/ScoringWalkthrough";
import { ScoreSimulator } from "@/components/methodology/ScoreSimulator";
import { DependencyMap } from "@/components/methodology/DependencyMap";
import { ReferencesCarousel } from "@/components/methodology/ReferencesCarousel";
import { WhyItMatters } from "@/components/methodology/WhyItMatters";
import { loadFramework } from "@/lib/framework/config";
import Link from "next/link";
import { ArrowDown, ArrowRight, Orbit, RadioTower, Sparkles } from "lucide-react";

export default function MethodologyPage() {
  const config = loadFramework("v2.0");
  return (
    <SiteShell>
      <section className="methodology-hero relative -mx-4 overflow-hidden border-b border-border/60 px-4 py-20 sm:-mx-6 sm:px-6 md:py-28 lg:-mx-8 lg:px-8">
        <div className="methodology-grid absolute inset-0 opacity-50" />
        <div className="methodology-orb methodology-orb-one" />
        <div className="methodology-orb methodology-orb-two" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <RadioTower className="size-3.5" /> Living methodology · v{config.version}
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground md:text-7xl">
              From conversation to a <span className="text-primary">clear path forward.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {config.description} Every signal becomes evidence, every score stays explainable, and every recommendation respects what must happen first.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/assess" className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_0_32px_color-mix(in_oklab,var(--primary)_28%,transparent)] transition hover:-translate-y-0.5 hover:bg-primary/90">
                Start your assessment <ArrowRight className="size-4" />
              </Link>
              <a href="#matrix" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-background/50 px-5 text-sm font-medium text-foreground backdrop-blur transition hover:border-primary/40">
                Explore the model <ArrowDown className="size-4" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="relative mx-auto aspect-square w-full max-w-[430px]">
            <div className="absolute inset-[12%] rounded-full border border-primary/25 bg-card/30 backdrop-blur-xl" />
            <div className="methodology-spin absolute inset-[4%] rounded-full border border-dashed border-primary/25" />
            <div className="methodology-spin-reverse absolute inset-[22%] rounded-full border border-accent/25" />
            <div className="absolute inset-[34%] flex flex-col items-center justify-center rounded-full border border-primary/40 bg-background/80 text-center shadow-[0_0_60px_color-mix(in_oklab,var(--primary)_24%,transparent)]">
              <Sparkles className="size-7 text-primary" />
              <span className="mt-2 text-3xl font-semibold text-foreground">7</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">dimensions</span>
            </div>
            {config.dimensions.map((dim, index) => {
              const angle = (index / config.dimensions.length) * Math.PI * 2 - Math.PI / 2;
              const x = 50 + Math.cos(angle) * 43;
              const y = 50 + Math.sin(angle) * 43;
              return <div key={dim.id} className="absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-card/90 text-[10px] font-bold text-primary shadow-lg backdrop-blur" style={{ left: `${x}%`, top: `${y}%` }}>{String(index + 1).padStart(2, "0")}</div>;
            })}
            <Orbit className="absolute left-1/2 top-1/2 size-[72%] -translate-x-1/2 -translate-y-1/2 text-primary/10" strokeWidth={0.5} />
          </Reveal>
        </div>
      </section>
      <DimensionMatrix />
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
