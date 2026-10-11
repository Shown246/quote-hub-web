"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Mode 1: Request Password Reset
  const [requestEmail, setRequestEmail] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Mode 2: Confirm / Set New Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRequestError(null);
    setIsRequesting(true);

    try {
      await requestPasswordReset(requestEmail);
      setRequestSubmitted(true);
    } catch (err: any) {
      setRequestError(
        err?.detail ||
          err?.message ||
          "Failed to request password reset. Please try again."
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetError(null);
    setFieldErrors({});

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    if (newPassword.length < 8) {
      setFieldErrors({ password: ["Password must be at least 8 characters"] });
      return;
    }

    if (!token) {
      setResetError("Missing password reset token.");
      return;
    }

    setIsResetting(true);

    try {
      await resetPassword({ newPassword, token });
      setResetSuccess(true);
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") {
        setFieldErrors(err.errors);
      } else {
        setResetError(
          err?.detail ||
            err?.message ||
            "Failed to reset password. The token may be invalid or expired."
        );
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Render Confirmation Mode (token is present)
  if (token) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight text-foreground hover:opacity-90"
          >
            Quote-Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Set new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below to regain access to your account.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {resetSuccess ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Password reset successfully!</h2>
              <p className="text-sm text-muted-foreground">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
              <Link href="/login" className={buttonVariants({ className: "w-full" })}>
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleConfirmSubmit} className="space-y-4" noValidate>
              {resetError && (
                <div
                  className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {resetError}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  New Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isResetting}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                {fieldErrors.password && (
                  <div className="text-sm font-medium text-destructive space-y-1">
                    {fieldErrors.password.map((msg, idx) => (
                      <p key={idx}>{msg}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isResetting}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                {fieldErrors.confirmPassword && (
                  <div className="text-sm font-medium text-destructive space-y-1">
                    {fieldErrors.confirmPassword.map((msg, idx) => (
                      <p key={idx}>{msg}</p>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isResetting}>
                {isResetting ? "Updating Password..." : "Reset Password"}
              </Button>
            </form>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Render Request Mode (no token in query param)
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-block text-2xl font-bold tracking-tight text-foreground hover:opacity-90"
        >
          Quote-Hub
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {requestSubmitted ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              If an account with {requestEmail} exists, we have sent instructions to reset your password.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setRequestSubmitted(false);
                setRequestEmail("");
              }}
            >
              Try another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-4" noValidate>
            {requestError && (
              <div
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                role="alert"
              >
                {requestError}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                disabled={isRequesting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isRequesting}>
              {isRequesting ? "Sending Link..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
