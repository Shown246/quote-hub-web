"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

export interface QuoteDeleteDialogProps {
  quoteId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function QuoteDeleteDialog({
  quoteId,
  isOpen,
  onClose,
  onDeleted,
}: QuoteDeleteDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await apiClient(`/api/v1/quotes/${quoteId}`, {
        method: "DELETE",
      });

      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });

      onDeleted?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || "Failed to delete quote");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
              Delete Quote
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this quote? This action will remove it from feeds and cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
