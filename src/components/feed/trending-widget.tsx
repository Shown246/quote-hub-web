"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Heart, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendingItem {
  id: string;
  text: string;
  isOriginal?: boolean;
  authorName?: string | null;
  likeCount?: number;
  repostCount?: number;
  userId?: string;
  themeKey?: string;
  user?: {
    username?: string;
    displayName?: string;
  };
}

export interface TrendingWidgetProps {
  limit?: number;
  className?: string;
}

export function TrendingWidget({ limit = 5, className }: TrendingWidgetProps) {
  const { data, isLoading, isError } = useQuery<{ data: TrendingItem[] }>({
    queryKey: ["trending", limit],
    queryFn: async () => {
      return apiClient<{ data: TrendingItem[] }>(`/api/v1/trending?limit=${limit}`);
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  const quotes = data?.data ?? [];

  return (
    <aside
      className={cn("rounded-xl border bg-card p-4 text-card-foreground shadow-sm", className)}
      data-testid="trending-widget"
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">Trending Quotes</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-testid="trending-loading">
          {[1, 2, 3].map((index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Unable to load trending quotes.
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No trending quotes yet.
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {quotes.map((quote, idx) => {
            const author = quote.isOriginal
              ? quote.user?.displayName || (quote.user?.username ? `@${quote.user.username}` : "Original")
              : quote.authorName || "Unknown";

            return (
              <div key={quote.id || idx} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground mt-0.5">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug line-clamp-2 text-foreground font-medium">
                      {quote.text}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      — {author}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {quote.likeCount ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat className="h-3 w-3" />
                        {quote.repostCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
