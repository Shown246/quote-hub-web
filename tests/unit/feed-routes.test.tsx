import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedTabs } from "@/components/feed/feed-tabs";
import ForYouFeedPage from "@/app/(app)/feed/for-you/page";
import FollowingFeedPage from "@/app/(app)/feed/following/page";
import { AuthContext } from "@/components/auth/auth-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/feed/for-you",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock FeedStream
vi.mock("@/components/feed/feed-stream", () => ({
  FeedStream: ({ endpoint }: { endpoint: string }) => (
    <div data-testid="mock-feed-stream" data-endpoint={endpoint}>
      Feed stream for {endpoint}
    </div>
  ),
}));

describe("FeedTabs", () => {
  it("renders tabs for For You and Following", () => {
    render(<FeedTabs activeTab="for-you" />);
    expect(screen.getByRole("tab", { name: /for you/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /following/i })).toBeInTheDocument();
  });

  it("sets correct aria-selected attribute based on activeTab", () => {
    const { rerender } = render(<FeedTabs activeTab="for-you" />);
    expect(screen.getByRole("tab", { name: /for you/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /following/i })).toHaveAttribute("aria-selected", "false");

    rerender(<FeedTabs activeTab="following" />);
    expect(screen.getByRole("tab", { name: /for you/i })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: /following/i })).toHaveAttribute("aria-selected", "true");
  });
});

describe("Feed Pages", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it("renders For You page with feed stream pointing to /api/v1/feed/for-you", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ForYouFeedPage />
      </QueryClientProvider>
    );

    const stream = screen.getByTestId("mock-feed-stream");
    expect(stream).toHaveAttribute("data-endpoint", "/api/v1/feed/for-you");
  });

  it("renders login prompt on Following page for unauthenticated guest", () => {
    const mockAuthContext = {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refetchSession: vi.fn(),
    };

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthContext as any}>
          <FollowingFeedPage />
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/sign in to see quotes from people you follow/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login?redirect=/feed/following");
  });

  it("renders feed stream on Following page for authenticated user", () => {
    const mockAuthContext = {
      user: { id: "u-1", username: "alice", email: "alice@example.com" },
      session: { id: "s-1" },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refetchSession: vi.fn(),
    };

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={mockAuthContext as any}>
          <FollowingFeedPage />
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const stream = screen.getByTestId("mock-feed-stream");
    expect(stream).toHaveAttribute("data-endpoint", "/api/v1/feed/following");
  });
});
