"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void | Promise<void>;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onDeleted,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const prevIsOpenRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setConfirmText("");
      setErrorMessage(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Handle escape key to dismiss modal if not deleting
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const isConfirmed = confirmText === "DELETE";

  const handleConfirmDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await apiClient<{ message?: string }>("/api/v1/users/me", {
        method: "DELETE",
      });
      if (onDeleted) {
        await onDeleted();
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.detail || err.message || "Failed to delete account.");
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2
            id="delete-account-modal-title"
            className="text-lg font-semibold text-destructive"
          >
            Delete Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleConfirmDelete(); }} className="space-y-4">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              This action cannot be undone. This will permanently delete your account, remove your profile, and soft-delete your associated data.
            </p>

            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-sm font-medium">
              Warning: You will be logged out immediately and your account will no longer be accessible.
            </div>

            <label
              htmlFor="delete-confirm-input"
              className="block text-sm font-medium text-foreground pt-1"
            >
              To confirm deletion, please type{" "}
              <span className="font-bold text-destructive">DELETE</span> below:
            </label>

            <Input
              id="delete-confirm-input"
              type="text"
              placeholder="type DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              autoFocus
              className="w-full font-mono"
            />

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive font-medium"
              >
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isConfirmed || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
