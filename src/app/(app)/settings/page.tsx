"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteAccountModal } from "@/components/profile/delete-account-modal";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleAccountDeleted = async () => {
    try {
      await logout();
    } catch {
      // Continue with redirect even if logout call fails
    }
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="rounded-2xl border border-destructive/20 bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container max-w-4xl mx-auto px-4 py-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Sign In Required</h1>
        <p className="text-muted-foreground">
          You must be logged in to view your account settings.
        </p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </main>
    );
  }

  const initials = (user.displayName || user.username || "U")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and profile information.
        </p>
      </div>

      {/* Profile Overview Section */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Profile Overview
          </h2>
          <Link
            href={`/profile/${user.username}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View Public Profile
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage
              src={user.profileImageUrl || undefined}
              alt={user.displayName || user.username}
            />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">
              {user.displayName}
            </p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {user.bio ? (
              <p className="text-sm text-foreground/80 pt-1 max-w-md">
                {user.bio}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Role: </span>
            <span className="font-medium text-foreground">{user.role}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Account Status: </span>
            <span className="font-medium text-foreground">{user.status}</span>
          </div>
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-destructive">
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated quotes, collections, and interactions.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="destructive"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={handleAccountDeleted}
      />
    </main>
  );
}
