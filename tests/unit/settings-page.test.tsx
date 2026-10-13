import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SettingsPage from "@/app/(app)/settings/page";
import * as useAuthModule from "@/hooks/use-auth";

describe("SettingsPage Notification Preferences", () => {
  const mockUser = {
    id: "u-1",
    username: "alice",
    displayName: "Alice Smith",
    bio: "Curator",
    profileImageUrl: null,
    role: "USER" as const,
    status: "ACTIVE" as const,
    followerCount: 10,
    followingCount: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockUser as any,
      session: null,
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
    localStorage.clear();
  });

  it("renders global notification preference toggle switch", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: /^notifications$/i })).toBeInTheDocument();
    const toggle = screen.getByRole("switch", { name: /notifications/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("toggles notification preference state when clicked", () => {
    render(<SettingsPage />);

    const toggle = screen.getByRole("switch", { name: /notifications/i });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(localStorage.getItem("quote-hub-notifications-enabled")).toBe("false");
  });
});
