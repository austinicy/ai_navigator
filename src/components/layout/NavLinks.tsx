// src/components/layout/NavLinks.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/methodology", label: "How it works" },
  { href: "/assess", label: "Assess" },
  { href: "/history", label: "History" },
  { href: "/demos", label: "Demo cases" },
];

export function NavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSavedSessionReport = pathname === "/report" && Boolean(searchParams.get("session"));
  return (
    <nav className={`flex items-center gap-1 ${className}`} aria-label="Primary">
      {LINKS.map((link) => {
        const active =
          link.href === "/history"
              ? pathname === "/history" || isSavedSessionReport
              : pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href.split("?")[0]));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
