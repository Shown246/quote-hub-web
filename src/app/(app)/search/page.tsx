"use client";

import React, { useState } from "react";
import { SearchInput } from "@/components/search/search-input";
import { useSearch } from "@/hooks/use-search";
import { QuoteCard } from "@/components/quotes/quote-card";
import { TrendingWidget } from "@/components/feed/trending-widget";
import { PresentationModeToggle } from "@/components/feed/presentation-mode-toggle";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles } from "lucide-react";
import type { Quote } from "@/types/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { data: results, isLoading, isError, error } = useSearch(query);
  const { mode: presentationMode } = usePresentationMode();

  const hasQuery = query.trim().length > 0;

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="flex flex-col gap-6">
        {/* Header & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:max-w-xl">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search quotes, authors, or topics..."
              autoFocus
            />
          </div>
          <div className="self-end sm:self-auto">
            <PresentationModeToggle />
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main search results area */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading && (
              <div className="space-y-4" data-testid="search-loading">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="rounded-xl border p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
                Search failed: {(error as Error)?.message || "Unknown error"}
              </div>
            )}

            {!hasQuery && !isLoading && (
              <div className="rounded-xl border border-dashed p-10 text-center space-y-3">
                <div className="flex justify-center text-muted-foreground">
                  <Sparkles className="h-8 w-8 text-primary/70" />
                </div>
                <h3 className="font-semibold text-base">Search the Quote-Hub Universe</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Type any phrase, keyword, or author name to explore fuzzy trigram ranked quotes.
                </p>
              </div>
            )}

            {hasQuery && !isLoading && results && results.length === 0 && (
              <div
                className="rounded-xl border border-dashed p-10 text-center space-y-3"
                data-testid="search-empty-state"
              >
                <div className="flex justify-center text-muted-foreground">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-base">No matching quotes found</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We couldn&apos;t find any quotes matching &ldquo;{query}&rdquo;. Try another keyword or author name.
                </p>
              </div>
            )}

            {hasQuery && !isLoading && results && results.length > 0 && (
              <div className="space-y-4" data-testid="search-results">
                <div className="text-xs text-muted-foreground px-1">
                  Found {results.length} ranked {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
                </div>

                {results.map((result) => {
                  const quoteData: Quote = {
                    id: result.id,
                    userId: result.author?.id ?? "",
                    text: result.text,
                    isOriginal: result.isOriginal,
                    authorName: result.authorName,
                    themeKey: result.themeKey ?? undefined,
                    likeCount: result.likeCount,
                    repostCount: result.repostCount,
                    createdAt: result.createdAt,
                    user: {
                      id: result.author?.id ?? "",
                      username: result.author?.username || result.username || "unknown",
                      displayName:
                        result.author?.displayName ||
                        result.displayName ||
                        result.username ||
                        "unknown",
                      profileImageUrl:
                        result.author?.profileImageUrl ?? result.author?.avatarUrl ?? null,
                    },
                  };

                  const matchPercentage = Math.round((result.rankScore || 0) * 100);

                  return (
                    <div key={result.id} className="relative group space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-medium bg-muted text-muted-foreground hover:bg-muted"
                        >
                          {matchPercentage}% match
                        </Badge>
                      </div>
                      <QuoteCard quote={quoteData} presentationMode={presentationMode} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Area with Trending Widget */}
          <div className="hidden lg:block lg:col-span-1">
            <TrendingWidget limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
