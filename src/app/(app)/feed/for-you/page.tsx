"use client";

import React from "react";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedStream } from "@/components/feed/feed-stream";

export default function ForYouFeedPage() {
  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <FeedTabs activeTab="for-you" />
      <FeedStream
        endpoint="/api/v1/feed/for-you"
        emptyMessage="No quotes to discover yet. Be the first to share one!"
      />
    </div>
  );
}
