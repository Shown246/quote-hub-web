// quote-hub-web/tests/unit/use-follow-mutation.test.tsx
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFollowMutation } from "@/hooks/use-follow-mutation";
import * as apiClientModule from "@/lib/api-client";
import React from "react";

describe("useFollowMutation", () => {
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

  it("optimistically increments follower count on target profile", async () => {
    queryClient.setQueryData(["users", "u-target"], { id: "u-target", followerCount: 10, isFollowing: false });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ following: true, userId: "u-target" });

    const { result } = renderHook(() => useFollowMutation("u-target", false), { wrapper });
    act(() => { result.current.toggleFollow(); });

    const cached = queryClient.getQueryData<any>(["users", "u-target"]);
    expect(cached.followerCount).toBe(11);
    expect(cached.isFollowing).toBe(true);
  });

  it("disallows following own account", () => {
    const { result } = renderHook(() => useFollowMutation("u-target", true), { wrapper });
    expect(result.current.canFollow).toBe(false);
  });

  it("optimistically decrements follower count when unfollowing", async () => {
    queryClient.setQueryData(["users", "u-target"], { id: "u-target", followerCount: 10, isFollowing: true });
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ following: false, userId: "u-target" });

    const { result } = renderHook(() => useFollowMutation("u-target", false), { wrapper });
    act(() => { result.current.toggleFollow(); });

    const cached = queryClient.getQueryData<any>(["users", "u-target"]);
    expect(cached.followerCount).toBe(9);
    expect(cached.isFollowing).toBe(false);
  });

  it("rolls back optimistic follow state when mutation fails", async () => {
    queryClient.setQueryData(["users", "u-target"], { id: "u-target", followerCount: 10, isFollowing: false });
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useFollowMutation("u-target", false), { wrapper });
    act(() => { result.current.toggleFollow(); });

    await waitFor(() => {
      const cached = queryClient.getQueryData<any>(["users", "u-target"]);
      expect(cached.followerCount).toBe(10);
      expect(cached.isFollowing).toBe(false);
    });
  });
});
