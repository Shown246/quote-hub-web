"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShieldAlert, X } from "lucide-react";

export interface TakedownQuoteModalProps {
  quoteId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TakedownQuoteModal({
  quoteId,
  isOpen,
  onClose,
  onSuccess,
}: TakedownQuoteModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !quoteId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/api/v1/admin/quotes/${quoteId}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: reason.trim() }),
      });

      toast.success("Quote taken down successfully");
      setReason("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to take down quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Administrative Takedown</h2>
              <p className="text-sm text-muted-foreground">
                Remove quote <span className="font-mono text-xs">{quoteId}</span> from public feeds
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
            <label htmlFor="takedown-reason" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="takedown-reason"
              placeholder="Provide a mandatory justification (e.g. Terms of Service violation, copyright infringement, hate speech)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This takedown action is irreversible by standard users and will be recorded in the audit log.
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
              {isSubmitting ? "Taking down..." : "Take Down Quote"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
