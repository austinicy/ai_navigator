# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "AI-generated demo" aesthetic (neon gradients, glow, emoji, centered narrow content, no chrome) with a refined, business-consulting product UI — blue + warm white + gold accent palette, dark default with a light theme toggle, persistent header/footer/nav, a marketing-grade landing page with scroll reveals, and an interactive (not text-heavy) methodology page.

**Architecture:** A design-token layer (CSS variables in `globals.css`) drives both themes; a `ThemeProvider` + `ThemeToggle` persist the user's choice; a shared `SiteHeader` + `SiteFooter` wrap every page via a new `(marketing)`-style layout pattern (components composed into each page, since the app has mixed client/server routes). `framer-motion` powers scroll-reveal and interactive animations. The methodology page gains four interactive components: an interactive score simulator (calls the real `scoring.ts` functions), a snap-scroll references carousel, an SVG dependency-map diagram, and a scrollytelling scoring walkthrough.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui (`@base-ui/react`), `framer-motion@^12`, `lucide-react@^1`, `recharts@^3`, TypeScript 5.

## Global Constraints

- **Working directory:** `/Users/zhb2sgp/Documents/Project/Testing/.worktrees/ai-navigator-impl/` (the Next.js app). All file paths in this plan are relative to it.
- **AGENTS.md (must obey):** This is a modified Next.js 16 — read the relevant guide in `node_modules/next/dist/docs/` before writing App Router / server-component code. Heed deprecation notices. Do not assume training-data APIs.
- **Palette (exact):** Primary blue `#2563eb` (dark) / `#1d4ed8` (light); warm-white background `hsl(40 30% 98%)` in light, near-black `hsl(222 20% 8%)` in dark; gold accent `#c8a44d` used sparingly for highlights/CTA emphasis only. No neon violet→pink gradients, no `glow` effects in the new design.
- **Themes:** Dark is the default. A sun/moon `ThemeToggle` in the header switches themes, persisted to `localStorage` under key `theme` (`"dark"` | `"light"`), respecting `prefers-color-scheme` on first visit. The `dark` class on `<html>` is toggled (the existing `@custom-variant dark (&:is(.dark *))` pattern stays).
- **No emoji as UI icons.** Replace all emoji (💬 📄 🎤 🔴 etc.) with `lucide-react` icons.
- **Icons:** `lucide-react` is already a dependency (`^1.23.0`). Import named icons: `import { MessageSquare, FileText, Mic, ArrowRight, Sun, Moon, ... } from "lucide-react"`.
- **Animations:** Install `framer-motion@^12` (`npm i framer-motion`). Use `"use client"` for any component using framer-motion. Scroll reveals use `motion` + `whileInView`.
- **Layout:** Pages may use full viewport width (`w-full` / `max-w-none`) for hero/feature sections, but content sections remain readable (`max-w-6xl` / `max-w-7xl mx-auto`). Good composition over raw full-width.
- **No tests required for presentational components** (matching the existing pattern — there are no component tests; verification is `tsc --noEmit` clean + `npm run build` success + visual smoke). Logic tasks (theme provider, score simulator math wiring) get unit tests where they have testable behavior.
- **TypeScript strict, no `any`** in new code.
- **Conventional commits** (`feat:`, `fix:`, `style:`, `chore:`). Frequent commits.
- **Don't break the assessment flow:** The `/assess` chat + scorecard and `/report` tabs must keep working. Header/footer wrap them; their internals stay.

---

## File Structure

**Created:**
- `src/components/layout/SiteHeader.tsx` — sticky header: logo + wordmark, nav links, theme toggle, CTA button. Client component (theme awareness).
- `src/components/layout/SiteFooter.tsx` — footer: brand line, link columns, copyright. Server component.
- `src/components/layout/Logo.tsx` — the logo mark (an SVG compass/nav symbol + wordmark). Server component.
- `src/components/layout/ThemeToggle.tsx` — sun/moon button. Client component.
- `src/components/layout/NavLinks.tsx` — nav link list with active state. Client component (uses `usePathname`).
- `src/components/layout/SiteShell.tsx` — composes `SiteHeader` + children + `SiteFooter`. Used by pages that want the chrome.
- `src/hooks/useTheme.ts` — theme state hook (reads localStorage, applies `dark` class, subscribes to changes). Client.
- `src/components/landing/StatTiles.tsx` — key-highlights stat row (4 tiles). Server.
- `src/components/landing/HowItWorks.tsx` — 3-step "how it works" section. Server + motion wrapper.
- `src/components/landing/ScorecardPreview.tsx` — a static mockup of the radar scorecard as a product preview. Server.
- `src/components/landing/CredibilitySection.tsx` — "grounded in 11 frameworks" logo/wordmark strip. Server.
- `src/components/landing/FinalCTA.tsx` — bottom CTA band. Server.
- `src/components/landing/Reveal.tsx` — a framer-motion scroll-reveal wrapper. Client.
- `src/components/methodology/ScoreSimulator.tsx` — interactive: drag a criterion level 1–5, watch dimension score + confidence + AI-readiness recompute live via `scoring.ts`. Client.
- `src/components/methodology/ReferencesCarousel.tsx` — horizontal snap-scroll carousel of the 11 frameworks. Client (scroll handlers) + server data.
- `src/components/methodology/DependencyMap.tsx` — SVG diagram of dimensions as nodes + 12 dependency edges, hoverable. Client.
- `src/components/methodology/ScoringWalkthrough.tsx` — scrollytelling: scroll-triggered step reveals for the 7 scoring steps with animated illustrations. Client.
- `src/lib/theme.ts` — theme constants + helpers (initial theme script, storage key). Shared.

