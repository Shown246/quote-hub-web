import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnboardingPage from "@/app/(public)/onboarding/page";
import * as authClientModule from "@/lib/auth-client";
import * as useAuthModule from "@/hooks/use-auth";
import * as nextNavigation from "next/navigation";
import { ApiError } from "@/lib/api-client";

describe("Google OAuth Username Onboarding Screen", () => {
  const pushMock = vi.fn();
  const refreshSessionMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(nextNavigation, "useRouter").mockReturnValue({
      push: pushMock,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as any);

    vi.spyOn(nextNavigation, "useSearchParams").mockReturnValue(
      new URLSearchParams("username=generated_user123") as any
    );

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: {
        id: "u-google",
        username: "generated_user123",
        displayName: "Google User",
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
      refreshSession: refreshSessionMock,
    });
  });

  it("renders initial generated username with immutability notice", () => {
    render(<OnboardingPage />);

    expect(screen.getByRole("heading", { name: /choose your username/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("generated_user123")).toBeInTheDocument();
    expect(screen.getByText(/once your username is finalized it cannot be changed/i)).toBeInTheDocument();
  });

  it("validates username minimum length and invalid characters", async () => {
    render(<OnboardingPage />);

    const input = screen.getByLabelText(/username/i);

    // Too short (2 chars)
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("button", { name: /finalize/i }));

    expect(await screen.findByText(/between 3 and 30 characters/i)).toBeInTheDocument();

    // Invalid characters (spaces/special chars)
    fireEvent.change(input, { target: { value: "invalid handle!" } });
    fireEvent.click(screen.getByRole("button", { name: /finalize/i }));

    expect(await screen.findByText(/only contain letters, numbers, and underscores/i)).toBeInTheDocument();
  });

  it("successfully finalizes username and redirects to for-you feed", async () => {
    const finalizeSpy = vi
      .spyOn(authClientModule, "finalizeUsername")
      .mockResolvedValue({} as any);

    render(<OnboardingPage />);

    const input = screen.getByLabelText(/username/i);
    fireEvent.change(input, { target: { value: "custom_handle" } });

    fireEvent.click(screen.getByRole("button", { name: /finalize/i }));

    await waitFor(() => {
      expect(finalizeSpy).toHaveBeenCalledWith("custom_handle");
      expect(refreshSessionMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/feed/for-you");
    });
  });

  it("displays conflict error when username is already taken", async () => {
    vi.spyOn(authClientModule, "finalizeUsername").mockRejectedValue(
      new ApiError({
        status: 409,
        code: "CONFLICT",
        detail: "Username is already taken",
      })
    );

    render(<OnboardingPage />);

    const input = screen.getByLabelText(/username/i);
    fireEvent.change(input, { target: { value: "taken_handle" } });

    fireEvent.click(screen.getByRole("button", { name: /finalize/i }));

    expect(
      await screen.findByText(/this username is already taken/i)
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
