"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUploadDialog } from "./avatar-upload-dialog";
import type { UserProfile } from "@/types/api";

export interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated?: (updatedUser: UserProfile) => void;
}

export function ProfileEditDialog({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: ProfileEditDialogProps) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const prevIsOpenRef = useRef(false);

  // Sync state only when dialog transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setGeneralError(null);
      setFieldErrors({});
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting && !isAvatarDialogOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, isAvatarDialogOpen, onClose]);

  if (!isOpen) return null;

  const initials = (displayName || user.username || "U")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const trimmedName = displayName.trim();
    const errors: Record<string, string[]> = {};

    if (!trimmedName || trimmedName.length < 1 || trimmedName.length > 50) {
      errors.displayName = [
        "Display name is required and must be between 1 and 50 characters.",
      ];
    }

    if (bio && bio.length > 160) {
      errors.bio = ["Bio cannot exceed 160 characters."];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: { displayName: string; bio: string | null } = {
        displayName: trimmedName,
        bio: bio.trim() ? bio.trim() : null,
      };

      const updatedUser = await apiClient<UserProfile>("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }
      onClose();
    } catch (err: any) {
      if (err?.errors && typeof err.errors === "object") {
        setFieldErrors(err.errors);
      } else if (err?.detail && typeof err.detail === "string") {
        setGeneralError(err.detail);
      } else if (err?.message && typeof err.message === "string") {
        setGeneralError(err.message);
      } else {
        setGeneralError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarSuccess = async () => {
    try {
      const refreshed = await apiClient<UserProfile>("/api/v1/users/me");
      if (onProfileUpdated) {
        onProfileUpdated(refreshed);
      }
    } catch {
      if (onProfileUpdated) {
        onProfileUpdated({ ...user });
      }
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-dialog-title"
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2
              id="profile-edit-dialog-title"
              className="text-lg font-semibold text-foreground"
            >
              Edit Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close dialog"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {generalError && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-sm text-destructive"
            >
              {generalError}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-4">
            <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
              <AvatarImage
                src={user.profileImageUrl || undefined}
                alt={user.displayName || user.username}
              />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Profile Photo
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAvatarDialogOpen(true)}
              >
                Change Avatar
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="edit-display-name"
                className="text-xs font-semibold text-foreground"
              >
                Display Name
              </label>
              <Input
                id="edit-display-name"
                value={displayName}
                maxLength={50}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                disabled={isSubmitting}
                className={fieldErrors.displayName ? "border-destructive" : ""}
              />
              {fieldErrors.displayName ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.displayName[0]}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  1-50 characters. This is the name shown on your quotes and
                  profile.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-bio"
                  className="text-xs font-semibold text-foreground"
                >
                  Bio
                </label>
                <span
                  className={`text-[11px] ${
                    bio.length > 160
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {bio.length}/160
                </span>
              </div>
              <Textarea
                id="edit-bio"
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                rows={3}
                disabled={isSubmitting}
                className={fieldErrors.bio ? "border-destructive" : ""}
              />
              {fieldErrors.bio ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.bio[0]}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Optional. Maximum 160 characters.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <AvatarUploadDialog
        isOpen={isAvatarDialogOpen}
        onClose={() => setIsAvatarDialogOpen(false)}
        onUploadSuccess={handleAvatarSuccess}
      />
    </>
  );
}
