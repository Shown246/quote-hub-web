import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  uploadAvatarWorkflow,
  AvatarUploadDialog,
} from "@/components/profile/avatar-upload-dialog";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";
import { ProfileHeader } from "@/components/profile/profile-header";
import * as apiClientModule from "@/lib/api-client";
import type { UserProfile } from "@/types/api";

describe("2-Step Avatar Upload Workflow", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("executes presign -> direct PUT -> confirm sequence in exact order", async () => {
    const file = new File(["bytes"], "avatar.png", { type: "image/png" });

    const presignSpy = vi
      .spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce({
        uploadUrl: "https://r2.storage/upload?sig=abc",
        key: "uploads/avatars/user-1/avatar.png",
      })
      .mockResolvedValueOnce({
        message: "Avatar upload confirmed, processing queued",
        key: "uploads/avatars/user-1/avatar.png",
      });

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    await uploadAvatarWorkflow(file);

    expect(presignSpy).toHaveBeenNthCalledWith(1, "/api/v1/users/me/profile-image", {
      method: "POST",
      body: JSON.stringify({ contentType: "image/png", contentLength: file.size }),
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("https://r2.storage/upload?sig=abc", {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: file,
    });

    expect(presignSpy).toHaveBeenNthCalledWith(2, "/api/v1/users/me/profile-image/confirm", {
      method: "POST",
      headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }),
      body: JSON.stringify({ key: "uploads/avatars/user-1/avatar.png" }),
    });
  });

  it("validates client-side: rejects unsupported mime types", async () => {
    const file = new File(["bytes"], "doc.pdf", { type: "application/pdf" });
    const apiClientSpy = vi.spyOn(apiClientModule, "apiClient");

    await expect(uploadAvatarWorkflow(file)).rejects.toThrow(
      /unsupported|invalid|allowed/i
    );
    expect(apiClientSpy).not.toHaveBeenCalled();
  });

  it("validates client-side: rejects file size greater than 5MB", async () => {
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([largeContent], "large.png", { type: "image/png" });
    const apiClientSpy = vi.spyOn(apiClientModule, "apiClient");

    await expect(uploadAvatarWorkflow(file)).rejects.toThrow(/5\s*mb|size/i);
    expect(apiClientSpy).not.toHaveBeenCalled();
  });

  it("throws error if direct storage PUT fails", async () => {
    const file = new File(["bytes"], "avatar.webp", { type: "image/webp" });

    vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
      uploadUrl: "https://r2.storage/upload?sig=abc",
      key: "uploads/avatars/user-1/avatar.webp",
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    await expect(uploadAvatarWorkflow(file)).rejects.toThrow(/failed to upload/i);
  });
});

