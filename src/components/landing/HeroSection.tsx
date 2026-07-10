// src/components/landing/HeroSection.tsx
"use client";

import { MessageSquare, FileText, ArrowDown, Play } from "lucide-react";
import Link from "next/link";
import { CTAButton } from "./CTAButton";
import { Reveal } from "./Reveal";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Subtle background accent — not a neon gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklch,var(--primary)_8%,transparent),transparent)]" />
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            Grounded in 11 established frameworks
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Understand your digital &amp; AI maturity in{" "}
            <span className="text-primary">minutes, not months</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            A conversational assessment that builds a defensible maturity scorecard in real time —
            then sequences a personalized transformation roadmap. The operating system for digital
            &amp; AI maturity.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/assess"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start your assessment
            </Link>
            <Link
              href="/methodology"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Play className="size-4" /> How it works
            </Link>
          </div>
          <Link
            href="/assess?demo=true"
            className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            or load a demo company →
          </Link>
        </Reveal>

        <Reveal delay={0.15} className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
          <CTAButton
            href="/assess"
            icon={MessageSquare}
            title="Start a conversation"
            description="Talk to the AI consultant. It leads, probes, and scores — you just answer."
            variant="primary"
          />
          <CTAButton
            href="/assess?mode=upload"
            icon={FileText}
            title="Upload documents first"
            description="Upload strategy decks, org charts, or tech inventories for AI-powered analysis."
            variant="secondary"
          />
        </Reveal>

        <div className="mt-20 flex justify-center">
          <a href="#highlights" className="text-muted-foreground hover:text-foreground" aria-label="Scroll down">
            <ArrowDown className="size-5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
