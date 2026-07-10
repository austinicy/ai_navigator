// src/components/layout/SiteFooter.tsx
import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            The operating system for digital &amp; AI maturity. Understand your organization&apos;s
            transformation readiness in minutes, not months.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/assess" className="text-muted-foreground hover:text-foreground">Assessment</Link></li>
            <li><Link href="/methodology" className="text-muted-foreground hover:text-foreground">How it works</Link></li>
            <li><Link href="/report?demo=true" className="text-muted-foreground hover:text-foreground">Demo report</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Framework</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/methodology#matrix" className="text-muted-foreground hover:text-foreground">Assessment matrix</Link></li>
            <li><Link href="/methodology#scoring" className="text-muted-foreground hover:text-foreground">Scoring model</Link></li>
            <li><Link href="/methodology#references" className="text-muted-foreground hover:text-foreground">References</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AI Transformation Navigator
      </div>
    </footer>
  );
}
