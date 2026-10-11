"use client";

import React from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { PresentationModeToggle } from "@/components/feed/presentation-mode-toggle";
import { QuoteCard } from "@/components/quotes/quote-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import type { Quote, PaginatedResponse } from "@/types/api";

interface BookmarkItem {
  quote?: Quote;
  [key: string]: unknown;
}

interface BookmarkApiResponse {
  data?: (BookmarkItem | Quote)[];
  items?: (BookmarkItem | Quote)[];
  nextCursor?: string | null;
  pagination?: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export default function SavedQuotesPage() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const { mode } = usePresentationMode();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<BookmarkApiResponse>({
    queryKey: ["bookmarks"],
    queryFn: ({ pageParam }) => {
      const url = pageParam
        ? `/api/v1/users/me/bookmarks?cursor=${encodeURIComponent(pageParam as string)}`
        : "/api/v1/users/me/bookmarks";
      return apiClient<BookmarkApiResponse>(url);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasMore !== undefined) {
        return lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined;
      }
      return lastPage?.nextCursor || undefined;
    },
    enabled: Boolean(currentUser),
  });

  const quotes: Quote[] =
    data?.pages.flatMap((page) => {
      const list = page.data || page.items || [];
      return list.map((item: any) => (item.quote ? item.quote : (item as Quote)));
    }) ?? [];

  if (isAuthLoading) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 rounded-2xl border bg-card p-8">
          <Bookmark className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Saved Quotes</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Please sign in to view your private bookmarked quotes.
          </p>
          <Link href="/login" className={buttonVariants({ variant: "default" })}>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            Saved Quotes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your private collection of bookmarked quotes.
          </p>
        </div>
        <PresentationModeToggle />
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load saved quotes."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : quotes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bookmark className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-medium">No saved quotes yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When you bookmark quotes while browsing, they will be saved here privately for you.
          </p>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Explore Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              presentationMode={mode}
              currentUserId={currentUser.id}
            />
          ))}

          {hasNextPage && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading more..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
