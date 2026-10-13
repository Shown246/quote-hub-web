"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { Repeat } from "lucide-react";
import { QuoteCard } from "@/components/quotes/quote-card";
import type { UserProfile, Quote, PaginatedResponse } from "@/types/api";

export interface ProfilePageProps {
  params?: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser, refreshSession } = useAuth();
  const navParams = useParams<{ username: string }>();

  const [paramUsername, setParamUsername] = useState<string>(navParams?.username || "");

  React.useEffect(() => {
    if (navParams?.username) {
      setParamUsername(navParams.username);
    } else if (params) {
      params.then((p) => {
        if (p?.username) {
          setParamUsername(p.username);
        }
      });
    }
  }, [navParams?.username, params]);

  const rawUsername = navParams?.username || paramUsername;
  let username = "";
  if (typeof rawUsername === "string") {
    try {
      username = decodeURIComponent(rawUsername);
    } catch {
      username = rawUsername;
    }
  }

  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // Fetch public user profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    isSuccess: isProfileSuccess,
  } = useQuery<UserProfile, ApiError | Error>({
    queryKey: ["user", username],
    queryFn: () => apiClient<UserProfile>(`/api/v1/users/${encodeURIComponent(username)}`),
    enabled: Boolean(username),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });

  // Check for 404: API 404 status, code USER_NOT_FOUND, or soft-deleted user
  const isNotFound =
    (isProfileError &&
      ((profileError instanceof ApiError && profileError.status === 404) ||
        (profileError as any)?.status === 404 ||
        (profileError as any)?.code === "USER_NOT_FOUND")) ||
    (isProfileSuccess && profile?.status === "DELETED");

  const [activeTab, setActiveTab] = useState<"quotes" | "reposts">("quotes");

  // Fetch user's quotes stream once profile is loaded and active
  const {
    data: quotesData,
    isLoading: isQuotesLoading,
  } = useQuery<PaginatedResponse<Quote>>({
    queryKey: ["user-quotes", profile?.id],
    queryFn: () => apiClient<PaginatedResponse<Quote>>(`/api/v1/quotes?userId=${profile?.id}`),
    enabled: Boolean(profile?.id && profile.status !== "DELETED"),
  });

  // Fetch user's reposts stream when reposts tab is active
  const {
    data: repostsData,
    isLoading: isRepostsLoading,
  } = useQuery<PaginatedResponse<Quote>>({
    queryKey: ["user-reposts", profile?.id],
    queryFn: () =>
      apiClient<PaginatedResponse<Quote>>(`/api/v1/users/${profile?.id}/reposts`).catch(() =>
        apiClient<PaginatedResponse<Quote>>(`/api/v1/quotes?userId=${profile?.id}&type=reposts`)
      ),
    enabled: Boolean(activeTab === "reposts" && profile?.id && profile.status !== "DELETED"),
  });

  // Follow / Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      if (!profile?.id) return;

      if (isFollowing) {
        await apiClient(`/api/v1/users/${profile.id}/follow`, { method: "DELETE" });
        setIsFollowing(false);
      } else {
        await apiClient(`/api/v1/users/${profile.id}/follow`, { method: "POST" });
        setIsFollowing(true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", username] });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof ApiError
          ? err.detail || err.message
          : err instanceof Error
          ? err.message
          : "Failed to update follow status";
      toast.error(message);
    },
  });

  const isOwnProfile = Boolean(
    currentUser &&
      profile &&
      (currentUser.id === profile.id ||
        currentUser.username.toLowerCase() === profile.username.toLowerCase())
  );

  const handleProfileUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["user", username] });
    if (isOwnProfile && refreshSession) {
      refreshSession();
    }
  };

  const handleFollowToggle = () => {
    followMutation.mutate();
  };

  if (isNotFound) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 rounded-2xl border bg-card p-8">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            User not found
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            The user @{username || "unknown"} does not exist or has been deleted.
          </p>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (isProfileLoading) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (isProfileError || !profile) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 rounded-2xl border bg-card p-8">
          <h1 className="text-2xl font-bold tracking-tight text-destructive">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {profileError?.message || "Failed to load user profile."}
          </p>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const quotes = quotesData?.data || [];
  const reposts = repostsData?.data || [];

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <ProfileHeader
        user={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onProfileUpdated={handleProfileUpdated}
        isLoadingFollow={followMutation.isPending}
      />

      {/* Profile Content Tabs */}
      <section className="space-y-6" aria-label="Profile Content">
        <div className="flex border-b border-border space-x-6 text-sm font-medium">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "quotes"}
            onClick={() => setActiveTab("quotes")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "quotes"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Quotes {quotesData?.data ? `(${quotes.length})` : ""}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reposts"}
            onClick={() => setActiveTab("reposts")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "reposts"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Reposts {repostsData?.data ? `(${reposts.length})` : ""}
          </button>
        </div>

        {activeTab === "quotes" ? (
          isQuotesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <p className="text-base font-medium">No quotes shared yet.</p>
              <p className="text-sm mt-1">
                When @{profile.username} shares quotes, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <article
                  key={quote.id}
                  className="rounded-xl border bg-card p-5 shadow-sm space-y-3 transition-colors hover:border-primary/20"
                  data-testid={`profile-quote-${quote.id}`}
                >
                  <blockquote className="text-base sm:text-lg font-serif italic text-foreground">
                    &ldquo;{quote.text}&rdquo;
                  </blockquote>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                    <span className="font-medium text-foreground/80">
                      {quote.isOriginal
                        ? `— ${profile.displayName}`
                        : `— ${quote.authorName || profile.displayName}`}
                    </span>
                    <div className="flex items-center gap-4">
                      <span>{quote.likeCount} likes</span>
                      <span>{quote.repostCount} reposts</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : isRepostsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : reposts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-base font-medium">No reposts yet.</p>
            <p className="text-sm mt-1">
              When @{profile.username} reposts quotes, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reposts.map((quote) => (
              <div key={quote.id} className="space-y-1.5" data-testid={`profile-repost-${quote.id}`}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1 font-medium">
                  <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{profile.displayName || `@${profile.username}`} reposted</span>
                </div>
                <article className="rounded-xl border bg-card p-5 shadow-sm space-y-3 transition-colors hover:border-primary/20">
                  <blockquote className="text-base sm:text-lg font-serif italic text-foreground">
                    &ldquo;{quote.text}&rdquo;
                  </blockquote>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                    <span className="font-medium text-foreground/80">
                      {quote.isOriginal
                        ? `— ${quote.authorName || "Original author"}`
                        : `— ${quote.authorName || "Unknown"}`}
                    </span>
                    <div className="flex items-center gap-4">
                      <span>{quote.likeCount} likes</span>
                      <span>{quote.repostCount} reposts</span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
