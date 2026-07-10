// src/components/methodology/WhyItMatters.tsx
import { Clock, FileSearch, GitBranch, Layers } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const CARDS = [
  { icon: Clock, title: "Cuts months to minutes", body: "A conversational assessment replaces weeks of surveys with a guided 15-minute dialogue — and a defensible scorecard immediately." },
  { icon: FileSearch, title: "Evidence-traceable scores", body: "Every score links back to what you said or uploaded. No black-box ratings — executives can audit each level." },
  { icon: GitBranch, title: "Sequenced, not generic", body: "The dependency map respects reality: data before AI, cloud before data migration, governance before scaling." },
  { icon: Layers, title: "Two scores, one picture", body: "Digital Maturity (where you are) + AI Readiness (whether you can capitalize on AI) — current state and capacity to execute." },
];

const UNIQUE = [
  "Unified digital + AI assessment — most frameworks cover one or the other.",
  "Configurable, versioned framework — JSON-driven, evolves without code changes.",
  "Conversational, not checkbox — closer to a senior consultant than a survey.",
  "Live scorecard — builds in real time as evidence accumulates.",
  "Defensible provenance — every dimension names the established models it aligns to.",
];

export function WhyItMatters() {
  return (
    <section className="py-16">
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Why this drives success</h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <Reveal key={card.title} delay={i * 0.08}>
            <div className="h-full rounded-xl border border-border bg-card p-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <card.icon className="size-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{card.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{card.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-10 rounded-2xl border border-border bg-card/50 p-6">
        <h3 className="text-lg font-semibold text-foreground">What makes it unique</h3>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {UNIQUE.map((u) => (
            <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" /> {u}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
