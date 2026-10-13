"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserX, X } from "lucide-react";

export interface DeleteUserModalProps {
  user: { id: string; username: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: DeleteUserModalProps) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await apiClient(`/api/v1/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "DELETED",
          reason: reason.trim() || "Administrative permanent ban and account deletion",
        }),
      });

      toast.success(`User @${user.username} has been permanently banned and deleted`);
      setReason("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to permanently ban/delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-destructive/30 bg-card p-6 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-destructive/10 text-destructive">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-destructive">
                Permanently Ban & Delete User
              </h2>
              <p className="text-sm text-muted-foreground">
                Action for <span className="font-semibold text-foreground">@{user.username}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive space-y-1">
          <p className="font-semibold">Irreversible Action</p>
          <p>
            This user account will be deactivated and queued for full data purging. All quotes and reposts will immediately disappear from feeds.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="delete-reason" className="text-sm font-medium">
              Reason for Ban / Deletion (Optional)
            </label>
            <Textarea
              id="delete-reason"
              placeholder="Explain why this account is being permanently banned and deleted..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged in the administrative audit log.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Permanently Ban & Delete"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== "undefined" && mounted) {
    return createPortal(dialogContent, document.body);
  }
  return dialogContent;
}
