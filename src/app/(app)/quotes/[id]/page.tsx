"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { usePresentationMode } from "@/hooks/use-presentation-mode";
import { QuoteCard } from "@/components/quotes/quote-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Quote as QuoteIcon, AlertCircle } from "lucide-react";
import type { Quote } from "@/types/api";

export interface QuoteDetailPageProps {
  params?: Promise<{ id: string }>;
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const router = useRouter();
  const navParams = useParams<{ id: string }>();
  const [quoteId, setQuoteId] = useState<string>(navParams?.id || "");
  const [isResolvingParams, setIsResolvingParams] = useState<boolean>(
    !navParams?.id && Boolean(params)
  );
  const { user: currentUser } = useAuth();
  const { mode: presentationMode } = usePresentationMode();

  useEffect(() => {
    if (navParams?.id) {
      setQuoteId(navParams.id);
      setIsResolvingParams(false);
    } else if (params) {
      params
        .then((p) => {
          if (p?.id) setQuoteId(p.id);
          setIsResolvingParams(false);
        })
        .catch(() => {
          setIsResolvingParams(false);
        });
    } else {
      setIsResolvingParams(false);
    }
  }, [navParams?.id, params]);

  const {
    data: quote,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Quote, ApiError | Error>({
    queryKey: ["quotes", quoteId],
    queryFn: () => apiClient<Quote>(`/api/v1/quotes/${quoteId}`),
    enabled: Boolean(quoteId),
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });

  const isNotFound =
    (isError &&
      ((error instanceof ApiError && error.status === 404) ||
        (error as any)?.status === 404 ||
        (error as any)?.code === "NOT_FOUND")) ||
    Boolean(quote?.deletedAt);

  if (isLoading || isResolvingParams) {
    return (
      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-6 w-24" />
        <div className="rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-6 w-24" />
        </div>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 rounded-2xl border bg-card p-8">
          <QuoteIcon className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Quote Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This quote does not exist or may have been removed.
          </p>
          <Link href="/feed/for-you" className={buttonVariants({ variant: "default" })}>
            Back to Feed
          </Link>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 rounded-2xl border bg-card p-8">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-bold tracking-tight">Failed to load quote</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Unable to load this quote due to a network or server error.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
            <Link href="/feed/for-you" className={buttonVariants({ variant: "outline" })}>
              Back to Feed
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 rounded-2xl border bg-card p-8">
          <QuoteIcon className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Quote Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This quote does not exist or may have been removed.
          </p>
          <Link href="/feed/for-you" className={buttonVariants({ variant: "default" })}>
            Back to Feed
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      <QuoteCard
        quote={quote}
        presentationMode={presentationMode}
        currentUserId={currentUser?.id}
      />
    </main>
  );
}
