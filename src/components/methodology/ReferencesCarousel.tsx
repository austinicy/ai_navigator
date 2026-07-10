// src/components/methodology/ReferencesCarousel.tsx
"use client";

import { useRef } from "react";
import { loadFramework } from "@/lib/framework/config";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const CONTRIBUTIONS: Record<string, string> = {
  "McKinsey Digital Quotient": "Strategy + Customer + Technology + Org/Culture pillars.",
  "Deloitte Digital Maturity Model": "Strategy + CX + Operations + Culture; 4-level progression.",
  "MIT CISR Digital Business Transformation": "Digital capability × leadership intensity.",
  "Gartner Digital Business Maturity": "5-level model; Information/Technology distinct from Operations.",
  "AWS Well-Architected ML Lens": "Public AI/ML rubric — baseline for our AI-readiness levels.",
  "Microsoft MLOps Maturity Model": "Public MLOps rubric (Levels 0–4).",
  "Google Cloud AI Maturity Framework": "Strategy + Data + Infra + Talent + Governance.",
  "Accenture AI Maturity Index": "Composite 0–100; Strategy + Data/Tech + Talent + Responsible AI.",
  "BCG AI Maturity Model": "Dabbling → AI-Native; Strategy + Data/Tech + Governance.",
  "IDC AI Maturity Model": "5 levels (Laggard → Leader); Strategy + Data + Tech + Talent.",
  "Forrester Digital Maturity Benchmark": "Strategy + CX + Operations + Technology/Ecosystem.",
  "Adobe Digital Maturity Assessment": "Strategy + CX + Tech/Data + Org/Culture + Operations.",
};

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function ReferencesCarousel() {
  const config = loadFramework("v2.0");
  const entries = Object.entries(config.referenceFrameworks);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section id="references" className="py-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Reference frameworks</h2>
          <p className="mt-1 text-sm text-muted-foreground">Synthesized from {entries.length} established models. Scroll →</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scrollBy(-1)} className="flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted" aria-label="Scroll left">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => scrollBy(1)} className="flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted" aria-label="Scroll right">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
      >
        {entries.map(([name, url]) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-72 shrink-0 snap-start flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {initials(name)}
              </div>
              <ExternalLink className="ml-auto size-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="mt-3 text-sm font-semibold text-foreground">{name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{CONTRIBUTIONS[name] ?? "Convergent dimension contribution."}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
