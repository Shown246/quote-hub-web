// quote-hub-web/tests/unit/notifications-page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NotificationsPage from "@/app/(app)/notifications/page";
import * as useNotificationsModule from "@/hooks/use-notifications";
import * as useAuthModule from "@/hooks/use-auth";
import React from "react";

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "u-me", username: "me", displayName: "Me" },
      isLoading: false,
    } as any);
  });

  it("shows sign-in prompt when unauthenticated", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
    } as any);
    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAllRead: vi.fn(),
      markRead: vi.fn(),
      isLoading: false,
      isError: false,
    } as any);

    render(<NotificationsPage />);
    expect(screen.getByText(/Please sign in to view your activity notifications/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("renders empty state when there are no notifications", () => {
    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAllRead: vi.fn(),
      markRead: vi.fn(),
      isLoading: false,
      isError: false,
    } as any);

    render(<NotificationsPage />);
    expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
  });

  it("renders list and triggers markAllRead", () => {
    const markAllReadSpy = vi.fn();
    const notifications = [
      {
        id: "n-1",
        userId: "u-me",
        actorId: "u-bob",
        type: "LIKE" as const,
        entityId: "q-1",
        readAt: null,
        createdAt: "2026-03-01T12:00:00.000Z",
        actor: { id: "u-bob", username: "bob", displayName: "Bob", profileImageUrl: null },
      },
    ];

    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      notifications,
      unreadCount: 1,
      markAllRead: markAllReadSpy,
      markRead: vi.fn(),
      isLoading: false,
      isError: false,
    } as any);

    render(<NotificationsPage />);
    expect(screen.getByText(/Bob liked your quote/i)).toBeInTheDocument();

    const markAllButton = screen.getByRole("button", { name: /mark all as read/i });
    expect(markAllButton).not.toBeDisabled();
    fireEvent.click(markAllButton);
    expect(markAllReadSpy).toHaveBeenCalledTimes(1);
  });

  it("renders error state with retry button when query fails", () => {
    const refetchSpy = vi.fn();
    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAllRead: vi.fn(),
      markRead: vi.fn(),
      isLoading: false,
      isError: true,
      refetch: refetchSpy,
    } as any);

    render(<NotificationsPage />);
    expect(screen.getByText(/Failed to load notifications/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Try again/i });
    fireEvent.click(retryBtn);
    expect(refetchSpy).toHaveBeenCalledTimes(1);
  });
});
