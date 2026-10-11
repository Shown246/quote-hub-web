"use client";

import { useSyncExternalStore, useCallback } from "react";

export type PresentationMode = "card" | "simple";

export const PRESENTATION_MODE_KEY = "quote-hub-presentation-mode";

function subscribeToPresentationMode(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("quote-hub-presentation-mode-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("quote-hub-presentation-mode-change", callback);
  };
}

function getClientSnapshot(): PresentationMode {
  if (typeof window === "undefined") return "card";
  const stored = localStorage.getItem(PRESENTATION_MODE_KEY);
  if (stored === "card" || stored === "simple") {
    return stored;
  }
  return "card";
}

function getServerSnapshot(): PresentationMode {
  return "card";
}

export function usePresentationMode() {
  const mode = useSyncExternalStore(
    subscribeToPresentationMode,
    getClientSnapshot,
    getServerSnapshot
  );

  const setMode = useCallback((newMode: PresentationMode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PRESENTATION_MODE_KEY, newMode);
      window.dispatchEvent(new Event("quote-hub-presentation-mode-change"));
    }
  }, []);

  const toggleMode = useCallback(() => {
    const current = getClientSnapshot();
    const next: PresentationMode = current === "card" ? "simple" : "card";
    if (typeof window !== "undefined") {
      localStorage.setItem(PRESENTATION_MODE_KEY, next);
      window.dispatchEvent(new Event("quote-hub-presentation-mode-change"));
    }
  }, []);

  return { mode, setMode, toggleMode };
}
