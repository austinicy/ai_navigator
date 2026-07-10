// src/components/landing/CTAButton.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CTAButtonProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "primary" | "secondary";
}

export function CTAButton({
  href,
  icon: Icon,
  title,
  description,
  variant = "primary",
}: CTAButtonProps) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-4 rounded-xl border p-5 transition-all hover:scale-[1.01] ${
        variant === "primary"
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
