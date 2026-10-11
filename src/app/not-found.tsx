import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FileQuestion, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileQuestion className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="text-lg font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            The page or quote you are looking for does not exist or may have been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/feed/for-you"
            className={buttonVariants({
              variant: "default",
              className: "w-full sm:w-auto gap-2",
            })}
          >
            <Compass className="h-4 w-4" />
            <span>Discover Feed</span>
          </Link>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "w-full sm:w-auto gap-2",
            })}
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
