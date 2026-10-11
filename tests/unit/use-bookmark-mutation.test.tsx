// quote-hub-web/tests/unit/use-bookmark-mutation.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBookmarkMutation } from "@/hooks/use-bookmark-mutation";
import * as apiClientModule from "@/lib/api-client";
import React from "react";

describe("useBookmarkMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("optimistically toggles bookmarked state without modifying public counters", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", bookmarked: false, likeCount: 5 });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ bookmarked: true, quoteId: "q-1" });

    const { result } = renderHook(() => useBookmarkMutation("q-1"), { wrapper });
    act(() => { result.current.toggleBookmark(); });

    const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
    expect(cached.bookmarked).toBe(true);
    expect(cached.likeCount).toBe(5);
  });

  it("rolls back optimistic bookmarked state when mutation fails", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", bookmarked: false });
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBookmarkMutation("q-1"), { wrapper });
    act(() => { result.current.toggleBookmark(); });

    await waitFor(() => {
      const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
      expect(cached.bookmarked).toBe(false);
    });
  });

  it("optimistically unbookmarks when already bookmarked", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", bookmarked: true });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ bookmarked: false, quoteId: "q-1" });

    const { result } = renderHook(() => useBookmarkMutation("q-1"), { wrapper });
    act(() => { result.current.toggleBookmark(); });

    const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
    expect(cached.bookmarked).toBe(false);
  });
});
