// quote-hub-web/tests/unit/use-like-mutation.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLikeMutation } from "@/hooks/use-like-mutation";
import * as apiClientModule from "@/lib/api-client";
import React from "react";

describe("useLikeMutation", () => {
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

  it("optimistically increments like count on like action", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", likeCount: 5, liked: false });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ liked: true, quoteId: "q-1" });

    const { result } = renderHook(() => useLikeMutation("q-1", false), { wrapper });
    act(() => { result.current.toggleLike(); });

    const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
    expect(cached.likeCount).toBe(6);
    expect(cached.liked).toBe(true);
  });

  it("rolls back optimistic count when mutation fails", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", likeCount: 5, liked: false });
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useLikeMutation("q-1", false), { wrapper });
    act(() => { result.current.toggleLike(); });

    await waitFor(() => {
      const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
      expect(cached.likeCount).toBe(5);
      expect(cached.liked).toBe(false);
    });
  });

  it("disables like action when user is quote owner", () => {
    const { result } = renderHook(() => useLikeMutation("q-1", true), { wrapper });
    expect(result.current.canLike).toBe(false);
  });

  it("decrements like count and protects against underflow below 0", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", likeCount: 0, liked: true });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ liked: false, quoteId: "q-1" });

    const { result } = renderHook(() => useLikeMutation("q-1", false), { wrapper });
    act(() => { result.current.toggleLike(); });

    const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
    expect(cached.likeCount).toBe(0);
    expect(cached.liked).toBe(false);
  });

  it("evicts unseeded cache entry when mutation fails without prior cache", async () => {
    // Cache is intentionally unseeded
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(new Error("Network fail"));

    const { result } = renderHook(
      () => useLikeMutation("q-unseeded", false, { liked: false, likeCount: 3 }),
      { wrapper }
    );
    act(() => { result.current.toggleLike(); });

    await waitFor(() => {
      const cached = queryClient.getQueryData<any>(["quotes", "q-unseeded"]);
      expect(cached).toBeUndefined();
      expect(result.current.isLiked).toBe(false);
      expect(result.current.likeCount).toBe(3);
    });
  });
});
