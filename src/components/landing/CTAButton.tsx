"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CTAButtonProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "primary" | "secondary";
}

export function CTAButton({
  href,
  icon,
  title,
  description,
  variant = "primary",
}: CTAButtonProps) {
  return (
    <Link href={href} className="block">
      <div
        className={`group relative rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
          variant === "primary"
            ? "border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10"
            : "border-pink-500/30 bg-pink-500/5 hover:border-pink-500/60 hover:bg-pink-500/10"
        }`}
      >
        {variant === "primary" && (
          <div className="absolute inset-0 rounded-xl glow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <div className="relative z-10">
          <div className="mb-3 text-3xl">{icon}</div>
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
    </Link>
  );
}
