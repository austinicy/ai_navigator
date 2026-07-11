import { Bot, BrainCircuit, DatabaseZap, Gauge, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { loadFramework } from "@/lib/framework/config";

const ICONS = [Sparkles, BrainCircuit, DatabaseZap, Gauge, ShieldCheck, Users, Bot];

export function GenAIReadinessSection() {
  const config = loadFramework();
  const dimension = config.dimensions.find((item) => item.id === "genai");
  if (!dimension) return null;

  return (
    <section id="genai" className="py-16">
      <Reveal className="rounded-2xl border border-primary/25 bg-primary/5 p-6 md:p-10">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            New in framework v{config.version}
          </span>
          <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
            GenAI &amp; Agentic Readiness
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A separate cross-cutting score assesses whether the organization can consume,
            build, operate, and govern foundation-model and autonomous-agent systems. It is
            reported separately so GenAI does not double-count the seven core dimensions.
          </p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {dimension.criteria.map((criterion, index) => {
            const Icon = ICONS[index] ?? Sparkles;
            return (
              <div key={criterion.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{criterion.name}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Target level {criterion.targetLevel ?? 3} · {criterion.levels[String(criterion.targetLevel ?? 3)]}
                </p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
