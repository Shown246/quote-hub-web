"use client";

import React from "react";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { TrendingWidget } from "@/components/feed/trending-widget";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  showTrending?: boolean;
  className?: string;
}

export function AppShell({
  children,
  showTrending = true,
  className,
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground flex justify-center", className)}>
      <div className="flex w-full max-w-7xl justify-between">
        {/* Desktop Left Sidebar Navigation */}
        <aside
          className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-border h-screen sticky top-0 overflow-y-auto"
          aria-label="Desktop Sidebar"
        >
          <SidebarNav />
        </aside>

        {/* Central Content Area */}
        <main className="flex-1 min-w-0 max-w-3xl pb-20 md:pb-8">
          {children}
        </main>

        {/* Desktop Right Trending Column */}
        {showTrending && (
          <aside
            className="hidden xl:block w-80 shrink-0 border-l border-border p-4 h-screen sticky top-0 overflow-y-auto"
            aria-label="Trending Sidebar"
          >
            <TrendingWidget />
          </aside>
        )}
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
