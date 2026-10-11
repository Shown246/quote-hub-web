"use client";

import React from "react";
import Link from "next/link";
import { Heart, Repeat, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { NotificationItem, NotificationType } from "@/types/api";
import { cn } from "@/lib/utils";

export interface NotificationItemCardProps {
  item: NotificationItem;
  onRead?: (id: string) => void;
  className?: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));

    if (diffSecs < 60) return "just now";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function NotificationItemCard({
  item,
  onRead,
  className,
}: NotificationItemCardProps) {
  const isUnread = item.readAt === null;
  const actor = item.actor;
  const actorName = actor?.displayName || actor?.username || "Someone";
  const initials = (actor?.displayName || actor?.username || "U")
    .slice(0, 2)
    .toUpperCase();

  const getActionText = (type: NotificationType) => {
    switch (type) {
      case "LIKE":
        return `${actorName} liked your quote`;
      case "REPOST":
        return `${actorName} reposted your quote`;
      case "FOLLOW":
        return `${actorName} started following you`;
      default:
        return `${actorName} interacted with you`;
    }
  };

  const getHref = () => {
    if (item.type === "FOLLOW") {
      return `/profile/${actor?.username || item.actorId}`;
    }
    return `/quotes/${item.entityId}`;
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case "LIKE":
        return <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />;
      case "REPOST":
        return <Repeat className="h-3.5 w-3.5 text-emerald-500" />;
      case "FOLLOW":
        return <UserPlus className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (isUnread && onRead) {
      onRead(item.id);
    }
  };

  return (
    <Link
      href={getHref()}
      onClick={handleClick}
      className={cn(
        "group flex items-start gap-3.5 rounded-xl border p-4 transition-colors",
        isUnread
          ? "bg-muted/40 border-primary/20 hover:bg-muted/70"
          : "bg-card border-border hover:bg-accent/40",
        className
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={actor?.profileImageUrl || undefined}
            alt={actorName}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border shadow-sm">
          {getTypeIcon()}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-semibold">{getActionText(item.type)}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>

      {isUnread && (
        <span
          data-testid="unread-indicator"
          className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0 self-center"
          aria-label="Unread notification"
        />
      )}
    </Link>
  );
}
