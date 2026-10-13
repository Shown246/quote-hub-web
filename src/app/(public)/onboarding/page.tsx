"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { finalizeUsername } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AtSign, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshSession } = useAuth();

  const initialUsername =
    searchParams.get("username") || user?.username || "";

  const [username, setUsername] = useState(initialUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when user data loads if state is empty
  React.useEffect(() => {
    if (!username && user?.username) {
      setUsername(user.username);
    }
  }, [user?.username, username]);

  const validateUsername = (val: string): string | null => {
    if (!val || val.trim().length === 0) {
      return "Username is required";
    }
    if (val.length < 3 || val.length > 30) {
      return "Username must be between 3 and 30 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return null;
  };

  const handleFinalize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validationMsg = validateUsername(username);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      await finalizeUsername(username);

      if (refreshSession) {
        await refreshSession();
      }
      toast.success("Username finalized! Welcome to Quote-Hub.");
      router.push("/feed/for-you");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === "CONFLICT") {
          setError("This username is already taken. Please choose another.");
          return;
        }
        if (err.status === 400 && err.detail) {
          setError(err.detail);
          return;
        }
        setError(err.detail || err.message || "Failed to finalize username");
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to finalize username";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight text-foreground hover:opacity-90"
          >
            Quote-Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Choose your username
          </h1>
          <p className="text-sm text-muted-foreground">
            We generated an initial username for you. You can customize it once now during onboarding.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
          <form onSubmit={handleFinalize} className="space-y-5" noValidate>
            {error && (
              <div
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="username-input"
                className="text-sm font-medium leading-none text-foreground"
              >
                Username
              </label>
              <div className="relative">
                <AtSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username-input"
                  name="username"
                  type="text"
                  required
                  placeholder="your_handle"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.trim());
                    if (error) setError(null);
                  }}
                  disabled={isSubmitting}
                  className="pl-9 font-mono text-sm"
                  aria-invalid={Boolean(error)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                3–30 characters, letters, numbers, and underscores only.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>One-time selection</span>
              </div>
              <p>
                Per platform rules, once your username is finalized it cannot be changed.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isSubmitting || !username.trim()}
            >
              <span>{isSubmitting ? "Finalizing..." : "Finalize & Enter Quote-Hub"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
