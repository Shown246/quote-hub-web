"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

export interface SuspendUserModalProps {
  user: { id: string; username: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuspendUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: SuspendUserModalProps) {
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: { status: "SUSPENDED"; reason: string; until?: string } = {
        status: "SUSPENDED",
        reason: reason.trim(),
      };

      if (until) {
        payload.until = new Date(until).toISOString();
      }

      await apiClient(`/api/v1/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast.success(`User @${user.username} has been suspended`);
      setReason("");
      setUntil("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to suspend user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Suspend User</h2>
              <p className="text-sm text-muted-foreground">
                Suspend account access for <span className="font-semibold text-foreground">@{user.username}</span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="suspend-reason" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="suspend-reason"
              placeholder="Provide a clear, detailed reason for this moderation suspension..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded immutably in the administrative audit logs.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="suspend-until" className="text-sm font-medium">
              Suspended Until (Optional)
            </label>
            <Input
              id="suspend-until"
              type="datetime-local"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for an indefinite suspension.
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
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? "Suspending..." : "Suspend User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
