// quote-hub-web/tests/unit/use-repost-mutation.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRepostMutation } from "@/hooks/use-repost-mutation";
import * as apiClientModule from "@/lib/api-client";
import React from "react";

describe("useRepostMutation", () => {
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

  it("optimistically updates repost count and toggles state", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", repostCount: 2, reposted: false });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ reposted: true, quoteId: "q-1" });

    const { result } = renderHook(() => useRepostMutation("q-1"), { wrapper });
    act(() => { result.current.toggleRepost(); });

    const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
    expect(cached.repostCount).toBe(3);
    expect(cached.reposted).toBe(true);
  });

  it("rolls back optimistic count when mutation fails", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", repostCount: 2, reposted: false });
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useRepostMutation("q-1"), { wrapper });
    act(() => { result.current.toggleRepost(); });

    await waitFor(() => {
      const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
      expect(cached.repostCount).toBe(2);
      expect(cached.reposted).toBe(false);
    });
  });

  it("decrements repost count on unrepost and prevents underflow", async () => {
    queryClient.setQueryData(["quotes", "q-1"], { id: "q-1", repostCount: 0, reposted: true });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ reposted: false, quoteId: "q-1" });

    const { result } = renderHook(() => useRepostMutation("q-1"), { wrapper });
    act(() => { result.current.toggleRepost(); });

    const cached = queryClient.getQueryData<any>(["quotes", "q-1"]);
    expect(cached.repostCount).toBe(0);
    expect(cached.reposted).toBe(false);
  });
});
