// quote-hub-web/tests/unit/notification-bell.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotificationBell } from "@/components/notifications/notification-bell";
import * as useNotificationsModule from "@/hooks/use-notifications";
import React from "react";

describe("NotificationBell", () => {
  it("renders badge when unreadCount > 0", () => {
    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      unreadCount: 4,
      notifications: [],
    } as any);

    render(<NotificationBell />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("hides badge when unreadCount is 0", () => {
    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      unreadCount: 0,
      notifications: [],
    } as any);

    render(<NotificationBell />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("caps badge text at 99+ when unreadCount exceeds 99", () => {
    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      unreadCount: 150,
      notifications: [],
    } as any);

    render(<NotificationBell />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("links to /notifications", () => {
    vi.spyOn(useNotificationsModule, "useNotifications").mockReturnValue({
      unreadCount: 2,
      notifications: [],
    } as any);

    render(<NotificationBell />);
    const link = screen.getByRole("link", { name: /notifications/i });
    expect(link).toHaveAttribute("href", "/notifications");
  });
});