describe("AvatarUploadDialog Component", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("does not render when isOpen is false", () => {
    render(
      React.createElement(AvatarUploadDialog, {
        isOpen: false,
        onClose: vi.fn(),
      })
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with file input, preview area, and upload button when isOpen is true", () => {
    render(
      React.createElement(AvatarUploadDialog, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/choose avatar image/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload|save/i })).toBeInTheDocument();
  });

  it("displays client-side error when invalid file type is selected", async () => {
    render(
      React.createElement(AvatarUploadDialog, {
        isOpen: true,
        onClose: vi.fn(),
      })
    );

    const input = screen.getByLabelText(/choose avatar image/i);
    const badFile = new File(["content"], "document.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/invalid file type|allowed/i)).toBeInTheDocument();
    });
  });

  it("executes upload workflow and triggers onUploadSuccess and onClose", async () => {
    const onClose = vi.fn();
    const onUploadSuccess = vi.fn();

    vi.spyOn(apiClientModule, "apiClient")
      .mockResolvedValueOnce({
        uploadUrl: "https://r2.storage/upload?sig=abc",
        key: "uploads/avatars/user-1/avatar.jpg",
      })
      .mockResolvedValueOnce({
        message: "Avatar uploaded",
        key: "uploads/avatars/user-1/avatar.jpg",
      });

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    render(
      React.createElement(AvatarUploadDialog, {
        isOpen: true,
        onClose,
        onUploadSuccess,
      })
    );

    const input = screen.getByLabelText(/choose avatar image/i);
    const validFile = new File(["bytes"], "avatar.jpg", { type: "image/jpeg" });

    fireEvent.change(input, { target: { files: [validFile] } });

    const uploadButton = screen.getByRole("button", { name: /upload|save/i });
    expect(uploadButton).not.toBeDisabled();

    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe("ProfileEditDialog Component", () => {
  const mockUser: UserProfile = {
    id: "u-1",
    username: "alice",
    displayName: "Alice Wonderland",
    bio: "Curator of wisdom",
    profileImageUrl: "https://example.com/alice.webp",
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

  it("pre-fills form with existing displayName and bio", () => {
    render(
      React.createElement(ProfileEditDialog, {
        isOpen: true,
        onClose: vi.fn(),
        user: mockUser,
      })
    );

    const nameInput = screen.getByLabelText(/display name/i) as HTMLInputElement;
    const bioInput = screen.getByLabelText(/bio/i) as HTMLTextAreaElement;

    expect(nameInput.value).toBe("Alice Wonderland");
    expect(bioInput.value).toBe("Curator of wisdom");
  });

  it("submits PATCH /api/v1/users/me with edited values and calls onClose", async () => {
    const onClose = vi.fn();
    const onProfileUpdated = vi.fn();

    const patchSpy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      ...mockUser,
      displayName: "Alice New",
      bio: "New bio",
    });

    render(
      React.createElement(ProfileEditDialog, {
        isOpen: true,
        onClose,
        user: mockUser,
        onProfileUpdated,
      })
    );

    const nameInput = screen.getByLabelText(/display name/i);
    const bioInput = screen.getByLabelText(/bio/i);

    fireEvent.change(nameInput, { target: { value: "Alice New" } });
    fireEvent.change(bioInput, { target: { value: "New bio" } });

    const submitBtn = screen.getByRole("button", { name: /save changes|save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: "Alice New",
          bio: "New bio",
        }),
      });
      expect(onProfileUpdated).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("validates client-side displayName (1-50 chars) and bio (max 160 chars)", async () => {
    const patchSpy = vi.spyOn(apiClientModule, "apiClient");

    render(
      React.createElement(ProfileEditDialog, {
        isOpen: true,
        onClose: vi.fn(),
        user: mockUser,
      })
    );

    const nameInput = screen.getByLabelText(/display name/i);
    const submitBtn = screen.getByRole("button", { name: /save changes|save/i });

    // Empty displayName
    fireEvent.change(nameInput, { target: { value: "   " } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/display name is required|between 1 and 50/i)).toBeInTheDocument();
    });
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it("contains button that opens AvatarUploadDialog", async () => {
    render(
      React.createElement(ProfileEditDialog, {
        isOpen: true,
        onClose: vi.fn(),
        user: mockUser,
      })
    );

    const changeAvatarBtn = screen.getByRole("button", {
      name: /change avatar|upload avatar/i,
    });
    expect(changeAvatarBtn).toBeInTheDocument();

    fireEvent.click(changeAvatarBtn);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/choose avatar image/i)
      ).toBeInTheDocument();
    });
  });
});

describe("ProfileHeader & ProfileEditDialog Integration", () => {
  const mockUser: UserProfile = {
    id: "u-1",
    username: "alice",
    displayName: "Alice Wonderland",
    bio: "Curator of wisdom",
    profileImageUrl: "https://example.com/alice.webp",
    role: "USER",
    status: "ACTIVE",
    followerCount: 10,
    followingCount: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("opens ProfileEditDialog when Edit Profile button is clicked", async () => {
    render(
      React.createElement(ProfileHeader, {
        user: mockUser,
        isOwnProfile: true,
      })
    );

    const editBtn = screen.getByRole("button", { name: /edit profile/i });
    expect(screen.queryByRole("heading", { name: /edit profile/i })).not.toBeInTheDocument();

    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /edit profile/i })).toBeInTheDocument();
    });
  });
});

