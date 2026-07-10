// src/components/layout/SiteShell.tsx
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

interface SiteShellProps {
  children: ReactNode;
  footer?: boolean; // set false for full-height app pages (assess)
  maxWidth?: string; // override the default content width
}

export function SiteShell({ children, footer = true, maxWidth = "max-w-7xl" }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={`flex-1 ${maxWidth} mx-auto w-full px-4 md:px-6`}>{children}</main>
      {footer && <SiteFooter />}
    </div>
  );
}
