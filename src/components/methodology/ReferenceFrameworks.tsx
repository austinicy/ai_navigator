// src/components/methodology/ReferenceFrameworks.tsx
import { loadFramework } from "@/lib/framework/config";

const CONTRIBUTIONS: Record<string, string> = {
  "McKinsey Digital Quotient": "Strategy + Customer + Technology + Org/Culture pillars; percentile benchmarking model.",
  "Deloitte Digital Maturity Model": "Strategy + CX + Operations + Culture structure; 4-level progression.",
  "MIT CISR Digital Business Transformation": "Two-axis model (digital capability × leadership intensity); leadership as separate axis.",
  "Gartner Digital Business Maturity": "5-level model; Information/Technology distinct from Operations.",
  "AWS Well-Architected ML Lens": "Fully public AI/ML scoring rubric — the baseline reference for our AI-readiness levels.",
  "Microsoft MLOps Maturity Model": "Fully public MLOps rubric (Levels 0–4); People + Model + Release + Integration.",
  "Google Cloud AI Maturity Framework": "Strategy + Data + Infra + Talent + Governance + Business Integration (6 dimensions).",
  "Accenture AI Maturity Index": "Composite 0–100 score; Strategy + Data/Tech + Talent + Responsible AI + Value.",
  "BCG AI Maturity Model": "Dabbling → Practicing → Scaling → AI-Native; Strategy + Data/Tech + Governance + Value.",
  "IDC AI Maturity Model": "5 levels (Laggard → Leader); Strategy + Data + Tech + Talent + Use Cases.",
  "Forrester Digital Maturity Benchmark": "Strategy + CX + Operations + Technology/Ecosystem; benchmark dataset.",
  "Adobe Digital Maturity Assessment": "Strategy + CX + Tech/Data + Org/Culture + Operations/Innovation.",
};

export function ReferenceFrameworks() {
  const config = loadFramework("v2.0");
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold gradient-text">Grounded in 11 Established Frameworks</h2>
      <p className="text-sm text-muted-foreground">
        This framework is not invented from scratch. It synthesizes the convergent dimensions identified across 11 established digital transformation and AI maturity models. Each reference contributed something specific:
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(config.referenceFrameworks).map(([name, url]) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-card p-4 hover:border-violet-500/50 transition-colors block"
          >
            <div className="text-sm font-semibold text-foreground mb-1">{name}</div>
            <div className="text-xs text-muted-foreground">{CONTRIBUTIONS[name] ?? "Convergent dimension contribution."}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
