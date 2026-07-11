// src/components/landing/FinalCTA.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="py-20">
      <Reveal className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-10 text-center md:p-14">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Ready to see where you stand?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start a 15-minute conversation with the AI consultant and leave with a defensible
            maturity scorecard and a sequenced roadmap.
          </p>
          <Link
            href="/assess?new=true"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start your assessment <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
