import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedStream } from "@/components/feed/feed-stream";
import SearchPage from "@/app/(app)/search/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as feedHook from "@/hooks/use-infinite-feed";
import * as apiClientModule from "@/lib/api-client";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

describe("FeedStream Social Flags Preservation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    (window as any).IntersectionObserver = vi.fn().mockImplementation(function (callback) {
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
        trigger: (entries: IntersectionObserverEntry[]) => callback(entries),
      };
    });
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("preserves initial liked, reposted, and bookmarked attributes when rendering QuoteCard", () => {
    vi.spyOn(feedHook, "useInfiniteFeed").mockReturnValue({
      data: {
        pages: [
          {
            data: [
              {
                type: "ORIGINAL_QUOTE",
                actor: { id: "u1", username: "alice", displayName: "Alice", avatarUrl: null },
                quote: {
                  id: "q-100",
                  text: "Engagement test quote",
                  isOriginal: true,
                  authorName: null,
                  likeCount: 5,
                  repostCount: 2,
                  createdAt: new Date().toISOString(),
                  liked: true,
                  isLiked: true,
                  reposted: true,
                  isReposted: true,
                  bookmarked: true,
                  isBookmarked: true,
                  author: { id: "u1", username: "alice", displayName: "Alice", avatarUrl: null },
                },
                createdAt: new Date().toISOString(),
              },
            ],
            pagination: { nextCursor: null, hasMore: false },
          },
        ],
        pageParams: [null],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <FeedStream endpoint="/api/v1/feed/for-you" />
      </QueryClientProvider>
    );

    const unlikeButton = screen.getByRole("button", { name: /unlike quote/i });
    expect(unlikeButton).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo repost/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove bookmark/i })).toBeInTheDocument();
  });

  it("preserves initial liked, reposted, and bookmarked attributes in SearchPage", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      data: [
        {
          id: "q-search-1",
          text: "Search engagement test quote",
          isOriginal: true,
          authorName: null,
          likeCount: 10,
          repostCount: 4,
          createdAt: new Date().toISOString(),
          liked: true,
          isLiked: true,
          reposted: true,
          isReposted: true,
          bookmarked: true,
          isBookmarked: true,
          rankScore: 0.95,
          username: "alice",
          displayName: "Alice",
          author: {
            id: "u1",
            username: "alice",
            displayName: "Alice",
            avatarUrl: null,
            profileImageUrl: null,
          },
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SearchPage />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/search quotes, authors, or topics/i);
    fireEvent.change(input, { target: { value: "Search engagement" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /unlike quote/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /undo repost/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /remove bookmark/i })).toBeInTheDocument();
    });
  });
});
