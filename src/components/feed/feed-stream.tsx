"use client";

import React, { useEffect, useRef, useContext } from "react";
import { useInfiniteFeed } from "@/hooks/use-infinite-feed";
import { QuoteCard } from "@/components/quotes/quote-card";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { AuthContext } from "@/components/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Repeat, Loader2 } from "lucide-react";
import type { Quote } from "@/types/api";

export interface FeedStreamProps {
  endpoint: string;
  limit?: number;
  emptyMessage?: string;
  className?: string;
}

export function FeedStream({
  endpoint,
  limit = 20,
  emptyMessage = "No quotes in this feed yet.",
  className = "",
}: FeedStreamProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteFeed(endpoint, { limit });

  const { mode: presentationMode } = usePresentationMode();
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.user?.id ?? null;

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="feed-loading-skeleton">
        {[1, 2, 3].map((index) => (
          <div key={index} className="rounded-xl border p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-6 text-center text-sm text-destructive ${className}`}>
        Failed to load feed: {(error as Error)?.message || "Unknown error"}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={`rounded-xl border border-dashed p-12 text-center text-muted-foreground ${className}`}
        data-testid="feed-empty-state"
      >
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="feed-stream">
      {items.map((item, index) => {
        const isRepost = item.type === "REPOST";
        const quoteData: Quote = {
          id: item.quote.id,
          userId: item.quote.author?.id ?? "",
          text: item.quote.text,
          isOriginal: item.quote.isOriginal,
          authorName: item.quote.authorName,
          themeKey: item.quote.themeKey,
          likeCount: item.quote.likeCount,
          repostCount: item.quote.repostCount,
          createdAt: item.quote.createdAt,
          user: {
            id: item.quote.author?.id ?? "",
            username: item.quote.author?.username ?? "unknown",
            displayName:
              item.quote.author?.displayName ??
              item.quote.author?.username ??
              "unknown",
            profileImageUrl:
              item.quote.author?.profileImageUrl ??
              item.quote.author?.avatarUrl ??
              null,
          },
        };

        const uniqueKey = `${item.quote.id}-${item.type}-${item.createdAt}-${index}`;

        return (
          <div key={uniqueKey} className="group">
            {isRepost && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 px-1 font-medium">
                <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {item.actor.displayName || `@${item.actor.username}`} reposted
                </span>
              </div>
            )}
            <QuoteCard
              quote={quoteData}
              presentationMode={presentationMode}
              currentUserId={currentUserId}
            />
          </div>
        );
      })}

      {/* Sentinel element for infinite scrolling */}
      <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div className="py-8 text-center text-xs text-muted-foreground">
          You&apos;ve reached the end of the feed.
        </div>
      )}
    </div>
  );
}
