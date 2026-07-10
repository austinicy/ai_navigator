// src/components/landing/HowItWorks.tsx
"use client";

import { MessagesSquare, Gauge, Map } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    icon: MessagesSquare,
    title: "Converse with the AI consultant",
    body: "The agent leads — it greets you, asks targeted questions about your organization, and connects insights across the 7 dimensions. No surveys, no checkboxes.",
  },
  {
    n: "02",
    icon: Gauge,
    title: "Watch the scorecard build live",
    body: "Every answer becomes evidence. The scorecard fills in real time as the agent scores each dimension with confidence-weighted, evidence-traceable levels.",
  },
  {
    n: "03",
    icon: Map,
    title: "Get a sequenced transformation roadmap",
    body: "When assessment is complete, you receive a personalized 3-phase roadmap that respects dependencies — data before AI, governance before scaling.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            From conversation to defensible scorecard to sequenced roadmap — in one sitting.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.1}>
              <div className="relative h-full rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-sm font-mono font-semibold text-accent">{step.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
