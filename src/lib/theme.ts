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
