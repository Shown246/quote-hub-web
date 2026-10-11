"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokenExecutedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    if (tokenExecutedRef.current === token) return;
    tokenExecutedRef.current = token;

    let mounted = true;
    const executeVerification = async () => {
      try {
        await verifyEmail(token);
        if (mounted) {
          setStatus("success");
        }
      } catch (err: unknown) {
        if (mounted) {
          setStatus("error");
          const msg =
            (err as any)?.detail ||
            (err as any)?.message ||
            "The verification token is invalid or has expired.";
          setErrorMessage(msg);
        }
      }
    };

    executeVerification();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <div className="space-y-2">
        <Link
          href="/"
          className="inline-block text-2xl font-bold tracking-tight text-foreground hover:opacity-90"
        >
          Quote-Hub
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {status === "verifying" && "Verifying your email"}
          {status === "success" && "Email verified!"}
          {status === "error" && "Verification failed"}
          {status === "idle" && "Check your inbox"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {status === "verifying" && "Please wait while we confirm your email address..."}
          {status === "success" &&
            "Your email address has been successfully verified. You can now access your account."}
          {status === "error" &&
            (errorMessage || "We could not verify your email address.")}
          {status === "idle" &&
            "We have sent a verification link to your email address. Please open it to verify your account."}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        {status === "verifying" && (
          <div className="py-6 flex justify-center items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
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
            <Link href="/login" className={buttonVariants({ className: "w-full" })}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <Link href="/login" className={buttonVariants({ className: "w-full" })}>
              Back to Sign In
            </Link>
          </div>
        )}

        {status === "idle" && (
          <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              Did not receive the email? Check your spam folder or sign in to request another link.
            </p>
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              Return to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
