import { ThemeDefinition } from "./types";
import { classicSerifTheme } from "./classic-serif";
import { modernSansTheme } from "./modern-sans";
import { minimalEditorialTheme } from "./minimal-editorial";

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  "classic-serif": classicSerifTheme,
  "modern-sans": modernSansTheme,
  "minimal-editorial": minimalEditorialTheme,
};

export const DEFAULT_THEME_KEY = "modern-sans";

export function getThemeDefinition(themeKey?: string | null): ThemeDefinition {
  if (!themeKey) {
    return modernSansTheme;
  }
  return THEME_REGISTRY[themeKey] || modernSansTheme;
}
