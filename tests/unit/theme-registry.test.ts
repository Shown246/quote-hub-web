// quote-hub-web/tests/unit/theme-registry.test.ts
import { describe, it, expect } from "vitest";
import { getThemeDefinition } from "@/themes/registry";

describe("Theme Registry", () => {
  it("returns classic-serif theme styles correctly", () => {
    const theme = getThemeDefinition("classic-serif");
    expect(theme.key).toBe("classic-serif");
    expect(theme.fontFamily).toContain("serif");
  });

  it("falls back to default modern-sans theme for unknown theme keys", () => {
    const theme = getThemeDefinition("unknown-theme-key");
    expect(theme.key).toBe("modern-sans");
  });
});
