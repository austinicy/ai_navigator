// src/components/landing/CredibilitySection.tsx
import { loadFramework } from "@/lib/framework/config";
import { Reveal } from "./Reveal";

export function CredibilitySection() {
  const config = loadFramework();
  const names = Object.keys(config.referenceFrameworks);
  return (
    <section className="border-y border-border bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Grounded in established frameworks
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our model synthesizes the convergent dimensions across {names.length} established digital
            transformation and AI maturity frameworks — not invented from scratch.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {names.map((name) => (
              <span key={name} className="text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-colors">
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
