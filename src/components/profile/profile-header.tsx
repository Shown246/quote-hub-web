"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "./follow-button";
import { ProfileEditDialog } from "./profile-edit-dialog";
import type { UserProfile } from "@/types/api";

export interface ProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  onEditProfile?: () => void;
  isLoadingFollow?: boolean;
  onProfileUpdated?: (updatedUser: UserProfile) => void;
}

function formatJoinDate(dateString?: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return "";
  }
}

export function ProfileHeader({
  user,
  isOwnProfile = false,
  isFollowing = false,
  onFollowToggle,
  onEditProfile,
  isLoadingFollow = false,
  onProfileUpdated,
}: ProfileHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const initials = (user.displayName || user.username || "U")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const joinDate = formatJoinDate(user.createdAt);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
    onEditProfile?.();
  };

  return (
    <div className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-border shadow-sm">
            <AvatarImage
              src={user.profileImageUrl || undefined}
              alt={user.displayName || user.username}
            />
            <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {user.displayName}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          {isOwnProfile ? (
            <Button
              variant="outline"
              onClick={handleEditClick}
              className="w-full sm:w-auto font-medium"
            >
              Edit Profile
            </Button>
          ) : (
            <FollowButton
              userId={user.id}
              isOwnProfile={isOwnProfile}
              initialFollowing={isFollowing}
              initialFollowerCount={user.followerCount}
              onToggle={onFollowToggle}
              className="w-full sm:w-auto font-medium"
            />
          )}
        </div>
      </div>

      {user.bio ? (
        <p className="text-sm sm:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed max-w-2xl">
          {user.bio}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-muted-foreground pt-1">
        {joinDate ? (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
              />
            </svg>
            <span>Joined {joinDate}</span>
          </div>
        ) : null}

        {/* 
          CRITICAL PRIVACY RULE (PRD Section 41):
          Actual follower and following lists are strictly private.
          Counts must be displayed as plain text, NEVER as clickable links, buttons,
          or modal triggers.
        */}
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold text-foreground">
              {user.followerCount}
            </span>{" "}
            <span className="text-muted-foreground">followers</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-foreground">
              {user.followingCount}
            </span>{" "}
            <span className="text-muted-foreground">following</span>
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <ProfileEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          user={user}
          onProfileUpdated={onProfileUpdated}
        />
      )}
    </div>
  );
}
