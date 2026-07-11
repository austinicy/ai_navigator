// src/components/layout/SiteHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";
import { Suspense } from "react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <Logo />
        <Suspense fallback={<nav className="hidden md:flex" aria-label="Primary" />}>
          <NavLinks className="hidden md:flex" />
        </Suspense>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/assess?new=true">
            <Button size="sm" className="hidden sm:inline-flex">
              Start assessment <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
