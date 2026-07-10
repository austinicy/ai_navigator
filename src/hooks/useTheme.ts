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
