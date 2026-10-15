import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProfilePage from "@/app/(app)/profile/[username]/page";
import * as apiClientModule from "@/lib/api-client";
import * as useAuthModule from "@/hooks/use-auth";
import * as nextNavigation from "next/navigation";

describe("Profile Page Reposts Tab", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: {
        id: "u-1",
        username: "alice",
        displayName: "Alice Smith",
        role: "USER",
        status: "ACTIVE",
      } as any,
      session: null,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
  });

  const mockUser = {
    id: "u-2",
    username: "bob",
    displayName: "Bob Jones",
    bio: "Reader and thinker",
    profileImageUrl: null,
    role: "USER" as const,
    status: "ACTIVE" as const,
    followerCount: 42,
    followingCount: 15,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const mockQuotes = {
    data: [
      {
        id: "q-1",
        userId: "u-2",
        text: "The unexamined life is not worth living.",
        isOriginal: true,
        authorName: null,
        likeCount: 10,
        repostCount: 3,
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    ],
    pagination: { nextCursor: null, hasMore: false },
  };

  const mockReposts = {
    data: [
      {
        id: "q-2",
        userId: "u-3",
        text: "He who has a why to live can bear almost any how.",
        isOriginal: false,
        authorName: "Friedrich Nietzsche",
        likeCount: 25,
        repostCount: 8,
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    ],
    pagination: { nextCursor: null, hasMore: false },
  };

  function renderPage(username: string) {
    vi.spyOn(nextNavigation, "useParams").mockReturnValue({ username });
    return render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage params={Promise.resolve({ username })} />
      </QueryClientProvider>
    );
  }

  it("renders tabs for Quotes and Reposts and switches between them", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (path: string) => {
      if (path.includes("/api/v1/users/bob")) {
        return mockUser as any;
      }
      if (path.includes("/api/v1/quotes?userId=u-2")) {
        return mockQuotes as any;
      }
      if (path.includes("reposts")) {
        return mockReposts as any;
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    renderPage("bob");

    // Wait for quotes tab to load
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /quotes/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /reposts/i })).toBeInTheDocument();
      expect(screen.getByText(/the unexamined life is not worth living/i)).toBeInTheDocument();
    });

    // Switch to Reposts tab
    const repostsTab = screen.getByRole("tab", { name: /reposts/i });
    fireEvent.click(repostsTab);

    // Verify reposted quote and attribution appear
    await waitFor(() => {
      expect(screen.getByText(/he who has a why to live can bear almost any how/i)).toBeInTheDocument();
      expect(screen.getByText(/bob jones reposted/i)).toBeInTheDocument();
      expect(screen.getByText(/friedrich nietzsche/i)).toBeInTheDocument();
    });
  });

  it("displays empty state when user has no reposts", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (path: string) => {
      if (path.includes("/api/v1/users/bob")) {
        return mockUser as any;
      }
      if (path.includes("/api/v1/quotes?userId=u-2")) {
        return mockQuotes as any;
      }
      if (path.includes("reposts")) {
        return { data: [], pagination: { nextCursor: null, hasMore: false } } as any;
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    renderPage("bob");

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /reposts/i })).toBeInTheDocument();
    });

    const repostsTab = screen.getByRole("tab", { name: /reposts/i });
    fireEvent.click(repostsTab);

    await waitFor(() => {
      expect(screen.getByText(/no reposts yet/i)).toBeInTheDocument();
      expect(screen.getByText(/when @bob reposts quotes, they will appear here/i)).toBeInTheDocument();
    });
  });

  it("displays original quote creator when user reposts an original quote", async () => {
    const originalQuoteRepost = {
      data: [
        {
          id: "q-orig",
          userId: "u-3",
          text: "Simplicity is prerequisite for reliability.",
          isOriginal: true,
          authorName: null,
          user: {
            id: "u-3",
            username: "dijkstra",
            displayName: "Edsger Dijkstra",
          },
          likeCount: 40,
          repostCount: 15,
          createdAt: "2026-01-04T00:00:00.000Z",
        },
      ],
      pagination: { nextCursor: null, hasMore: false },
    };

    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (path: string) => {
      if (path.includes("/api/v1/users/bob")) {
        return mockUser as any;
      }
      if (path.includes("/api/v1/quotes?userId=u-2")) {
        return mockQuotes as any;
      }
      if (path.includes("reposts")) {
        return originalQuoteRepost as any;
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    renderPage("bob");

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /reposts/i })).toBeInTheDocument();
    });

    const repostsTab = screen.getByRole("tab", { name: /reposts/i });
    fireEvent.click(repostsTab);

    await waitFor(() => {
      expect(screen.getByText(/simplicity is prerequisite for reliability/i)).toBeInTheDocument();
      expect(screen.getByText(/edsger dijkstra/i)).toBeInTheDocument();
      expect(screen.getByText(/bob jones reposted/i)).toBeInTheDocument();
    });
  });
});
