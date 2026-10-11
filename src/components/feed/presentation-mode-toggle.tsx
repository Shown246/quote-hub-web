"use client";

import React from "react";
import { LayoutGrid, AlignLeft } from "lucide-react";
import { usePresentationMode, PresentationMode } from "@/hooks/use-presentation-mode";
import { Button } from "@/components/ui/button";

interface PresentationModeToggleProps {
  mode?: PresentationMode;
  onToggle?: () => void;
  className?: string;
}

export function PresentationModeToggle({
  mode: propMode,
  onToggle: propOnToggle,
  className,
}: PresentationModeToggleProps) {
  const hook = usePresentationMode();
  const currentMode = propMode ?? hook.mode;
  const handleToggle = propOnToggle ?? hook.toggleMode;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={className}
      aria-label={`Switch to ${currentMode === "card" ? "simple" : "card"} mode`}
      title={`Current: ${currentMode} mode. Click to switch.`}
    >
      {currentMode === "card" ? (
        <>
          <LayoutGrid className="mr-2 h-4 w-4" />
          <span>Card Mode</span>
        </>
      ) : (
        <>
          <AlignLeft className="mr-2 h-4 w-4" />
          <span>Simple Mode</span>
        </>
      )}
    </Button>
  );
}
