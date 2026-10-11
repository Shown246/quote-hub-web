"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { FeedResponse } from "@/types/api";

export interface UseInfiniteFeedOptions {
  limit?: number;
}

export function useInfiniteFeed(endpoint: string, options?: UseInfiniteFeedOptions) {
  const limit = options?.limit ?? 20;

  return useInfiniteQuery<FeedResponse>({
    queryKey: ["feed", endpoint, limit],
    queryFn: async ({ pageParam, signal }) => {
      const separator = endpoint.includes("?") ? "&" : "?";
      let url = `${endpoint}${separator}limit=${limit}`;
      if (pageParam) {
        url += `&cursor=${encodeURIComponent(pageParam as string)}`;
      }
      return apiClient<FeedResponse>(url, { credentials: "include", signal });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage?.pagination?.hasMore ? lastPage.pagination.nextCursor : undefined,
  });
}
