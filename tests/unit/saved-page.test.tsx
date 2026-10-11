// quote-hub-web/tests/unit/saved-page.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SavedQuotesPage from "@/app/(app)/saved/page";
import * as apiClientModule from "@/lib/api-client";
import * as useAuthModule from "@/hooks/use-auth";

describe("SavedQuotesPage Integration", () => {
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

  it("renders login prompt when user is not authenticated", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<SavedQuotesPage />, { wrapper });

    expect(screen.getByRole("heading", { name: /saved quotes/i })).toBeInTheDocument();
    expect(
      screen.getByText(/please sign in to view your private bookmarked quotes/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("correctly unwraps nested bookmark records from API response", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: {
        id: "u-viewer",
        username: "curator",
        displayName: "Curator",
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

    // Mock API response matching quote-hub-api bookmark.service.ts
    const mockApiResponse = {
      data: [
        {
          userId: "u-viewer",
          quoteId: "q-saved-1",
          createdAt: "2026-03-01T12:00:00.000Z",
          quote: {
            id: "q-saved-1",
            userId: "u-author",
            text: "Knowledge is power.",
            isOriginal: true,
            authorName: null,
            likeCount: 14,
            repostCount: 5,
            bookmarked: true,
            createdAt: "2026-03-01T10:00:00.000Z",
            user: {
              id: "u-author",
              username: "bacon",
              displayName: "Francis Bacon",
              profileImageUrl: null,
            },
          },
        },
      ],
      items: [],
      nextCursor: null,
    };

    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue(mockApiResponse);

    render(<SavedQuotesPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Knowledge is power.")).toBeInTheDocument();
      expect(screen.getByText(/Francis Bacon/i)).toBeInTheDocument();
    });
  });

  it("renders empty state when there are no saved quotes", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: {
        id: "u-viewer",
        username: "curator",
        displayName: "Curator",
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

    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      data: [],
      items: [],
      nextCursor: null,
    });

    render(<SavedQuotesPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /no saved quotes yet/i })).toBeInTheDocument();
      expect(
        screen.getByText(/when you bookmark quotes while browsing, they will be saved here/i)
      ).toBeInTheDocument();
    });
  });
});
