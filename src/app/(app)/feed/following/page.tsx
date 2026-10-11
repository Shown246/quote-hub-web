"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedStream } from "@/components/feed/feed-stream";
import { AuthContext } from "@/components/auth/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export default function FollowingFeedPage() {
  const auth = useContext(AuthContext);
  const isLoading = auth?.isLoading ?? false;
  const isAuthenticated = Boolean(auth?.user);

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <FeedTabs activeTab="following" />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : !isAuthenticated ? (
        <div
          className="rounded-xl border border-dashed p-10 text-center space-y-4"
          data-testid="following-auth-prompt"
        >
          <div className="flex justify-center text-muted-foreground">
            <Users className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Following Feed</h3>
            <p className="text-sm text-muted-foreground">
              Sign in to see quotes from people you follow.
            </p>
          </div>
          <div>
            <Link
              href="/login?redirect=/feed/following"
              className={buttonVariants({ variant: "default" })}
            >
              Sign In
            </Link>
          </div>
        </div>
      ) : (
        <FeedStream
          endpoint="/api/v1/feed/following"
          emptyMessage="Your following feed is empty. Find interesting authors to follow!"
        />
      )}
    </div>
  );
}
