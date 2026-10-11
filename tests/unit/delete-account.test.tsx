import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteAccountModal } from "@/components/profile/delete-account-modal";
import SettingsPage from "@/app/(app)/settings/page";
import * as apiClientModule from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import * as useAuthModule from "@/hooks/use-auth";
import * as nextNavigation from "next/navigation";

describe("DeleteAccountModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<DeleteAccountModal isOpen={false} onClose={() => {}} onDeleted={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("requires typing DELETE to confirm account deletion", async () => {
    const deleteSpy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      message: "Account deleted successfully",
    });
    const onDeletedMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={onCloseMock}
        onDeleted={onDeletedMock}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/delete account/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /confirm delete/i });
    const input = screen.getByPlaceholderText(/type DELETE/i);

    expect(confirmBtn).toBeDisabled();

    // Partial or lowercase match should keep it disabled
    fireEvent.change(input, { target: { value: "delete" } });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "DELETE " } });
    expect(confirmBtn).toBeDisabled();

    // Exact match enables button
    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("/api/v1/users/me", { method: "DELETE" });
      expect(onDeletedMock).toHaveBeenCalled();
    });
  });

  it("handles API error gracefully and displays error message", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(
      new ApiError({
        status: 400,
        code: "CANNOT_DELETE",
        detail: "Cannot delete account with active subscriptions",
      })
    );
    const onDeletedMock = vi.fn();

    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={() => {}}
        onDeleted={onDeletedMock}
      />
    );

    const input = screen.getByPlaceholderText(/type DELETE/i);
    fireEvent.change(input, { target: { value: "DELETE" } });

    const confirmBtn = screen.getByRole("button", { name: /confirm delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Cannot delete account with active subscriptions")
      ).toBeInTheDocument();
    });

    expect(onDeletedMock).not.toHaveBeenCalled();
  });

  it("handles generic unknown error when deleting", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue("Unknown error");
    render(
      <DeleteAccountModal
        isOpen={true}
        onClose={() => {}}
        onDeleted={() => {}}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/type DELETE/i), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("closes on Cancel button click", () => {
    const onCloseMock = vi.fn();
    render(<DeleteAccountModal isOpen={true} onClose={onCloseMock} />);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("closes on Escape key press when not submitting", () => {
    const onCloseMock = vi.fn();
    render(<DeleteAccountModal isOpen={true} onClose={onCloseMock} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("resets input state when reopened", () => {
    const { rerender } = render(
      <DeleteAccountModal isOpen={true} onClose={() => {}} />
    );

    const input = screen.getByPlaceholderText(/type DELETE/i);
    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(input).toHaveValue("DELETE");

    // Close
    rerender(<DeleteAccountModal isOpen={false} onClose={() => {}} />);

    // Reopen
    rerender(<DeleteAccountModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByPlaceholderText(/type DELETE/i)).toHaveValue("");
  });
});

describe("SettingsPage", () => {
  const mockUser = {
    id: "user-1",
    username: "testuser",
    displayName: "Test User",
    bio: "Hello world",
    profileImageUrl: null,
    role: "USER" as const,
    status: "ACTIVE" as const,
    followerCount: 5,
    followingCount: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const pushMock = vi.fn();
  const logoutMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(nextNavigation, "useRouter").mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      logout: logoutMock,
    } as any);
  });

  it("renders settings page with danger zone and Delete Account button", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: /account settings/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete account/i })).toBeInTheDocument();
  });

  it("renders skeleton loader when loading", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      logout: logoutMock,
    } as any);

    const { container } = render(<SettingsPage />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders sign-in prompt when unauthenticated and redirects on button click", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: logoutMock,
    } as any);

    render(<SettingsPage />);
    expect(screen.getByText("Sign In Required")).toBeInTheDocument();

    const loginBtn = screen.getByRole("button", { name: /go to login/i });
    fireEvent.click(loginBtn);
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("opens modal and triggers logout + redirect when deletion succeeds", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      message: "Account deleted successfully",
    });

    render(<SettingsPage />);

    // Click Delete Account button
    const deleteBtn = screen.getByRole("button", { name: /delete account/i });
    fireEvent.click(deleteBtn);

    // Modal should be open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Type DELETE and confirm
    fireEvent.change(screen.getByPlaceholderText(/type DELETE/i), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });
});
