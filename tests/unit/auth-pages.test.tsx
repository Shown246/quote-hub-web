import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "@/app/(public)/login/page";
import RegisterPage from "@/app/(public)/register/page";
import VerifyEmailPage from "@/app/(public)/verify-email/page";
import ResetPasswordPage from "@/app/(public)/reset-password/page";
import * as useAuthModule from "@/hooks/use-auth";
import * as authClientModule from "@/lib/auth-client";
import * as nextNavigation from "next/navigation";

describe("Public Auth Pages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      isLoading: false,
    } as any);
  });

  describe("LoginPage", () => {
    it("renders page header and link to register", () => {
      render(<LoginPage />);
      expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute(
        "href",
        "/register"
      );
    });
  });

  describe("RegisterPage", () => {
    it("renders page header and link to sign in", () => {
      render(<RegisterPage />);
      expect(screen.getByRole("heading", { name: "Create an account" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
        "href",
        "/login"
      );
    });
  });

  describe("VerifyEmailPage", () => {
    it("renders idle instructions when no token is present", () => {
      vi.spyOn(nextNavigation, "useSearchParams").mockReturnValue(
        new URLSearchParams() as any
      );

      render(<VerifyEmailPage />);
      expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
      expect(
        screen.getByText(/we have sent a verification link to your email address/i)
      ).toBeInTheDocument();
    });

    it("verifies email successfully when valid token is present", async () => {
      vi.spyOn(nextNavigation, "useSearchParams").mockReturnValue(
        new URLSearchParams("token=valid-tok") as any
      );
      const verifySpy = vi
        .spyOn(authClientModule, "verifyEmail")
        .mockResolvedValue({ status: true });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(verifySpy).toHaveBeenCalledWith("valid-tok");
        expect(screen.getByRole("heading", { name: "Email verified!" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /proceed to sign in/i })).toHaveAttribute(
          "href",
          "/login"
        );
      });
    });

    it("displays error message when token verification fails", async () => {
      vi.spyOn(nextNavigation, "useSearchParams").mockReturnValue(
        new URLSearchParams("token=bad-tok") as any
      );
      vi.spyOn(authClientModule, "verifyEmail").mockRejectedValue({
        detail: "Token has expired",
      });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Verification failed" })
        ).toBeInTheDocument();
        expect(screen.getByText("Token has expired")).toBeInTheDocument();
      });
    });
  });

  describe("ResetPasswordPage", () => {
    it("renders request reset form when no token is present and handles submission", async () => {
      vi.spyOn(nextNavigation, "useSearchParams").mockReturnValue(
        new URLSearchParams() as any
      );
      const requestSpy = vi
        .spyOn(authClientModule, "requestPasswordReset")
        .mockResolvedValue({ status: true });

      render(<ResetPasswordPage />);

      expect(screen.getByRole("heading", { name: "Reset password" })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "user@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

      await waitFor(() => {
        expect(requestSpy).toHaveBeenCalledWith("user@example.com");
        expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
      });
    });

    it("renders set new password form when token is present and validates matching passwords", async () => {
      vi.spyOn(nextNavigation, "useSearchParams").mockReturnValue(
        new URLSearchParams("token=reset-tok") as any
      );
      const resetSpy = vi
        .spyOn(authClientModule, "resetPassword")
        .mockResolvedValue({ status: true });

      render(<ResetPasswordPage />);

      expect(screen.getByRole("heading", { name: "Set new password" })).toBeInTheDocument();

      // Mismatched passwords
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: "mismatch456" },
      });
      fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        expect(resetSpy).not.toHaveBeenCalled();
      });

      // Matching passwords
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledWith({
          newPassword: "password123",
          token: "reset-tok",
        });
        expect(
          screen.getByRole("heading", { name: "Password reset successfully!" })
        ).toBeInTheDocument();
      });
    });
  });
});
