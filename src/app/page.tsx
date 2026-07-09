import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-background to-background" />
      <div className="relative z-10">
        <HeroSection />
      </div>
    </main>
  );
}
