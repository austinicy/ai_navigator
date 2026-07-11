"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadFramework } from "@/lib/framework/config";
import { ExternalLink, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const CONTRIBUTIONS: Record<string, string> = {
  "McKinsey Digital Quotient": "Strategy, customer, technology, and organizational performance.",
  "Deloitte Digital Maturity Model": "Strategy, customer experience, operations, and culture.",
  "MIT CISR Digital Business Transformation": "Digital capability paired with leadership intensity.",
  "Gartner Digital Business Maturity": "A five-stage progression across information, technology, and operations.",
  "AWS Well-Architected ML Lens": "Operational foundations for reliable AI and machine learning workloads.",
  "Microsoft MLOps Maturity Model": "A practical maturity ladder for repeatable model delivery.",
  "Google Cloud AI Maturity Framework": "Strategy, data, infrastructure, talent, and governance.",
  "Accenture AI Maturity Index": "Enterprise AI capability, talent, technology, and responsible practice.",
  "BCG AI Maturity Model": "The progression from experimentation to AI-native operations.",
  "IDC AI Maturity Model": "Five stages across strategy, data, technology, and talent.",
  "Forrester Digital Maturity Benchmark": "Strategy, experience, operations, and ecosystem capability.",
  "Adobe Digital Maturity Assessment": "Experience-led maturity across data, technology, culture, and execution.",
};

const BRAND: Record<string, { mark: string; color: string }> = {
  McKinsey: { mark: "McK", color: "#3b82f6" }, Deloitte: { mark: "D", color: "#86bc25" }, MIT: { mark: "MIT", color: "#f43f5e" }, Gartner: { mark: "G", color: "#60a5fa" }, AWS: { mark: "aws", color: "#ff9900" }, Microsoft: { mark: "▦", color: "#00a4ef" }, Google: { mark: "G", color: "#4285f4" }, Accenture: { mark: ">", color: "#a100ff" }, BCG: { mark: "BCG", color: "#00a67e" }, IDC: { mark: "IDC", color: "#ef4444" }, Forrester: { mark: "F", color: "#2563eb" }, Adobe: { mark: "A", color: "#ff0000" },
};

function brandFor(name: string) {
  return Object.entries(BRAND).find(([key]) => name.startsWith(key))?.[1] ?? { mark: name.slice(0, 2), color: "var(--primary)" };
}

export function ReferencesCarousel() {
  const config = loadFramework();
  const entries = Object.entries(config.referenceFrameworks);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    const next = (index + entries.length) % entries.length;
    setActive(next);
    const scroller = scrollerRef.current;
    const card = scroller?.children[next] as HTMLElement | undefined;
    if (scroller && card) {
      // Keep carousel autoplay strictly horizontal. scrollIntoView() can also
      // move the document vertically when this section is below the viewport.
      const left = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2;
      scroller.scrollTo({ left, behavior: "smooth" });
    }
  }, [entries.length]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => goTo(active + 1), 3200);
    return () => window.clearInterval(timer);
  }, [active, goTo, paused]);

  return (
    <section id="references" className="py-16" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Grounded, not invented</span><h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Reference frameworks</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">A navigable library of the established models synthesized into one coherent assessment.</p></div>
        <div className="flex gap-2">
          <button onClick={() => setPaused((value) => !value)} className="flex size-10 items-center justify-center rounded-lg border border-border bg-card hover:border-primary/40" aria-label={paused ? "Resume carousel" : "Pause carousel"}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
          <button onClick={() => goTo(active - 1)} className="flex size-10 items-center justify-center rounded-lg border border-border bg-card hover:border-primary/40" aria-label="Previous framework"><ChevronLeft className="size-4" /></button>
          <button onClick={() => goTo(active + 1)} className="flex size-10 items-center justify-center rounded-lg border border-border bg-card hover:border-primary/40" aria-label="Next framework"><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div ref={scrollerRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[8%] pb-5 pt-2 [scrollbar-width:none] md:px-[28%]">
        {entries.map(([name, url], index) => {
          const brand = brandFor(name);
          const selected = active === index;
          return <a key={name} href={url} target="_blank" rel="noopener noreferrer" onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} className={`group relative flex min-h-[280px] w-[310px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-500 ${selected ? "-translate-y-1 border-primary/50 shadow-[0_18px_60px_color-mix(in_oklab,var(--primary)_16%,transparent)]" : "scale-95 border-border opacity-65"}`}>
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: brand.color }} />
            <div className="flex items-start justify-between"><div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-background text-xl font-black tracking-tight" style={{ color: brand.color }}>{brand.mark}</div><span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}/{entries.length}</span></div>
            <h3 className="mt-7 text-lg font-semibold leading-snug text-foreground">{name}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{CONTRIBUTIONS[name] ?? "A convergent source for the maturity model."}</p>
            <div className="mt-auto flex items-center gap-2 pt-6 text-xs font-semibold text-primary">View original framework <ExternalLink className="size-3.5 transition group-hover:translate-x-0.5" /></div>
          </a>;
        })}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">{entries.map(([name], index) => <button key={name} onClick={() => goTo(index)} className={`h-1.5 rounded-full transition-all ${active === index ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"}`} aria-label={`Show ${name}`} />)}</div>
    </section>
  );
}
