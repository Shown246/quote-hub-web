// quote-hub-web/tests/unit/presentation-mode.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { usePresentationMode } from "@/hooks/use-presentation-mode";

describe("usePresentationMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to card presentation mode", () => {
    const { result } = renderHook(() => usePresentationMode());
    expect(result.current.mode).toBe("card");
  });

  it("toggles mode and persists to localStorage", () => {
    const { result } = renderHook(() => usePresentationMode());
    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.mode).toBe("simple");
    expect(localStorage.getItem("quote-hub-presentation-mode")).toBe("simple");
  });

  it("synchronizes across external storage events and dispatches", () => {
    const { result } = renderHook(() => usePresentationMode());
    expect(result.current.mode).toBe("card");

    act(() => {
      localStorage.setItem("quote-hub-presentation-mode", "simple");
      window.dispatchEvent(new Event("quote-hub-presentation-mode-change"));
    });

    expect(result.current.mode).toBe("simple");
  });
});
