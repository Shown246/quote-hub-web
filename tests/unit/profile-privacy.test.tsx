import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfileHeader } from "@/components/profile/profile-header";
import ProfilePage from "@/app/(app)/profile/[username]/page";
import * as apiClientModule from "@/lib/api-client";
import * as useAuthModule from "@/hooks/use-auth";
import * as nextNavigation from "next/navigation";

describe("Profile Privacy Compliance (Review Focus)", () => {
  const otherUser = {
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

  const ownUser = {
    id: "u-1",
    username: "alice",
    displayName: "Alice Smith",
    bio: "Passionate quote curator",
    profileImageUrl: "https://example.com/avatar.webp",
    role: "USER" as const,
    status: "ACTIVE" as const,
    followerCount: 100,
    followingCount: 50,
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-02-15T00:00:00.000Z",
  };

  it("displays follower and following counts but never renders clickable lists", () => {
    render(<ProfileHeader user={otherUser} isOwnProfile={false} />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();

    // Actual lists are private per PRD Section 41: no links to view lists
    expect(screen.queryByRole("link", { name: /followers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /following/i })).not.toBeInTheDocument();

    // Also verify no buttons exist for opening follower/following lists
    expect(screen.queryByRole("button", { name: /followers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /following/i })).not.toBeInTheDocument();
  });

  it("renders follow button when viewing another user's profile (!isOwnProfile)", () => {
    render(<ProfileHeader user={otherUser} isOwnProfile={false} />);

    expect(screen.getByRole("button", { name: /^follow$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit profile/i })).not.toBeInTheDocument();
  });

  it("renders edit profile button when viewing own profile (isOwnProfile)", () => {
    render(<ProfileHeader user={ownUser} isOwnProfile={true} />);

    expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^follow$/i })).not.toBeInTheDocument();
  });

  it("renders display name, handle with @, bio, and join date", () => {
    render(<ProfileHeader user={otherUser} isOwnProfile={false} />);

    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("Reader and thinker")).toBeInTheDocument();
    expect(screen.getByText(/joined january 2026/i)).toBeInTheDocument();
  });
});

describe("Profile Page Integration & Privacy", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
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

  function renderPage(username: string) {
    vi.spyOn(nextNavigation, "useParams").mockReturnValue({ username });
    return render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage params={Promise.resolve({ username })} />
      </QueryClientProvider>
    );
  }

  it("loads and renders user profile and quotes stream", async () => {
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
          themeId: "t-1",
          likeCount: 10,
          repostCount: 3,
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          deletedAt: null,
        },
      ],
      pagination: {
        nextCursor: null,
        hasMore: false,
      },
    };

    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (path: string) => {
      if (path.includes("/api/v1/users/bob")) {
        return mockUser as any;
      }
      if (path.includes("/api/v1/quotes?userId=u-2")) {
        return mockQuotes as any;
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    renderPage("bob");

    await waitFor(() => {
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.getByText("@bob")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText(/the unexamined life is not worth living/i)).toBeInTheDocument();
    });

    // Verify privacy: no links to follower/following lists in the page
    expect(screen.queryByRole("link", { name: /followers/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /following/i })).not.toBeInTheDocument();
  });

  it("handles 404 when user is not found", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(
      new apiClientModule.ApiError({
        status: 404,
        code: "USER_NOT_FOUND",
        detail: "User not found",
      })
    );

    renderPage("unknown_user");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /user not found/i })).toBeInTheDocument();
      expect(screen.getByText(/does not exist or has been deleted/i)).toBeInTheDocument();
    });
  });

  it("handles soft-deleted user as not found", async () => {
    const deletedUser = {
      id: "u-3",
      username: "charlie",
      displayName: "Charlie Ghost",
      bio: null,
      profileImageUrl: null,
      role: "USER" as const,
      status: "DELETED" as const,
      followerCount: 0,
      followingCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (path: string) => {
      if (path.includes("/api/v1/users/charlie")) {
        return deletedUser as any;
      }
      return { data: [], pagination: { nextCursor: null, hasMore: false } } as any;
    });

    renderPage("charlie");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /user not found/i })).toBeInTheDocument();
      expect(screen.getByText(/does not exist or has been deleted/i)).toBeInTheDocument();
    });
  });
});
