import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FollowButton } from "@/components/profile/follow-button";
import ProfilePage from "@/app/(app)/profile/[username]/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as apiClientModule from "@/lib/api-client";
import * as useAuthModule from "@/hooks/use-auth";
import * as nextNavigation from "next/navigation";

describe("FollowButton Single Flight", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches only a single follow request on click even if onToggle is passed", async () => {
    const queryClient = new QueryClient();
    const apiClientSpy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({ following: true });
    const onToggleSpy = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <FollowButton
          userId="target-user-123"
          initialFollowing={false}
          onToggle={onToggleSpy}
        />
      </QueryClientProvider>
    );

    const button = screen.getByRole("button", { name: /follow/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(apiClientSpy).toHaveBeenCalledTimes(1);
    });
    expect(apiClientSpy).toHaveBeenCalledWith("/api/v1/users/target-user-123/follow", { method: "POST" });
  });

  it("ProfilePage dispatches only a single follow request on follow button click", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: {
        id: "current-user",
        username: "currentuser",
        displayName: "Current User",
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

    vi.spyOn(nextNavigation, "useParams").mockReturnValue({ username: "targetuser" });

    const mockTargetUser = {
      id: "target-user-123",
      username: "targetuser",
      displayName: "Target User",
      bio: "Test bio",
      profileImageUrl: null,
      role: "USER" as const,
      status: "ACTIVE" as const,
      followerCount: 5,
      followingCount: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const apiClientSpy = vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (path: string) => {
      if (path.includes("/api/v1/users/targetuser")) {
        return mockTargetUser as any;
      }
      if (path.includes("/api/v1/quotes?userId=target-user-123")) {
        return { data: [], pagination: { nextCursor: null, hasMore: false } } as any;
      }
      if (path.includes("/api/v1/users/target-user-123/follow")) {
        return { following: true } as any;
      }
      return {} as any;
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePage params={Promise.resolve({ username: "targetuser" })} />
      </QueryClientProvider>
    );

    const followButton = await screen.findByRole("button", { name: /follow/i });
    fireEvent.click(followButton);

    await waitFor(() => {
      const followCalls = apiClientSpy.mock.calls.filter(([path]) =>
        path.includes("/api/v1/users/target-user-123/follow")
      );
      expect(followCalls.length).toBe(1);
    });
    const followCalls = apiClientSpy.mock.calls.filter(([path]) =>
      path.includes("/api/v1/users/target-user-123/follow")
    );
    expect(followCalls[0]).toEqual(["/api/v1/users/target-user-123/follow", { method: "POST" }]);
  });
});
