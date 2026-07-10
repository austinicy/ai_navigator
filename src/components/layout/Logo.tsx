// src/components/layout/Logo.tsx
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="AI Transformation Navigator home">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="16" cy="16" r="14" stroke="var(--primary)" strokeWidth="2" />
        <path d="M16 4 L16 16 L26 21" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="2.5" fill="var(--primary)" />
      </svg>
      <span className="text-base font-semibold tracking-tight text-foreground">
        Navigator
      </span>
    </Link>
  );
}
