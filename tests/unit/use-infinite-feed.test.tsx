import { renderHook, waitFor, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInfiniteFeed } from "@/hooks/use-infinite-feed";
import { FeedStream } from "@/components/feed/feed-stream";
import * as apiClientModule from "@/lib/api-client";
import React from "react";

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  (window as any).IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    trigger: (entries: IntersectionObserverEntry[]) => callback(entries),
  }));
});

describe("useInfiniteFeed", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("extracts nextCursor correctly for infinite scrolling pages", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
      data: [{ type: "ORIGINAL_QUOTE", quote: { id: "q-1", text: "First" } }],
      pagination: { nextCursor: "cursor_page_2", hasMore: true },
    });

    const { result } = renderHook(() => useInfiniteFeed("/api/v1/feed/for-you"), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages[0].pagination.nextCursor).toBe("cursor_page_2");
    expect(result.current.hasNextPage).toBe(true);
  });

  it("stops fetching when hasMore is false", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
      data: [{ type: "ORIGINAL_QUOTE", quote: { id: "q-1", text: "Last quote" } }],
      pagination: { nextCursor: null, hasMore: false },
    });

    const { result } = renderHook(() => useInfiniteFeed("/api/v1/feed/for-you"), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it("forwards exact nextCursor and signal when fetchNextPage is called for page N+1", async () => {
    const fetchSpy = vi.spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce({
        data: [{ type: "ORIGINAL_QUOTE", quote: { id: "q-1", text: "Page 1" } }],
        pagination: { nextCursor: "opaque_cursor_token_123", hasMore: true },
      })
      .mockResolvedValueOnce({
        data: [{ type: "ORIGINAL_QUOTE", quote: { id: "q-2", text: "Page 2" } }],
        pagination: { nextCursor: null, hasMore: false },
      });

    const { result } = renderHook(() => useInfiniteFeed("/api/v1/feed/for-you"), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining("cursor=opaque_cursor_token_123"),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });
});

describe("FeedStream component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders empty message when no feed items are returned", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
      data: [],
      pagination: { nextCursor: null, hasMore: false },
    });

    render(<FeedStream endpoint="/api/v1/feed/for-you" emptyMessage="No quotes found yet." />, {
      wrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("No quotes found yet.")).toBeInTheDocument();
    });
  });

  it("renders quote cards and end-of-stream message when hasMore is false", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
      data: [
        {
          type: "ORIGINAL_QUOTE",
          actor: { id: "u-1", username: "alice", displayName: "Alice", avatarUrl: null },
          quote: {
            id: "q-1",
            text: "Knowledge speaks, but wisdom listens.",
            isOriginal: true,
            authorName: null,
            likeCount: 5,
            repostCount: 2,
            createdAt: "2026-03-01T10:00:00.000Z",
            themeKey: "classic-serif",
            author: { id: "u-1", username: "alice", displayName: "Alice", avatarUrl: null },
          },
          createdAt: "2026-03-01T10:00:00.000Z",
        },
      ],
      pagination: { nextCursor: null, hasMore: false },
    });

    render(<FeedStream endpoint="/api/v1/feed/for-you" />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Knowledge speaks, but wisdom listens.")).toBeInTheDocument();
      expect(screen.getByText(/you've reached the end/i)).toBeInTheDocument();
    });
  });
});
