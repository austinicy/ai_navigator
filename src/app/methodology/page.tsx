// src/app/methodology/page.tsx
import { DimensionMatrix } from "@/components/methodology/DimensionMatrix";
import { ScoringFormula } from "@/components/methodology/ScoringFormula";
import { ReferenceFrameworks } from "@/components/methodology/ReferenceFrameworks";
import { WhyItMatters } from "@/components/methodology/WhyItMatters";
import { loadFramework } from "@/lib/framework/config";

export default function MethodologyPage() {
  const config = loadFramework("v2.0");
  return (
    <main className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold gradient-text">Methodology</h1>
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</a>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        <section className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text">How the Assessment Works</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            {config.name} — {config.description}
          </p>
          <a href="/assess" className="inline-block mt-4 gradient-primary text-white font-semibold px-8 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Start your assessment →
          </a>
        </section>
        <DimensionMatrix />
        <ScoringFormula />
        <ReferenceFrameworks />
        <WhyItMatters />
      </div>
    </main>
  );
}
