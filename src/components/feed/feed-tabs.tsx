"use client";

import React from "react";
import Link from "next/link";
import { PresentationModeToggle } from "./presentation-mode-toggle";
import { cn } from "@/lib/utils";

export interface FeedTabsProps {
  activeTab: "for-you" | "following";
  className?: string;
}

export function FeedTabs({ activeTab, className }: FeedTabsProps) {
  return (
    <div className={cn("flex items-center justify-between border-b pb-2 mb-6", className)}>
      <nav role="tablist" aria-label="Feed Navigation" className="flex items-center gap-2">
        <Link
          href="/feed/for-you"
          role="tab"
          aria-selected={activeTab === "for-you"}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
            activeTab === "for-you"
              ? "text-foreground font-semibold after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground"
          )}
        >
          For You
        </Link>
        <Link
          href="/feed/following"
          role="tab"
          aria-selected={activeTab === "following"}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
            activeTab === "following"
              ? "text-foreground font-semibold after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-0.5 after:bg-primary"
              : "text-muted-foreground"
          )}
        >
          Following
        </Link>
      </nav>
      <PresentationModeToggle />
    </div>
  );
}
