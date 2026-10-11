// quote-hub-web/tests/unit/notification-item-card.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotificationItemCard } from "@/components/notifications/notification-item-card";
import React from "react";

describe("NotificationItemCard", () => {
  it("formats LIKE, REPOST, and FOLLOW copy accurately", () => {
    const likeItem = {
      id: "n-1",
      userId: "u-me",
      actorId: "u-bob",
      type: "LIKE" as const,
      entityId: "q-1",
      readAt: null,
      createdAt: "2026-03-01T12:00:00.000Z",
      actor: { id: "u-bob", username: "bob", displayName: "Bob", profileImageUrl: null },
    };

    const { rerender } = render(<NotificationItemCard item={likeItem} onRead={() => {}} />);
    expect(screen.getByText(/Bob liked your quote/i)).toBeInTheDocument();

    const repostItem = {
      ...likeItem,
      id: "n-2",
      type: "REPOST" as const,
    };
    rerender(<NotificationItemCard item={repostItem} onRead={() => {}} />);
    expect(screen.getByText(/Bob reposted your quote/i)).toBeInTheDocument();

    const followItem = {
      ...likeItem,
      id: "n-3",
      type: "FOLLOW" as const,
      entityId: "u-bob",
    };
    rerender(<NotificationItemCard item={followItem} onRead={() => {}} />);
    expect(screen.getByText(/Bob started following you/i)).toBeInTheDocument();
  });

  it("links to /quotes/:entityId for LIKE and REPOST, and /profile/:username for FOLLOW", () => {
    const likeItem = {
      id: "n-1",
      userId: "u-me",
      actorId: "u-bob",
      type: "LIKE" as const,
      entityId: "quote-123",
      readAt: null,
      createdAt: "2026-03-01T12:00:00.000Z",
      actor: { id: "u-bob", username: "bob", displayName: "Bob", profileImageUrl: null },
    };

    const { rerender } = render(<NotificationItemCard item={likeItem} onRead={() => {}} />);
    const quoteLink = screen.getByRole("link", { name: /Bob liked your quote/i });
    expect(quoteLink).toHaveAttribute("href", "/quotes/quote-123");

    const followItem = {
      id: "n-3",
      userId: "u-me",
      actorId: "u-bob",
      type: "FOLLOW" as const,
      entityId: "u-bob",
      readAt: null,
      createdAt: "2026-03-01T12:00:00.000Z",
      actor: { id: "u-bob", username: "bob", displayName: "Bob", profileImageUrl: null },
    };
    rerender(<NotificationItemCard item={followItem} onRead={() => {}} />);
    const profileLink = screen.getByRole("link", { name: /Bob started following you/i });
    expect(profileLink).toHaveAttribute("href", "/profile/bob");
  });

  it("shows unread indicator when readAt is null and triggers onRead on click", () => {
    const onReadSpy = vi.fn();
    const unreadItem = {
      id: "n-1",
      userId: "u-me",
      actorId: "u-bob",
      type: "LIKE" as const,
      entityId: "q-1",
      readAt: null,
      createdAt: "2026-03-01T12:00:00.000Z",
      actor: { id: "u-bob", username: "bob", displayName: "Bob", profileImageUrl: null },
    };

    const { rerender } = render(<NotificationItemCard item={unreadItem} onRead={onReadSpy} />);
    expect(screen.getByTestId("unread-indicator")).toBeInTheDocument();

    const link = screen.getByRole("link");
    link.addEventListener("click", (e) => e.preventDefault(), { once: true });
    fireEvent.click(link);
    expect(onReadSpy).toHaveBeenCalledWith("n-1");

    // When item is already read
    const readItem = { ...unreadItem, readAt: "2026-03-01T12:30:00.000Z" };
    rerender(<NotificationItemCard item={readItem} onRead={onReadSpy} />);
    expect(screen.queryByTestId("unread-indicator")).not.toBeInTheDocument();
  });
});
