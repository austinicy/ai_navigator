"use client";

import { CTAButton } from "./CTAButton";

export function HeroSection() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="gradient-text">AI Transformation</span>
          <br />
          Navigator
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-2">
          The Operating System for Digital & AI Maturity
        </p>
        <p className="text-base text-muted-foreground/70">
          Understand your digital & AI maturity in minutes, not months.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full mb-8">
        <CTAButton
          href="/assess?mode=chat"
          icon="💬"
          title="Start Chat Assessment"
          description="Talk to our AI consultant about your organization's digital transformation journey"
          variant="primary"
        />
        <CTAButton
          href="/assess?mode=upload"
          icon="📄"
          title="Upload Docs First"
          description="Upload strategy docs, org charts, or tech inventories for AI-powered analysis"
          variant="secondary"
        />
      </div>

      <div className="flex gap-4 text-sm">
        <a href="/assess?demo=true" className="text-muted-foreground hover:text-violet-400 transition-colors underline underline-offset-4">
          Load demo company →
        </a>
        <a href="/methodology" className="text-muted-foreground hover:text-violet-400 transition-colors underline underline-offset-4">
          How the assessment works →
        </a>
      </div>
    </div>
  );
}
