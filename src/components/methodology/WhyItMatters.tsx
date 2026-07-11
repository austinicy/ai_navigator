import { ArrowRight, Clock3, Fingerprint, GitBranch, Radar, Sparkles, Waves } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const OUTCOMES = [
  { icon: Clock3, metric: "15 min", label: "to a first maturity baseline", detail: "Replace weeks of survey coordination with one guided conversation." },
  { icon: Fingerprint, metric: "100%", label: "evidence traceability", detail: "Every score points back to a statement, document, or observed signal." },
  { icon: GitBranch, metric: "30", label: "sequenced capabilities", detail: "Dependencies turn a wish list into an executable transformation path." },
  { icon: Radar, metric: "2×", label: "strategic perspective", detail: "See digital maturity and AI readiness together—not as separate programs." },
];

const DIFFERENTIATORS = [
  { icon: Waves, title: "Conversational intelligence", body: "The system probes, clarifies, and adapts like a consultant instead of collecting static form answers." },
  { icon: Fingerprint, title: "Defensible by design", body: "Confidence and provenance stay attached to every recommendation, so leaders can challenge the result constructively." },
  { icon: GitBranch, title: "Dependency-aware action", body: "The roadmap recognizes that governance, data, talent, and platforms must mature in the right sequence." },
  { icon: Sparkles, title: "Digital + AI, unified", body: "One versioned model connects today's operating maturity with tomorrow's ability to scale responsible AI." },
];

export function WhyItMatters() {
  return <section className="py-20">
    <Reveal className="mx-auto max-w-3xl text-center"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Designed for momentum</span><h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">Why this drives success</h2><p className="mt-4 text-muted-foreground">A stronger assessment does more than describe the present. It creates shared conviction about what to do next.</p></Reveal>
    <div className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-2 lg:grid-cols-4">
      {OUTCOMES.map((item, index) => <Reveal key={item.label} delay={index * 0.06} className="border-b border-border p-6 last:border-0 md:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r">
        <item.icon className="size-5 text-primary" /><div className="mt-6 text-4xl font-semibold tracking-tight text-foreground">{item.metric}</div><div className="mt-1 text-sm font-semibold text-primary">{item.label}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">{item.detail}</p>
      </Reveal>)}
    </div>
    <div className="mt-16 grid items-start gap-10 lg:grid-cols-[.75fr_1.25fr]">
      <Reveal className="lg:sticky lg:top-28"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Built differently</span><h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">What makes it unique</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">Not another benchmark PDF. A living decision system that connects evidence to confidence, scores to dependencies, and priorities to action.</p><div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">Evidence → insight → sequence → momentum <ArrowRight className="size-4" /></div></Reveal>
      <div className="grid gap-4 sm:grid-cols-2">{DIFFERENTIATORS.map((item, index) => <Reveal key={item.title} delay={index * 0.06}><div className="group relative min-h-[220px] overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40"><div className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/5 transition group-hover:scale-150" /><div className="relative flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="size-5" /></div><h3 className="relative mt-6 text-lg font-semibold text-foreground">{item.title}</h3><p className="relative mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p></div></Reveal>)}</div>
    </div>
  </section>;
}