**Modified:**
- `src/app/globals.css` — new palette tokens for `:root` (light) and `.dark` (dark); replace `gradient-primary`/`gradient-text`/`glow` utilities with restrained ones (a subtle `text-accent` gold, a `bg-primary` solid). Keep the `@theme inline` mapping.
- `src/app/layout.tsx` — add the no-flash theme init script in `<head>`, render `SiteHeader` + `SiteFooter` is NOT global (some pages like /assess are full-screen app chrome) — instead each page composes `SiteShell`. Layout gets metadata + font + the theme script only.
- `src/app/page.tsx` — full landing rebuild using the new sections.
- `src/components/landing/HeroSection.tsx` — rewrite: full-width hero, headline, subhead, CTA, scroll cue. Remove `CTAButton` emoji style.
- `src/components/landing/CTAButton.tsx` — restyle: solid primary button, no glow, lucide icon.
- `src/app/methodology/page.tsx` — rebuild: compose the 4 interactive sections + matrix + why-it-matters, wrapped in `SiteShell`.
- `src/components/methodology/DimensionMatrix.tsx` — restyle (cards, lucide, accent); keep data.
- `src/components/methodology/ReferenceFrameworks.tsx` — replaced by `ReferencesCarousel` (delete the old text-grid component or repoint the import).
- `src/components/methodology/ScoringFormula.tsx` — replaced by `ScoreSimulator` + `ScoringWalkthrough` (the text block becomes the walkthrough's content).
- `src/components/methodology/WhyItMatters.tsx` — restyle (icon cards, two-column).
- `src/app/assess/page.tsx` — wrap in `SiteShell` (header only, no footer — it's a full-height app).
- `src/app/report/page.tsx` — wrap in `SiteShell`.
- `src/components/assess/ChatPanel.tsx`, `VoiceOverlay.tsx`, `ChatInput.tsx` — replace emoji with lucide icons; restyle bars/buttons to new palette. No logic changes.
- `src/components/report/OverviewTab.tsx`, `DeepDiveTab.tsx`, `RoadmapTab.tsx`, `ExportTab.tsx` — restyle to new palette; replace any `gradient-text`/`glow` usage.
- `src/components/shared/GradientCard.tsx`, `ScoreBadge.tsx` — restyle to new tokens.
- `package.json` — add `framer-motion` dev/prod dep.

**Deleted:** none (old landing components are rewritten in place; old methodology text components are repointed).

---

## Phase 1 — Design Tokens & Theme Foundation

### Task 1: Rewrite the palette in globals.css (blue + warm white + gold, dark + light)

**Files:**
- Modify: `src/app/globals.css`

**Goal:** Replace the violet/pink neon palette with the consulting palette in BOTH `:root` (light, the default for light theme) and `.dark` (dark, the default overall). Keep the `@theme inline` block and the `@custom-variant dark` pattern. Replace the `gradient-primary`/`gradient-text`/`glow`/`glow-sm` utilities with restrained ones.

- [ ] **Step 1: Replace the `:root` block (light theme tokens)**

In `src/app/globals.css`, replace the entire `:root { ... }` block with:

```css
:root {
  /* Light theme: warm white background, blue primary, gold accent */
  --background: hsl(40 30% 98%);
  --foreground: hsl(222 25% 12%);
  --card: hsl(40 25% 100%);
  --card-foreground: hsl(222 25% 12%);
  --popover: hsl(40 25% 100%);
  --popover-foreground: hsl(222 25% 12%);
  --primary: hsl(221 83% 53%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(220 16% 96%);
  --secondary-foreground: hsl(222 25% 18%);
  --muted: hsl(220 16% 96%);
  --muted-foreground: hsl(222 12% 45%);
  --accent: hsl(41 60% 48%);
  --accent-foreground: hsl(222 25% 12%);
  --destructive: hsl(0 72% 51%);
  --destructive-foreground: hsl(0 0% 100%);
  --border: hsl(220 16% 90%);
  --input: hsl(220 16% 90%);
  --ring: hsl(221 83% 53%);
  --radius: 0.625rem;
  --chart-1: hsl(221 83% 53%);
  --chart-2: hsl(41 60% 48%);
  --chart-3: hsl(173 58% 39%);
  --chart-4: hsl(280 40% 55%);
  --chart-5: hsl(0 72% 51%);
  --sidebar: hsl(40 25% 100%);
  --sidebar-foreground: hsl(222 25% 12%);
  --sidebar-primary: hsl(221 83% 53%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(220 16% 96%);
  --sidebar-accent-foreground: hsl(222 25% 18%);
  --sidebar-border: hsl(220 16% 90%);
  --sidebar-ring: hsl(221 83% 53%);
}
```

- [ ] **Step 2: Replace the `.dark` block (dark theme tokens)**

Replace the entire `.dark { ... }` block with:

```css
.dark {
  /* Dark theme (default): near-black navy, blue primary, gold accent */
  --background: hsl(222 20% 8%);
  --foreground: hsl(40 20% 96%);
  --card: hsl(222 18% 11%);
  --card-foreground: hsl(40 20% 96%);
  --popover: hsl(222 18% 11%);
  --popover-foreground: hsl(40 20% 96%);
  --primary: hsl(217 91% 60%);
  --primary-foreground: hsl(222 30% 8%);
  --secondary: hsl(222 16% 16%);
  --secondary-foreground: hsl(40 20% 96%);
  --muted: hsl(222 16% 16%);
  --muted-foreground: hsl(220 10% 65%);
  --accent: hsl(43 65% 58%);
  --accent-foreground: hsl(222 30% 8%);
  --destructive: hsl(0 62% 55%);
  --destructive-foreground: hsl(40 20% 96%);
  --border: hsl(222 16% 20%);
  --input: hsl(222 16% 20%);
  --ring: hsl(217 91% 60%);
  --chart-1: hsl(217 91% 60%);
  --chart-2: hsl(43 65% 58%);
  --chart-3: hsl(173 50% 50%);
  --chart-4: hsl(280 40% 65%);
  --chart-5: hsl(0 62% 60%);
  --sidebar: hsl(222 18% 11%);
  --sidebar-foreground: hsl(40 20% 96%);
  --sidebar-primary: hsl(217 91% 60%);
  --sidebar-primary-foreground: hsl(222 30% 8%);
  --sidebar-accent: hsl(222 16% 16%);
  --sidebar-accent-foreground: hsl(40 20% 96%);
  --sidebar-border: hsl(222 16% 20%);
  --sidebar-ring: hsl(217 91% 60%);
}
```

- [ ] **Step 3: Replace the `@layer utilities` block (drop neon gradients + glow)**

Replace the entire `@layer utilities { ... }` block with:

```css
@layer utilities {
  .gradient-primary {
    @apply bg-primary;
  }
  .gradient-text {
    @apply text-primary;
  }
  .text-accent {
    color: var(--accent);
  }
  .bg-accent-soft {
    background-color: color-mix(in oklch, var(--accent) 12%, transparent);
  }
  .glow {
    box-shadow: none;
  }
  .glow-sm {
    box-shadow: none;
  }
}
```

(Keeping the class names `.gradient-primary`/`.gradient-text`/`.glow`/`.glow-sm` as no-ops or solid colors means existing components that reference them won't break visually — they just render in the new primary/accent. Later tasks replace those usages with direct token classes.)

- [ ] **Step 4: Verify build + typecheck**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds (CSS-only change; no TS impact). The app should now render in the new dark palette.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "style(theme): replace neon palette with blue + warm white + gold (dark + light)"
```

---

### Task 2: Add the theme hook, theme toggle, and no-flash init script

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/hooks/useTheme.ts`
- Create: `src/components/layout/ThemeToggle.tsx`
- Test: `src/hooks/__tests__/useTheme.test.ts`

**Interfaces:**
- Produces: `useTheme()` → `{ theme: "dark" | "light"; setTheme(t): void; toggle(): void }`. `ThemeToggle` renders a `Button` with `Sun`/`Moon` lucide icons. `getThemeInitScript()` returns a string of inline JS to run before paint (avoids flash).

- [ ] **Step 1: Write the failing test for useTheme**

```ts
// src/hooks/__tests__/useTheme.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
  });

  it("defaults to dark when nothing is stored and no system preference", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles to light and persists", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggle() flips the theme", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("light");
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/useTheme.test.ts`
Expected: FAIL — `useTheme` not found.

- [ ] **Step 3: Create `src/lib/theme.ts`**

```ts
// src/lib/theme.ts
export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "theme";

/**
 * Inline script run before first paint to set the theme class on <html>,
 * preventing a flash of the wrong theme. Renders as a string injected into
 * the layout's <head>.
 */
export function getThemeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}var d=document.documentElement;d.classList.remove('dark','light');d.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;
}
```

- [ ] **Step 4: Create `src/hooks/useTheme.ts`**

```ts
// src/hooks/useTheme.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function applyThemeClass(theme: Theme) {
  const d = document.documentElement;
  d.classList.remove("dark", "light");
  d.classList.add(theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Read the class the init script set, or localStorage, else default dark.
    const stored = (typeof window !== "undefined" && localStorage.getItem(THEME_STORAGE_KEY)) as Theme | null;
    const initial: Theme =
      stored ?? (document.documentElement.classList.contains("light") ? "light" : "dark");
    setThemeState(initial);
    applyThemeClass(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyThemeClass(t);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyThemeClass(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
```

- [ ] **Step 5: Create `src/components/layout/ThemeToggle.tsx`**

```tsx
// src/components/layout/ThemeToggle.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/useTheme.test.ts`
Expected: PASS (3/3).

- [ ] **Step 7: Wire the no-flash init script into layout.tsx**

In `src/app/layout.tsx`, add the script to `<head>` and remove the hardcoded `className="dark"` on `<html>` (the init script sets it). Updated layout:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getThemeInitScript } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Transformation Navigator",
  description: "The Operating System for Digital & AI Maturity",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
```

(`suppressHydrationWarning` on `<html>` is required because the init script mutates the class before React hydrates.)

- [ ] **Step 8: Verify build + full suite**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: tsc clean, all tests pass (the new 3 + existing 172), build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/lib/theme.ts src/hooks/useTheme.ts src/components/layout/ThemeToggle.tsx src/hooks/__tests__/useTheme.test.ts src/app/layout.tsx
git commit -m "feat(theme): add useTheme hook + ThemeToggle + no-flash init script"
```

---

## Phase 2 — Shared Chrome (Header, Footer, Nav, Shell) + Animation

### Task 3: Install framer-motion + create the Reveal wrapper

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Create: `src/components/landing/Reveal.tsx`

**Goal:** Install `framer-motion` and provide a reusable `Reveal` component for scroll-triggered animations.

- [ ] **Step 1: Install framer-motion**

Run: `npm i framer-motion`
Expected: `framer-motion@^12` added to `dependencies` in `package.json`, lockfile updated.

- [ ] **Step 2: Create the Reveal component**

```tsx
// src/components/landing/Reveal.tsx
"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Verify build + typecheck**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds (framer-motion is a client lib; the `"use client"` Reveal compiles).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/landing/Reveal.tsx
git commit -m "feat(landing): add framer-motion + Reveal scroll wrapper"
```

---

### Task 4: Build the Logo, NavLinks, SiteHeader, SiteFooter, and SiteShell

**Files:**
- Create: `src/components/layout/Logo.tsx`
- Create: `src/components/layout/NavLinks.tsx`
- Create: `src/components/layout/SiteHeader.tsx`
- Create: `src/components/layout/SiteFooter.tsx`
- Create: `src/components/layout/SiteShell.tsx`

**Interfaces:**
- Produces: `Logo` (SVG mark + wordmark), `NavLinks` (active-state links), `SiteHeader` (sticky, logo + nav + ThemeToggle + CTA), `SiteFooter` (brand + link columns + copyright), `SiteShell` (composes header + children + footer, with a `footer?: boolean` prop for full-height app pages).

- [ ] **Step 1: Create Logo.tsx**

```tsx
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
```

- [ ] **Step 2: Create NavLinks.tsx**

```tsx
// src/components/layout/NavLinks.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/methodology", label: "How it works" },
  { href: "/assess", label: "Assess" },
  { href: "/report?demo=true", label: "Demo report" },
];

export function NavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={`flex items-center gap-1 ${className}`} aria-label="Primary">
      {LINKS.map((link) => {
        const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href.split("?")[0]));
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
```

- [ ] **Step 3: Create SiteHeader.tsx**

```tsx
// src/components/layout/SiteHeader.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <Logo />
        <NavLinks className="hidden md:flex" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/assess">
              Start assessment <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create SiteFooter.tsx**

```tsx
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
```

- [ ] **Step 5: Create SiteShell.tsx**

```tsx
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
```

- [ ] **Step 6: Verify build + typecheck**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds. (Note: `Button asChild` requires the `@base-ui/react` Slot — verify the Button component supports `asChild`; if not, wrap the Link around the Button instead. Check `src/components/ui/button.tsx` — if it doesn't forward `asChild`, change the header CTA to `<Link href="/assess"><Button size="sm" className="hidden sm:inline-flex">Start assessment <ArrowRight className="size-3.5" /></Button></Link>`.)

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/
git commit -m "feat(layout): add Logo, NavLinks, SiteHeader, SiteFooter, SiteShell"
```

---

## Phase 3 — Landing Page Rebuild (Requirement 2)

### Task 5: Rewrite the HeroSection (full-width, headline, CTA, scroll cue)

**Files:**
- Modify: `src/components/landing/HeroSection.tsx`
- Modify: `src/components/landing/CTAButton.tsx`
- Modify: `src/app/page.tsx`

**Goal:** A full-width hero with a clear value proposition, two CTAs (Start assessment / See how it works), a secondary demo link, and a scroll cue. No emoji, no glow, no neon gradient text. Wrapped in `SiteShell`.

- [ ] **Step 1: Rewrite CTAButton.tsx** (used by the hero — keep it as a flexible card-button)

```tsx
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
```

- [ ] **Step 2: Rewrite HeroSection.tsx**

```tsx
// src/components/landing/HeroSection.tsx
"use client";

import { MessageSquare, FileText, ArrowDown, Play } from "lucide-react";
import Link from "next/link";
import { CTAButton } from "./CTAButton";
import { Reveal } from "./Reveal";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Subtle background accent — not a neon gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklch,var(--primary)_8%,transparent),transparent)]" />
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" />
            Grounded in 11 established frameworks
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Understand your digital &amp; AI maturity in{" "}
            <span className="text-primary">minutes, not months</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            A conversational assessment that builds a defensible maturity scorecard in real time —
            then sequences a personalized transformation roadmap. The operating system for digital
            &amp; AI maturity.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/assess"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start your assessment
            </Link>
            <Link
              href="/methodology"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Play className="size-4" /> How it works
            </Link>
          </div>
          <Link
            href="/assess?demo=true"
            className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            or load a demo company →
          </Link>
        </Reveal>

        <Reveal delay={0.15} className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
          <CTAButton
            href="/assess"
            icon={MessageSquare}
            title="Start a conversation"
            description="Talk to the AI consultant. It leads, probes, and scores — you just answer."
            variant="primary"
          />
          <CTAButton
            href="/assess?mode=upload"
            icon={FileText}
            title="Upload documents first"
            description="Upload strategy decks, org charts, or tech inventories for AI-powered analysis."
            variant="secondary"
          />
        </Reveal>

        <div className="mt-20 flex justify-center">
          <a href="#highlights" className="text-muted-foreground hover:text-foreground" aria-label="Scroll down">
            <ArrowDown className="size-5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Rewrite page.tsx to compose the hero + sections + SiteShell**

```tsx
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
```

- [ ] **Step 4: Verify build (the imported sections don't exist yet — they're created in Tasks 6–8)**

This task creates the hero and rewires `page.tsx`, but `StatTiles`/`HowItWorks`/`ScorecardPreview`/`CredibilitySection`/`FinalCTA` are created in Tasks 6–8. To keep this task independently buildable, create minimal placeholder versions now and flesh them out in Tasks 6–8. Create these stub files so `page.tsx` compiles:

```tsx
// src/components/landing/StatTiles.tsx (STUB — replaced in Task 6)
export function StatTiles() { return <section className="py-16" />; }
```
```tsx
// src/components/landing/HowItWorks.tsx (STUB — replaced in Task 7)
"use client";
export function HowItWorks() { return <section className="py-16" />; }
```
```tsx
// src/components/landing/ScorecardPreview.tsx (STUB — replaced in Task 8)
export function ScorecardPreview() { return <section className="py-16" />; }
```
```tsx
// src/components/landing/CredibilitySection.tsx (STUB — replaced in Task 8)
export function CredibilitySection() { return <section className="py-16" />; }
```
```tsx
// src/components/landing/FinalCTA.tsx (STUB — replaced in Task 8)
export function FinalCTA() { return <section className="py-16" />; }
```

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds (landing renders hero + empty stubs).

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/HeroSection.tsx src/components/landing/CTAButton.tsx src/app/page.tsx src/components/landing/StatTiles.tsx src/components/landing/HowItWorks.tsx src/components/landing/ScorecardPreview.tsx src/components/landing/CredibilitySection.tsx src/components/landing/FinalCTA.tsx
git commit -m "feat(landing): rewrite hero (full-width, CTA, scroll cue) + rewire page"
```

---

### Task 6: Build StatTiles (key highlights)

**Files:**
- Modify: `src/components/landing/StatTiles.tsx` (replace stub)

**Goal:** A row of 4 stat tiles with scroll-reveal, conveying business value + technical depth.

- [ ] **Step 1: Replace StatTiles.tsx**

```tsx
// src/components/landing/StatTiles.tsx
"use client";

import { Reveal } from "./Reveal";

const STATS = [
  { value: "7", label: "Maturity dimensions", sub: "30 criteria, 5 levels each" },
  { value: "15 min", label: "Average assessment", sub: "replaces weeks of surveys" },
  { value: "11", label: "Reference frameworks", sub: "synthesized, not invented" },
  { value: "0–100", label: "AI Readiness score", sub: "composite, cross-cutting" },
];

export function StatTiles() {
  return (
    <section className="py-16 md:py-20">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08}>
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm font-medium text-foreground">{stat.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/StatTiles.tsx
git commit -m "feat(landing): add StatTiles key-highlights row"
```

---

### Task 7: Build HowItWorks (3-step section with scroll reveals)

**Files:**
- Modify: `src/components/landing/HowItWorks.tsx` (replace stub)

**Goal:** A 3-step "how it works" section — each step is a card with an icon, title, description, and a numbered connector. Scroll-revealed.

- [ ] **Step 1: Replace HowItWorks.tsx**

```tsx
// src/components/landing/HowItWorks.tsx
"use client";

import { MessagesSquare, Gauge, Map } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    icon: MessagesSquare,
    title: "Converse with the AI consultant",
    body: "The agent leads — it greets you, asks targeted questions about your organization, and connects insights across the 7 dimensions. No surveys, no checkboxes.",
  },
  {
    n: "02",
    icon: Gauge,
    title: "Watch the scorecard build live",
    body: "Every answer becomes evidence. The scorecard fills in real time as the agent scores each dimension with confidence-weighted, evidence-traceable levels.",
  },
  {
    n: "03",
    icon: Map,
    title: "Get a sequenced transformation roadmap",
    body: "When assessment is complete, you receive a personalized 3-phase roadmap that respects dependencies — data before AI, governance before scaling.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            From conversation to defensible scorecard to sequenced roadmap — in one sitting.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.1}>
              <div className="relative h-full rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <span className="text-sm font-mono font-semibold text-accent">{step.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/HowItWorks.tsx
git commit -m "feat(landing): add HowItWorks 3-step section with scroll reveals"
```

---

### Task 8: Build ScorecardPreview, CredibilitySection, FinalCTA

**Files:**
- Modify: `src/components/landing/ScorecardPreview.tsx` (replace stub)
- Modify: `src/components/landing/CredibilitySection.tsx` (replace stub)
- Modify: `src/components/landing/FinalCTA.tsx` (replace stub)

**Goal:** (a) A product-preview mockup showing a radar chart + dimension bars (static, built with recharts using sample data) to show what the scorecard looks like. (b) A credibility strip listing the 11 reference frameworks as wordmarks. (c) A final CTA band.

- [ ] **Step 1: Replace ScorecardPreview.tsx**

```tsx
// src/components/landing/ScorecardPreview.tsx
"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Reveal } from "./Reveal";

const SAMPLE = [
  { dim: "Strategy", score: 3.4 },
  { dim: "Technology", score: 3.0 },
  { dim: "Data & AI", score: 2.6 },
  { dim: "Governance", score: 2.2 },
  { dim: "Culture", score: 3.1 },
  { dim: "Operations", score: 2.8 },
  { dim: "Customer", score: 2.9 },
];

export function ScorecardPreview() {
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">Live scorecard</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            The scorecard builds as you talk
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dimensions fill in real time as the agent gathers evidence. Every score is confidence-weighted
            and traceable to what you said or uploaded — no black-box ratings.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> Digital Maturity Score (1–5, weighted)</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" /> AI Readiness Score (0–100, composite)</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> Benchmark delta vs. industry peers</li>
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Maturity snapshot</span>
              <span className="text-xs text-muted-foreground">sample</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={SAMPLE}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace CredibilitySection.tsx**

```tsx
// src/components/landing/CredibilitySection.tsx
import { loadFramework } from "@/lib/framework/config";
import { Reveal } from "./Reveal";

export function CredibilitySection() {
  const config = loadFramework("v2.0");
  const names = Object.keys(config.referenceFrameworks);
  return (
    <section className="border-y border-border bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Grounded in established frameworks
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our model synthesizes the convergent dimensions across {names.length} established digital
            transformation and AI maturity frameworks — not invented from scratch.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {names.map((name) => (
              <span key={name} className="text-sm font-medium text-muted-foreground/70 hover:text-foreground transition-colors">
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Replace FinalCTA.tsx**

```tsx
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
            href="/assess"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start your assessment <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 4: Verify build + add SiteShell footer back to landing**

The landing `page.tsx` (Task 5) used `footer={false}`. Now that all sections exist, the footer should show on the landing page. Update `src/app/page.tsx`: change `<SiteShell footer={false}>` to `<SiteShell>`.

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; landing page is complete with hero + stats + how-it-works + preview + credibility + final CTA + footer.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/ScorecardPreview.tsx src/components/landing/CredibilitySection.tsx src/components/landing/FinalCTA.tsx src/app/page.tsx
git commit -m "feat(landing): add scorecard preview, credibility strip, final CTA"
```

---

## Phase 4 — Methodology Page Redesign (Requirement 4)

### Task 9: Build the interactive ScoreSimulator

**Files:**
- Create: `src/components/methodology/ScoreSimulator.tsx`
- Test: `src/components/methodology/__tests__/ScoreSimulator.test.tsx`

**Goal:** A live, interactive scoring simulator. The user drags a slider on a criterion's 1–5 level; the dimension score, criterion confidence, and AI-readiness recompute live using the REAL `scoring.ts` functions. This tangibly shows "how the score is made."

**Interfaces:**
- Consumes: `loadFramework("v2.0")` for the strategy dimension's criteria; `calculateDimensionScore`, `calculateAIReadinessScore`, `getDimensionLevel` from `@/lib/assessment/scoring`. The `DimensionAssessment` type (with `criterionScores` + `criterionConfidence`).
- Produces: a client component rendering 4 sliders (strategy's 4 criteria) + a live readout panel (dimension score + level + a mini AI-readiness gauge).

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/methodology/__tests__/ScoreSimulator.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreSimulator } from "../ScoreSimulator";

describe("ScoreSimulator", () => {
  it("renders a slider for each strategy criterion", () => {
    render(<ScoreSimulator />);
    // strategy has 4 criteria: digital_vision, executive_sponsorship, investment_commitment, governance_structure
    expect(screen.getByLabelText(/Digital & AI Vision/i)).toBeTruthy();
    expect(screen.getByLabelText(/Executive Sponsorship/i)).toBeTruthy();
    expect(screen.getByLabelText(/Investment Commitment/i)).toBeTruthy();
    expect(screen.getByLabelText(/Transformation Governance/i)).toBeTruthy();
  });

  it("updates the dimension score when a slider changes", () => {
    render(<ScoreSimulator />);
    const scoreBefore = screen.getByTestId("dim-score").textContent;
    const slider = screen.getByLabelText(/Digital & AI Vision/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "5" } });
    const scoreAfter = screen.getByTestId("dim-score").textContent;
    expect(scoreAfter).not.toEqual(scoreBefore);
  });

  it("computes a score in the 1–5 range", () => {
    render(<ScoreSimulator />);
    // set all sliders to 5
    const sliders = screen.getAllByRole("slider");
    for (const s of sliders) fireEvent.change(s, { target: { value: "5" } });
    const score = parseFloat(screen.getByTestId("dim-score").textContent ?? "0");
    expect(score).toBeGreaterThan(4.9);
    expect(score).toBeLessThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/methodology/__tests__/ScoreSimulator.test.tsx`
Expected: FAIL — `ScoreSimulator` not found.

- [ ] **Step 3: Implement ScoreSimulator.tsx**

```tsx
// src/components/methodology/ScoreSimulator.tsx
"use client";

import { useMemo, useState } from "react";
import { loadFramework } from "@/lib/framework/config";
import {
  calculateDimensionScore,
  calculateAIReadinessScore,
  getDimensionLevel,
} from "@/lib/assessment/scoring";
import type { DimensionAssessment } from "@/lib/assessment/types";

export function ScoreSimulator() {
  const config = useMemo(() => loadFramework("v2.0"), []);
  const strategy = config.dimensions.find((d) => d.id === "strategy")!;
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(strategy.criteria.map((c) => [c.id, 3]))
  );

  // For the simulator, give every scored criterion full confidence (1.0) so the
  // slider directly drives the score. The real engine derives confidence from
  // evidence; here we isolate the scoring math.
  const dimAssessment: DimensionAssessment = {
    dimensionId: "strategy",
    score: 0,
    confidence: 1,
    evidence: [],
    gaps: [],
    criterionScores: scores,
    criterionConfidence: Object.fromEntries(Object.keys(scores).map((k) => [k, 1])),
  };

  const dimScore = calculateDimensionScore(dimAssessment, config);
  const level = getDimensionLevel(dimScore);

  // Build a dimensions map where only strategy has scores, for the AI-readiness calc.
  const allDims = useMemo(() => {
    const map: Record<string, DimensionAssessment> = {};
    for (const d of config.dimensions) {
      map[d.id] = d.id === "strategy"
        ? dimAssessment
        : { dimensionId: d.id, score: 0, confidence: 0, evidence: [], gaps: [], criterionScores: {}, criterionConfidence: {} };
    }
    return map;
  }, [config, scores]);
  const ai = calculateAIReadinessScore(allDims, config);
  const aiStrategy = ai.components.ai_strategy ?? 0;

  return (
    <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Try it: score Strategy &amp; Leadership</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag each criterion&apos;s level (1–5). The dimension score and AI-readiness recompute live,
          using the same functions as the real assessment.
        </p>
        <div className="mt-5 space-y-4">
          {strategy.criteria.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between">
                <label htmlFor={c.id} className="text-sm font-medium text-foreground">{c.name}</label>
                <span className="text-sm font-mono text-primary">{scores[c.id].toFixed(1)}</span>
              </div>
              <input
                id={c.id}
                aria-label={c.name}
                type="range"
                min={1}
                max={5}
                step={1}
                value={scores[c.id]}
                onChange={(e) => setScores((s) => ({ ...s, [c.id]: Number(e.target.value) }))}
                className="mt-2 w-full accent-primary"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-center gap-4 rounded-xl bg-muted/30 p-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Dimension score</div>
          <div data-testid="dim-score" className="text-4xl font-bold text-primary">{dimScore.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Level {level.level} · {level.name}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">AI Strategy readiness</div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-accent transition-all" style={{ width: `${aiStrategy}%` }} />
          </div>
          <div className="mt-1 text-sm font-mono text-accent">{aiStrategy}/100</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/methodology/__tests__/ScoreSimulator.test.tsx`
Expected: PASS (3/3). If the `accent-primary` class isn't recognized, use inline `style={{ accentColor: "var(--primary)" }}` on the input instead.

- [ ] **Step 5: Commit**

```bash
git add src/components/methodology/ScoreSimulator.tsx src/components/methodology/__tests__/ScoreSimulator.test.tsx
git commit -m "feat(methodology): add interactive ScoreSimulator (live scoring math)"
```

---

### Task 10: Build the ReferencesCarousel (snap-scroll)

**Files:**
- Create: `src/components/methodology/ReferencesCarousel.tsx`

**Goal:** A horizontal snap-scroll carousel of the 11 reference frameworks as cards (initials avatar + name + contribution + external link). Replaces the text grid.

- [ ] **Step 1: Implement ReferencesCarousel.tsx**

```tsx
// src/components/methodology/ReferencesCarousel.tsx
"use client";

import { useRef } from "react";
import { loadFramework } from "@/lib/framework/config";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const CONTRIBUTIONS: Record<string, string> = {
  "McKinsey Digital Quotient": "Strategy + Customer + Technology + Org/Culture pillars.",
  "Deloitte Digital Maturity Model": "Strategy + CX + Operations + Culture; 4-level progression.",
  "MIT CISR Digital Business Transformation": "Digital capability × leadership intensity.",
  "Gartner Digital Business Maturity": "5-level model; Information/Technology distinct from Operations.",
  "AWS Well-Architected ML Lens": "Public AI/ML rubric — baseline for our AI-readiness levels.",
  "Microsoft MLOps Maturity Model": "Public MLOps rubric (Levels 0–4).",
  "Google Cloud AI Maturity Framework": "Strategy + Data + Infra + Talent + Governance.",
  "Accenture AI Maturity Index": "Composite 0–100; Strategy + Data/Tech + Talent + Responsible AI.",
  "BCG AI Maturity Model": "Dabbling → AI-Native; Strategy + Data/Tech + Governance.",
  "IDC AI Maturity Model": "5 levels (Laggard → Leader); Strategy + Data + Tech + Talent.",
  "Forrester Digital Maturity Benchmark": "Strategy + CX + Operations + Technology/Ecosystem.",
  "Adobe Digital Maturity Assessment": "Strategy + CX + Tech/Data + Org/Culture + Operations.",
};

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function ReferencesCarousel() {
  const config = loadFramework("v2.0");
  const entries = Object.entries(config.referenceFrameworks);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section id="references" className="py-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Reference frameworks</h2>
          <p className="mt-1 text-sm text-muted-foreground">Synthesized from {entries.length} established models. Scroll →</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scrollBy(-1)} className="flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted" aria-label="Scroll left">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => scrollBy(1)} className="flex size-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted" aria-label="Scroll right">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
      >
        {entries.map(([name, url]) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-72 shrink-0 snap-start flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {initials(name)}
              </div>
              <ExternalLink className="ml-auto size-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="mt-3 text-sm font-semibold text-foreground">{name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{CONTRIBUTIONS[name] ?? "Convergent dimension contribution."}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/methodology/ReferencesCarousel.tsx
git commit -m "feat(methodology): add ReferencesCarousel (horizontal snap-scroll)"
```

---

### Task 11: Build the DependencyMap diagram (SVG, hoverable)

**Files:**
- Create: `src/components/methodology/DependencyMap.tsx`

**Goal:** An SVG diagram: 7 dimension nodes arranged in a ring, with the 12 dependency edges drawn between criteria. Hovering a node highlights its dependencies. Visualizes the "data → AI → MLOps → governance" sequencing.

- [ ] **Step 1: Implement DependencyMap.tsx**

```tsx
// src/components/methodology/DependencyMap.tsx
"use client";

import { useMemo, useState } from "react";
import { loadFramework } from "@/lib/framework/config";

// Ring layout positions for 7 dimensions (percentages of the viewBox).
const ORDER = ["strategy", "technology", "data_ai", "ai_governance", "culture", "operations", "customer"];
const POSITIONS: Record<string, { x: number; y: number }> = {
  strategy: { x: 50, y: 8 },
  technology: { x: 88, y: 30 },
  data_ai: { x: 92, y: 72 },
  ai_governance: { x: 66, y: 95 },
  culture: { x: 34, y: 95 },
  operations: { x: 8, y: 72 },
  customer: { x: 12, y: 30 },
};

export function DependencyMap() {
  const config = useMemo(() => loadFramework("v2.0"), []);
  const [active, setActive] = useState<string | null>(null);

  // Build edges from criterion dependsOn: "dim.crit" → "dim.crit"
  const edges = useMemo(() => {
    const list: { from: string; to: string }[] = [];
    for (const dim of config.dimensions) {
      for (const c of dim.criteria) {
        if (!c.dependsOn) continue;
        for (const dep of c.dependsOn) {
          const fromDim = dep.split(".")[0];
          list.push({ from: fromDim, to: dim.id });
        }
      }
    }
    return list;
  }, [config]);

  const isActive = (dimId: string) =>
    active === dimId || edges.some((e) => (e.from === dimId || e.to === dimId) && (active === e.from || active === e.to));

  return (
    <section className="py-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Dependency map</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {edges.length} cross-dimension dependencies sequence the roadmap. Hover a node to see its connections.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <svg viewBox="0 0 100 100" className="h-auto w-full" role="img" aria-label="Dimension dependency map">
          {/* Edges */}
          {edges.map((e, i) => {
            const a = POSITIONS[e.from];
            const b = POSITIONS[e.to];
            const highlight = active && (active === e.from || active === e.to);
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={highlight ? "var(--accent)" : "var(--border)"}
                strokeWidth={highlight ? 0.8 : 0.4}
                strokeDasharray="2 1.5"
              />
            );
          })}
          {/* Nodes */}
          {ORDER.map((dimId) => {
            const dim = config.dimensions.find((d) => d.id === dimId)!;
            const p = POSITIONS[dimId];
            const on = isActive(dimId);
            return (
              <g
                key={dimId}
                onMouseEnter={() => setActive(dimId)}
                onMouseLeave={() => setActive(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x} cy={p.y} r={on ? 5 : 4}
                  fill={on ? "var(--primary)" : "var(--card)"}
                  stroke="var(--primary)" strokeWidth={0.6}
                />
                <text
                  x={p.x} y={p.y - 6}
                  textAnchor="middle"
                  fontSize={3}
                  fill={on ? "var(--primary)" : "var(--muted-foreground)"}
                  fontWeight={on ? 600 : 400}
                >
                  {dim.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/methodology/DependencyMap.tsx
git commit -m "feat(methodology): add interactive DependencyMap SVG diagram"
```

---

### Task 12: Build the ScoringWalkthrough (scrollytelling) + restyle DimensionMatrix & WhyItMatters

**Files:**
- Create: `src/components/methodology/ScoringWalkthrough.tsx`
- Modify: `src/components/methodology/DimensionMatrix.tsx`
- Modify: `src/components/methodology/WhyItMatters.tsx`

**Goal:** (a) A scrollytelling section where each of the 7 scoring steps reveals on scroll with a small animated illustration. (b) Restyle DimensionMatrix (cards with lucide, accent for benchmark targets, collapsible level lists). (c) Restyle WhyItMatters (icon cards).

- [ ] **Step 1: Create ScoringWalkthrough.tsx**

```tsx
// src/components/methodology/ScoringWalkthrough.tsx
"use client";

import { Reveal } from "@/components/landing/Reveal";
import { ClipboardCheck, ShieldCheck, Layers, Gauge, Sparkles, TrendingUp, GitBranch } from "lucide-react";

const STEPS = [
  { icon: ClipboardCheck, title: "Criterion score (1–5)", body: "The AI scores each criterion against its 5-level rubric, grounded in evidence from the conversation and uploaded documents." },
  { icon: ShieldCheck, title: "Criterion confidence (0–1)", body: "Confidence grows with the strength and volume of evidence. Document evidence counts more than a passing remark. No evidence → zero weight." },
  { icon: Layers, title: "Dimension score", body: "A confidence-weighted average of its criteria. Partially-probed dimensions reflect only what was actually assessed — never a deflated average." },
  { icon: Gauge, title: "Digital Maturity Score", body: "Weighted average of dimensions assessed to ≥70% confidence, divided by assessed-dimension weights only." },
  { icon: Sparkles, title: "AI Readiness Score (0–100)", body: "Composite of 6 cross-cutting components. Strategy and Data weighted 1.5× as leading indicators. Normalized 1–5 → 0–100." },
  { icon: TrendingUp, title: "Benchmark delta", body: "Every criterion has an industry-typical target. The report shows where you lead or lag peers, adjusted for org size and regulation." },
  { icon: GitBranch, title: "Dependency map", body: "12 cross-dimension edges sequence the roadmap so you never scale AI before the foundations are solid." },
];

export function ScoringWalkthrough() {
  return (
    <section id="scoring" className="py-16">
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">How scoring works</h2>
        <p className="mt-1 text-sm text-muted-foreground">Seven steps from evidence to roadmap. Scroll to follow.</p>
      </Reveal>
      <div className="relative space-y-3 border-l border-border pl-6">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.04}>
            <div className="relative">
              <span className="absolute -left-[31px] top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card text-primary">
                <step.icon className="size-3.5" />
              </span>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Restyle DimensionMatrix.tsx** (collapsible per-dimension cards, lucide, accent for benchmark)

```tsx
// src/components/methodology/DimensionMatrix.tsx
"use client";

import { useState } from "react";
import { loadFramework } from "@/lib/framework/config";
import { ChevronDown, Target } from "lucide-react";

export function DimensionMatrix() {
  const config = loadFramework("v2.0");
  const [open, setOpen] = useState<string | null>(config.dimensions[0]?.id ?? null);
  const totalCriteria = config.dimensions.reduce((n, d) => n + d.criteria.length, 0);

  return (
    <section id="matrix" className="py-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">The assessment matrix</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {config.dimensions.length} dimensions · {totalCriteria} criteria · 5 maturity levels each.
        </p>
      </div>
      <div className="space-y-3">
        {config.dimensions.map((dim) => {
          const isOpen = open === dim.id;
          return (
            <div key={dim.id} className="rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : dim.id)}
                className="flex w-full items-center justify-between p-4 text-left"
                aria-expanded={isOpen}
              >
                <div>
                  <div className="text-base font-semibold text-foreground">{dim.name}</div>
                  {dim.weightingRationale && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dim.weightingRationale}</div>
                  )}
                </div>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="grid gap-3 border-t border-border p-4 md:grid-cols-2">
                  {dim.criteria.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        {c.benchmarkTarget !== undefined && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                            <Target className="size-2.5" /> peer L{c.benchmarkTarget}
                          </span>
                        )}
                      </div>
                      <ol className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                        {Object.values(c.levels).map((lvl, i) => (
                          <li key={i}><span className="text-foreground/70">L{i + 1}:</span> {lvl}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Restyle WhyItMatters.tsx**

```tsx
// src/components/methodology/WhyItMatters.tsx
import { Clock, FileSearch, GitBranch, Layers } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const CARDS = [
  { icon: Clock, title: "Cuts months to minutes", body: "A conversational assessment replaces weeks of surveys with a guided 15-minute dialogue — and a defensible scorecard immediately." },
  { icon: FileSearch, title: "Evidence-traceable scores", body: "Every score links back to what you said or uploaded. No black-box ratings — executives can audit each level." },
  { icon: GitBranch, title: "Sequenced, not generic", body: "The dependency map respects reality: data before AI, cloud before data migration, governance before scaling." },
  { icon: Layers, title: "Two scores, one picture", body: "Digital Maturity (where you are) + AI Readiness (whether you can capitalize on AI) — current state and capacity to execute." },
];

const UNIQUE = [
  "Unified digital + AI assessment — most frameworks cover one or the other.",
  "Configurable, versioned framework — JSON-driven, evolves without code changes.",
  "Conversational, not checkbox — closer to a senior consultant than a survey.",
  "Live scorecard — builds in real time as evidence accumulates.",
  "Defensible provenance — every dimension names the established models it aligns to.",
];

export function WhyItMatters() {
  return (
    <section className="py-16">
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Why this drives success</h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <Reveal key={card.title} delay={i * 0.08}>
            <div className="h-full rounded-xl border border-border bg-card p-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <card.icon className="size-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{card.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{card.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-10 rounded-2xl border border-border bg-card/50 p-6">
        <h3 className="text-lg font-semibold text-foreground">What makes it unique</h3>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {UNIQUE.map((u) => (
            <li key={u} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" /> {u}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/methodology/ScoringWalkthrough.tsx src/components/methodology/DimensionMatrix.tsx src/components/methodology/WhyItMatters.tsx
git commit -m "feat(methodology): add scrollytelling walkthrough + restyle matrix & why-it-matters"
```

---

## Phase 5 — Compose Methodology Page + Apply Chrome to App Pages (Requirements 3 & 5)

### Task 13: Rebuild the methodology page (compose all interactive sections + SiteShell)

**Files:**
- Modify: `src/app/methodology/page.tsx`
- Delete: `src/components/methodology/ScoringFormula.tsx` (replaced by ScoringWalkthrough + ScoreSimulator)
- Delete: `src/components/methodology/ReferenceFrameworks.tsx` (replaced by ReferencesCarousel)

**Goal:** Compose the page: hero header → matrix → scoring walkthrough → score simulator → dependency map → references carousel → why-it-matters. All wrapped in `SiteShell` (full width — `maxWidth="max-w-none"` with per-section internal padding).

- [ ] **Step 1: Rewrite methodology/page.tsx**

```tsx
// src/app/methodology/page.tsx
import { SiteShell } from "@/components/layout/SiteShell";
import { Reveal } from "@/components/landing/Reveal";
import { DimensionMatrix } from "@/components/methodology/DimensionMatrix";
import { ScoringWalkthrough } from "@/components/methodology/ScoringWalkthrough";
import { ScoreSimulator } from "@/components/methodology/ScoreSimulator";
import { DependencyMap } from "@/components/methodology/DependencyMap";
import { ReferencesCarousel } from "@/components/methodology/ReferencesCarousel";
import { WhyItMatters } from "@/components/methodology/WhyItMatters";
import { loadFramework } from "@/lib/framework/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MethodologyPage() {
  const config = loadFramework("v2.0");
  return (
    <SiteShell>
      <section className="py-16 md:py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">Methodology</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            How the assessment works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {config.description}
          </p>
          <Link
            href="/assess"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start your assessment <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </section>
      <DimensionMatrix />
      <ScoringWalkthrough />
      <section className="py-16">
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">See the math in action</h2>
          <p className="mt-1 text-sm text-muted-foreground">Drag the sliders. The score updates live.</p>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mx-auto max-w-4xl">
            <ScoreSimulator />
          </div>
        </Reveal>
      </section>
      <DependencyMap />
      <ReferencesCarousel />
      <WhyItMatters />
    </SiteShell>
  );
}
```

- [ ] **Step 2: Delete the replaced text components**

```bash
rm src/components/methodology/ScoringFormula.tsx src/components/methodology/ReferenceFrameworks.tsx
```

- [ ] **Step 3: Verify build (no dangling imports)**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; `/methodology` prerenders. If `tsc` errors on a leftover import of the deleted components elsewhere, fix the import (grep: `grep -rn "ScoringFormula\|ReferenceFrameworks" src/`).

- [ ] **Step 4: Commit**

```bash
git add src/app/methodology/page.tsx
git rm src/components/methodology/ScoringFormula.tsx src/components/methodology/ReferenceFrameworks.tsx
git commit -m "feat(methodology): compose interactive page (matrix, walkthrough, simulator, map, carousel)"
```

---

### Task 14: Apply SiteShell to the assess + report pages + restyle app chrome

**Files:**
- Modify: `src/app/assess/page.tsx`
- Modify: `src/app/report/page.tsx`
- Modify: `src/components/assess/ChatPanel.tsx`
- Modify: `src/components/assess/ChatInput.tsx`
- Modify: `src/components/assess/VoiceOverlay.tsx`
- Modify: `src/components/shared/GradientCard.tsx`
- Modify: `src/components/shared/ScoreBadge.tsx`

**Goal:** (a) Wrap `/assess` and `/report` in `SiteShell` (assess: header only, no footer — full-height app; report: full shell). (b) Replace emoji in ChatPanel/ChatInput/VoiceOverlay with lucide icons. (c) Restyle shared GradientCard/ScoreBadge to the new tokens (drop `gradient-text`/`glow` usage).

- [ ] **Step 1: Wrap the assess page in SiteShell (header only)**

In `src/app/assess/page.tsx`, the current outer `<div className="h-screen flex flex-col">` has its own header. Replace that local header with `SiteShell`. The assess page is a full-height app, so use `SiteShell` with `footer={false}` and `maxWidth="max-w-none"`. 

Read the current assess page (`sed -n '56,101p' src/app/assess/page.tsx`) to see the return structure. Replace the outer `<div className="h-screen flex flex-col"> ... </div>` with:

```tsx
  return (
    <SiteShell footer={false} maxWidth="max-w-none">
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-border">
            <ChatPanel onAssessmentUpdate={handleAssessmentUpdate} onComplete={handleComplete} />
          </div>
          <div className="w-1/2">
            <ScorecardPanel delta={delta} documentCount={documentCount} />
          </div>
        </div>
        {isComplete && delta && (
          <div className="border-t border-border px-4 py-3 flex justify-center shrink-0">
            <a href="/report" className="gradient-primary text-white font-semibold px-8 py-2 rounded-lg hover:opacity-90 transition-opacity inline-block">
              View Full Report & Roadmap →
            </a>
          </div>
        )}
      </div>
    </SiteShell>
  );
```

Add `import { SiteShell } from "@/components/layout/SiteShell";` at the top. Remove the old local `<header>` block (the SiteShell provides the header). The `h-[calc(100vh-3.5rem)]` accounts for the 14-unit (3.5rem) sticky header.

- [ ] **Step 2: Wrap the report page in SiteShell**

In `src/app/report/page.tsx`, replace the local `<header>` + `<main>` structure with `SiteShell`. Read the current return (`sed -n '62,106p' src/app/report/page.tsx`). Replace the `<ErrorBoundary><div className="min-h-screen"> ... </div></ErrorBoundary>` with:

```tsx
  return (
    <ErrorBoundary>
      <SiteShell maxWidth="max-w-6xl">
        <div className="py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Transformation report</h1>
            <p className="text-sm text-muted-foreground">AI Transformation Navigator</p>
          </div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted/30">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6"><OverviewTab delta={delta} /></TabsContent>
            <TabsContent value="deepdive" className="mt-6"><DeepDiveTab delta={delta} /></TabsContent>
            <TabsContent value="roadmap" className="mt-6"><RoadmapTab delta={delta} orgName={effectiveOrgName} industry={effectiveIndustry} /></TabsContent>
            <TabsContent value="export" className="mt-6"><ExportTab delta={delta} orgName={effectiveOrgName} /></TabsContent>
          </Tabs>
        </div>
      </SiteShell>
    </ErrorBoundary>
  );
```

Add `import { SiteShell } from "@/components/layout/SiteShell";`. Remove the old local `<header>` and the "← New Assessment" link (the SiteShell nav covers it). Also update the loading state: replace `<div className="min-h-screen flex items-center justify-center">` with `<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">`.

- [ ] **Step 3: Replace emoji in ChatInput.tsx with lucide icons**

In `src/components/assess/ChatInput.tsx`, replace the 📎 and 🎤 emoji with lucide icons. Read the file first. Replace:
- `📎` → `<Paperclip className="size-4" />`
- `🎤` → `<Mic className="size-4" />`
- `→` (the send button) → `<ArrowRight className="size-4" />`

Add `import { Paperclip, Mic, ArrowRight } from "lucide-react";` at the top.

- [ ] **Step 4: Replace emoji in ChatPanel.tsx and VoiceOverlay.tsx**

In `src/components/assess/ChatPanel.tsx`, replace the "🎤 Voice mode" text button with a lucide icon + label:
- The voice toggle button: replace `🎤 Voice mode` with `<><Mic className="size-4" /> Voice mode</>`. Add `import { Mic } from "lucide-react";`.

In `src/components/assess/VoiceOverlay.tsx`, replace emoji:
- `🔴` (listening) and `🎤` (mic off) in the orb button → use `<Mic className="size-8" />` when off, `<Circle className="size-8 text-red-500" />` (or a `Square` for "stop") when listening. Add `import { Mic, Circle } from "lucide-react";`. Keep the `animate-pulse` + red styling on the listening state.
- The "⌨ Text input" exit button → `<><Keyboard className="size-3.5" /> Text input</>`. Add `Keyboard` to the import.

- [ ] **Step 5: Restyle GradientCard + ScoreBadge (drop neon/glow)**

Read both files. In `src/components/shared/GradientCard.tsx`, replace any `gradient-primary`/`glow` usage with `border border-border bg-card` (or keep `gradient-primary` — Task 1 made it a solid `bg-primary`, which is fine for an accent card; decide based on current usage). In `src/components/shared/ScoreBadge.tsx`, replace `gradient-text` (now `text-primary`) usage with `text-primary` directly if cleaner. The goal: no visual reliance on the old neon look. Make minimal edits — just ensure the new palette renders cleanly.

- [ ] **Step 6: Verify build + typecheck + full suite**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: tsc clean, all tests pass (the assess/report wiring changes are structural; existing tests should be unaffected — they test the lib, not the page chrome). Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/assess/page.tsx src/app/report/page.tsx src/components/assess/ChatPanel.tsx src/components/assess/ChatInput.tsx src/components/assess/VoiceOverlay.tsx src/components/shared/GradientCard.tsx src/components/shared/ScoreBadge.tsx
git commit -m "feat(chrome): wrap assess+report in SiteShell + replace emoji with lucide + restyle shared"
```

---

## Phase 6 — Report Restyle + Final Verification (Requirement 5)

### Task 15: Restyle the report tabs to the new palette

**Files:**
- Modify: `src/components/report/OverviewTab.tsx`
- Modify: `src/components/report/DeepDiveTab.tsx`
- Modify: `src/components/report/RoadmapTab.tsx`
- Modify: `src/components/report/GapHighlight.tsx`
- Modify: `src/components/report/ExportTab.tsx`
- Modify: `src/components/shared/PhaseTimeline.tsx`

**Goal:** Sweep the report components for old-palette usage (`gradient-text`, `glow`, violet/pink hexes, emoji) and replace with the new tokens. No logic changes — pure restyle. Keep the PDF export's `escapeHtml` and `frameworkVersion` fixes from the prior branch.

- [ ] **Step 1: Audit old-palette usage**

Run: `grep -rn "gradient-text\|glow\|violet-\|pink-\|from-\[#6366f1\]\|via-\[#8b5cf6\]\|to-\[#d946ef\]" src/components/report/ src/components/shared/`
This lists every occurrence to replace. Address each:
- `gradient-text` → `text-primary` (or `text-accent` for emphasis).
- `glow`/`glow-sm` → remove (Task 1 made them no-ops; drop the class).
- `violet-400/500/900` / `pink-400/500` → `primary` / `accent` / `muted-foreground` as appropriate.
- Any hex literals `#6366f1`/`#8b5cf6`/`#d946ef` → `var(--primary)` / `var(--accent)`.

- [ ] **Step 2: Apply the replacements per file**

For each file in the audit, make the edits. Examples:
- `OverviewTab.tsx`: the score color classes (`text-red-400`/`text-amber-400`/`text-emerald-400`) can stay (semantic), but any `gradient-text` heading → `text-foreground`. The `industryBenchmark` card uses `gradient-primary` (now solid `bg-primary`) — fine, or change to `border border-primary/30 bg-primary/5` for a softer tile.
- `GapHighlight.tsx`: replace `violet`/`pink` accents with `text-accent` / `bg-accent/10`.
- `ExportTab.tsx`: the print-window HTML uses inline styles with `#6366f1`/`#8b5cf6`/`#d946ef` for the gradient header/scores. Replace those with solid `#2563eb` (the primary blue) for the print PDF — so the exported PDF matches the new branding. Keep `escapeHtml` and `delta.frameworkVersion` (from the prior branch). The print-window `<style>` block: replace the `linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)` with `color: #2563eb` (solid) for headings/scores, and the body background `#0a0a0a` can stay dark for the PDF (print-friendly) or switch to white — keep dark for consistency with the product.
- `PhaseTimeline.tsx` + `RoadmapTab.tsx`: replace emoji (if any) with lucide; replace `gradient-text`/`glow`.

- [ ] **Step 3: Verify build + typecheck**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; report tabs render in the new palette.

- [ ] **Step 4: Commit**

```bash
git add src/components/report/ src/components/shared/PhaseTimeline.tsx
git commit -m "style(report): restyle tabs to new palette (blue + gold), drop neon/glow"
```

---

### Task 16: Final verification — typecheck, tests, build, visual smoke

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all green (the new ScoreSimulator test + useTheme test + existing 172).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; routes `/`, `/assess`, `/methodology`, `/report` all compile.

- [ ] **Step 4: Visual smoke (use the run skill)**

Run `npm run dev`, then verify:
1. **Landing (`/`):** sticky header with logo + nav + theme toggle + CTA; hero with headline + 2 CTAs + scroll cue; scroll reveals on stat tiles, how-it-works, scorecard preview (radar), credibility strip, final CTA; footer present.
2. **Theme toggle:** click sun/moon in header → page switches dark↔light, persists on reload (no flash).
3. **Methodology (`/methodology`):** header + footer; hero; collapsible matrix (click a dimension to expand); scrollytelling scoring walkthrough (reveal on scroll); score simulator (drag sliders → score updates live); dependency map (hover nodes → edges highlight); references carousel (horizontal snap-scroll + arrow buttons); why-it-matters icon cards.
4. **Assess (`/assess`):** header (no footer); chat panel + scorecard; voice mode toggle (Mic icon, no emoji); text input has Paperclip + Mic + ArrowRight icons. Agent kickoff fires on load.
5. **Report (`/report?demo=true`):** header + footer; 4 tabs render in new palette; PDF export produces a blue-headed PDF.
6. **Full-width:** landing sections use the viewport width (max-w-7xl content within full-bleed sections); methodology sections likewise.

- [ ] **Step 5: Commit any verification fixes**

```bash
git add -A && git commit -m "chore: verification fixes from UI redesign smoke"
```

---

## Self-Review

**1. Spec coverage (the 5 requirements):**

- **Req 1 — less "AI-generated", simplified, dark default + white theme, business/digital-transformation expertise, tech focus, chosen theme color.**
  - Palette: blue + warm white + gold accent (Task 1). Neon/glow removed (Task 1).
  - Dark default + light toggle (Task 2). 
  - Business/consulting feel: restrained palette, lucide icons (no emoji), proper header/footer/nav (Tasks 4, 14).
  - ✅ Covered.

- **Req 2 — landing page: header, logo, intro, key highlights, CTA, scroll-down animations.**
  - Hero with logo (in header), headline + intro, CTAs, scroll cue (Task 5).
  - StatTiles key highlights (Task 6).
  - HowItWorks 3-step with scroll reveals (Task 7).
  - ScorecardPreview + CredibilitySection + FinalCTA (Task 8).
  - Scroll animations via framer-motion Reveal (Task 3).
  - ✅ Covered.

- **Req 3 — all pages have header, footer, navigation bar.**
  - SiteHeader (logo + nav + theme toggle + CTA), SiteFooter, SiteShell (Task 4).
  - Applied to landing (Task 5/8), methodology (Task 13), assess (Task 14), report (Task 14).
  - ✅ Covered.

- **Req 4 — methodology page: less text-heavy, illustrations, interactive (toggle, scroll, clicks), references displayed nicer (horizontal snap-scroll with logos/images).**
  - ScoreSimulator (interactive sliders, live math) — Task 9.
  - ReferencesCarousel (horizontal snap-scroll) — Task 10.
  - DependencyMap (interactive SVG, hover) — Task 11.
  - ScoringWalkthrough (scrollytelling) — Task 12.
  - DimensionMatrix restyled (collapsible, lucide, accent) — Task 12.
  - ✅ Covered. (Logos: using initials avatars rather than company logo images, since we don't have logo assets — the brief allowed "if too heavy with company logos will do too," and initials-in-a-tile is a clean, asset-free equivalent. If the user wants real logos later, that's a follow-up asset task.)

- **Req 5 — UI enriched, modern, clear, simple, beautiful; full screen width where possible with good composition.**
  - Full-width sections (max-w-7xl content within full-bleed sections), restrained palette, consistent spacing, lucide icons, framer-motion reveals, radar preview, SVG dependency map.
  - Report tabs restyled (Task 15).
  - ✅ Covered.

**2. Placeholder scan:** Searched for "TBD", "TODO", "implement later", "add error handling", "similar to Task N", "fill in details". None present as instructions. The only conditional instruction ("if `Button asChild` isn't supported, wrap Link around Button" in Task 4 Step 6, and "if `accent-primary` isn't recognized, use inline style" in Task 9 Step 4) are concrete fallbacks with exact code, not placeholders. The stubs in Task 5 Step 4 are explicit minimal components fleshed out in Tasks 6–8 — the plan says so and the stubs are real (compilable) code. No placeholder violations.

**3. Type consistency:**
- `useTheme()` returns `{ theme, setTheme, toggle }` — defined Task 2, used Task 2 (ThemeToggle). Consistent.
- `Theme` type = `"dark" | "light"` — defined in `src/lib/theme.ts` (Task 2), imported by useTheme. Consistent.
- `Reveal` props `{ children, delay?, className? }` — defined Task 3, used Tasks 5–8, 12, 13. Consistent.
- `SiteShell` props `{ children, footer?, maxWidth? }` — defined Task 4, used Tasks 5, 13, 14. Consistent.
- `CTAButton` props `{ href, icon: LucideIcon, title, description, variant? }` — defined Task 5, used Task 5. The `icon` prop type changed from `ReactNode` (old) to `LucideIcon` (new) — the hero passes `MessageSquare`/`FileText` (lucide components), matching. Consistent.
- `ScoreSimulator` — uses `DimensionAssessment` (with `criterionScores` + `criterionConfidence`), `calculateDimensionScore`, `calculateAIReadinessScore`, `getDimensionLevel` — all from the existing (post-overhaul) scoring module. Consistent.
- `loadFramework("v2.0")` returns the config with `dimensions[].criteria[].levels` (string→string map), `benchmarkTarget`, `dependsOn`, `referenceFrameworks` — used in Tasks 8, 9, 10, 11, 12. Consistent with v2.0.

**4. Risks / order dependencies:**
- Task 5 creates stubs for sections fleshed out in Tasks 6–8, so `page.tsx` compiles at every task. Noted explicitly.
- Task 13 deletes `ScoringFormula.tsx` + `ReferenceFrameworks.tsx` — must happen after Task 12 (ScoringWalkthrough) and Task 10 (ReferencesCarousel) exist, so the methodology page has replacements. Task 13 is sequenced after both. ✓
- Task 14 wraps assess/report in SiteShell — the assess page's full-height layout uses `h-[calc(100vh-3.5rem)]` to account for the 3.5rem sticky header. If the header height changes, this breaks — but it's 14 (h-14 = 3.5rem) per Task 4. Consistent.
- framer-motion is a client lib; all components using it have `"use client"`. The `Reveal` wrapper is a client component imported into server components (landing sections) — that's fine in App Router (client components can be children of server components). The server components that import `Reveal` (e.g., `CredibilitySection` in Task 8) — wait, `CredibilitySection` imports `Reveal` and is a server component (no `"use client"`). That's allowed: a server component can render a client component. But `CredibilitySection` calls `loadFramework` (sync) and passes children to `Reveal`. ✓. However, `HowItWorks` (Task 7) and `StatTiles` (Task 6) and `FinalCTA` (Task 8) ARE marked `"use client"` because they use `Reveal` directly with JSX — actually `Reveal` is the client component; the parent can be server or client. The plan marks some as `"use client"` (HowItWorks, StatTiles, ScorecardPreview, FinalCTA) — that's safe. `CredibilitySection` is NOT marked `"use client"` but imports `Reveal` — that's fine (server rendering a client component). ✓
- The `@vitest-environment jsdom` pragma on the new test files (Tasks 2, 9) — consistent with the Task 9 pattern from the prior plan (per-file pragma, global config stays node). ✓

No gaps found. Plan is complete.
