// src/app/page.tsx
import { SiteShell } from "@/components/layout/SiteShell";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatTiles } from "@/components/landing/StatTiles";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ScorecardPreview } from "@/components/landing/ScorecardPreview";
import { CredibilitySection } from "@/components/landing/CredibilitySection";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <SiteShell footer={false}>
      <HeroSection />
      <div id="highlights" className="mx-auto w-full max-w-7xl px-4 md:px-6">
        <StatTiles />
      </div>
      <HowItWorks />
      <ScorecardPreview />
      <CredibilitySection />
      <FinalCTA />
    </SiteShell>
  );
}
