"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log client error without exposing stack to user
    console.error("Unhandled client error caught by boundary:", error);
  }, [error]);

  const isApiError = error instanceof ApiError || (error && typeof (error as any).status === "number");
  const correlationId =
    (error as any).instance ||
    (error as any).digest ||
    undefined;

  const errorMessage =
    isApiError && (error as any).detail
      ? (error as any).detail
      : error.message || "An unexpected error occurred while loading this page.";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage}
          </p>
        </div>

        {correlationId && (
          <div className="rounded-lg bg-muted/60 border border-border/50 px-3.5 py-2 text-xs font-mono text-muted-foreground break-all">
            <span className="font-semibold text-foreground select-none">Error Reference: </span>
            <span>{correlationId}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="default"
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </Button>

          <Link
            href="/feed/for-you"
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto gap-2",
            })}
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
