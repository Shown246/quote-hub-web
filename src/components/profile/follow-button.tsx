"use client";

import React from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollowMutation } from "@/hooks/use-follow-mutation";

export interface FollowButtonProps {
  userId: string;
  isOwnProfile?: boolean;
  initialFollowing?: boolean;
  initialFollowerCount?: number;
  onToggle?: () => void;
  className?: string;
}

export function FollowButton({
  userId,
  isOwnProfile = false,
  initialFollowing,
  initialFollowerCount,
  onToggle,
  className = "",
}: FollowButtonProps) {
  const { isFollowing, toggleFollow, canFollow, isPending } = useFollowMutation(
    userId,
    isOwnProfile,
    initialFollowing !== undefined || initialFollowerCount !== undefined
      ? { following: initialFollowing, followerCount: initialFollowerCount }
      : undefined
  );

  if (!canFollow) return null;

  const handleClick = () => {
    toggleFollow();
    onToggle?.();
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={`min-w-[90px] transition-all ${
        isFollowing
          ? "border-border hover:border-destructive hover:bg-destructive/10 hover:text-destructive group"
          : ""
      } ${className}`}
      aria-label={isFollowing ? "Unfollow" : "Follow"}
    >
      {isFollowing ? (
        <>
          <UserCheck className="mr-1.5 h-4 w-4 group-hover:hidden" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="mr-1.5 h-4 w-4" />
          <span>Follow</span>
        </>
      )}
    </Button>
  );
}
