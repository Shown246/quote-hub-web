"use client";

import React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/hooks/use-auth";
import { NotificationItemCard } from "@/components/notifications/notification-item-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    isLoading,
    isError,
    refetch,
  } = useNotifications();

  if (isAuthLoading) {
    return (
      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 rounded-2xl border bg-card p-8">
          <Bell className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Please sign in to view your activity notifications.
          </p>
          <Link href="/login" className={buttonVariants({ variant: "default" })}>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <header className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              {unreadCount} new
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm text-destructive">Failed to load notifications.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bell className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-medium">No notifications yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When someone likes or reposts your quotes, or follows you, you will see it here.
          </p>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Explore Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <NotificationItemCard
              key={item.id}
              item={item}
              onRead={markRead}
            />
          ))}
        </div>
      )}
    </main>
  );
}
