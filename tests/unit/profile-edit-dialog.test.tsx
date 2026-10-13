import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";
import * as apiClientModule from "@/lib/api-client";
import type { UserProfile } from "@/types/api";

vi.mock("@/components/profile/avatar-upload-dialog", () => ({
  AvatarUploadDialog: ({
    isOpen,
    onClose,
    onUploadSuccess,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: () => void;
  }) =>
    isOpen ? (
      <div data-testid="mock-avatar-dialog">
        <button
          type="button"
          data-testid="trigger-avatar-success"
          onClick={() => onUploadSuccess?.()}
        >
          Mock Upload Success
        </button>
        <button type="button" data-testid="close-avatar-dialog" onClick={onClose}>
          Mock Close
        </button>
      </div>
    ) : null,
}));

describe("ProfileEditDialog Avatar Refresh", () => {
  const initialUser: UserProfile = {
    id: "u-1",
    username: "alice",
    displayName: "Alice",
    bio: "Original bio",
    profileImageUrl: "https://example.com/old-avatar.png",
    role: "USER",
    status: "ACTIVE",
    followerCount: 10,
    followingCount: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches fresh user data from /api/v1/users/me upon avatar success and calls onProfileUpdated", async () => {
    const onProfileUpdated = vi.fn();
    const refreshedUser: UserProfile = {
      ...initialUser,
      profileImageUrl: "https://example.com/new-avatar.webp",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValue(refreshedUser);

    render(
      <ProfileEditDialog
        isOpen={true}
        onClose={vi.fn()}
        user={initialUser}
        onProfileUpdated={onProfileUpdated}
      />
    );

    // Open avatar dialog
    const changeAvatarBtn = screen.getByRole("button", {
      name: /change avatar/i,
    });
    fireEvent.click(changeAvatarBtn);

    expect(screen.getByTestId("mock-avatar-dialog")).toBeInTheDocument();

    // Trigger success callback from AvatarUploadDialog
    const triggerSuccessBtn = screen.getByTestId("trigger-avatar-success");
    fireEvent.click(triggerSuccessBtn);

    await waitFor(() => {
      expect(apiClientSpy).toHaveBeenCalledWith("/api/v1/users/me");
      expect(onProfileUpdated).toHaveBeenCalledWith(refreshedUser);
    });
  });

  it("falls back to { ...user } if /api/v1/users/me fetch fails upon avatar success", async () => {
    const onProfileUpdated = vi.fn();
    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockRejectedValue(new Error("Network failure"));

    render(
      <ProfileEditDialog
        isOpen={true}
        onClose={vi.fn()}
        user={initialUser}
        onProfileUpdated={onProfileUpdated}
      />
    );

    // Open avatar dialog
    const changeAvatarBtn = screen.getByRole("button", {
      name: /change avatar/i,
    });
    fireEvent.click(changeAvatarBtn);

    // Trigger success callback
    const triggerSuccessBtn = screen.getByTestId("trigger-avatar-success");
    fireEvent.click(triggerSuccessBtn);

    await waitFor(() => {
      expect(apiClientSpy).toHaveBeenCalledWith("/api/v1/users/me");
      expect(onProfileUpdated).toHaveBeenCalledWith({ ...initialUser });
    });
  });

  it("handles avatar success gracefully when onProfileUpdated is not provided", async () => {
    const refreshedUser: UserProfile = {
      ...initialUser,
      profileImageUrl: "https://example.com/new-avatar.webp",
    };

    const apiClientSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValue(refreshedUser);

    render(
      <ProfileEditDialog
        isOpen={true}
        onClose={vi.fn()}
        user={initialUser}
      />
    );

    // Open avatar dialog
    const changeAvatarBtn = screen.getByRole("button", {
      name: /change avatar/i,
    });
    fireEvent.click(changeAvatarBtn);

    // Trigger success callback
    const triggerSuccessBtn = screen.getByTestId("trigger-avatar-success");
    fireEvent.click(triggerSuccessBtn);

    await waitFor(() => {
      expect(apiClientSpy).toHaveBeenCalledWith("/api/v1/users/me");
    });
  });
});
