"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { SearchResult } from "@/types/api";

export interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

export function useSearch(query: string, options?: UseSearchOptions) {
  const debounceMs = options?.debounceMs ?? 300;
  const limit = options?.limit ?? 20;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  const trimmed = debouncedQuery.trim();

  return useQuery<SearchResult[]>({
    queryKey: ["search", trimmed, limit],
    queryFn: async ({ signal }) => {
      const url = `/api/v1/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
      const res = await apiClient<{ data: SearchResult[] }>(url, { signal });
      return res?.data ?? [];
    },
    enabled: trimmed.length > 0,
    staleTime: 30 * 1000,
  });
}
