"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { countUnicodeCharacters } from "@/lib/unicode";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Theme, Quote } from "@/types/api";
import { X } from "lucide-react";

export interface QuoteEditDialogProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedQuote: Quote) => void;
}

export function QuoteEditDialog({
  quote,
  isOpen,
  onClose,
  onUpdated,
}: QuoteEditDialogProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(quote.text || "");
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    quote.themeId || quote.theme?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ["themes"],
    queryFn: () => apiClient<Theme[]>("/api/v1/themes"),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setText(quote.text || "");
      setSelectedThemeId(quote.themeId || quote.theme?.id || "");
      setErrorMessage(null);
    }
  }, [isOpen, quote]);

  useEffect(() => {
    if (themes.length > 0 && !selectedThemeId) {
      const matchingTheme = themes.find((t) => t.key === quote.themeKey);
      setSelectedThemeId(matchingTheme?.id || themes[0].id);
    }
  }, [themes, selectedThemeId, quote.themeKey]);

  if (!isOpen) return null;

  const charCount = countUnicodeCharacters(text);
  const remaining = 280 - charCount;
  const isOverLimit = remaining < 0;
  const isValid = text.trim().length > 0 && !isOverLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: { text: string; themeId?: string } = {
        text: text.trim(),
      };
      if (selectedThemeId) {
        payload.themeId = selectedThemeId;
      }

      const updatedQuote = await apiClient<Quote>(`/api/v1/quotes/${quote.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });

      onUpdated?.(updatedQuote);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || "Failed to update quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 id="edit-dialog-title" className="text-lg font-semibold text-foreground">
            Edit Quote
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-quote-text" className="text-sm font-medium text-foreground">
              Quote text
            </label>
            <Textarea
              id="edit-quote-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Max 280 characters</span>
              <span
                data-testid="edit-char-counter"
                className={`font-mono ${
                  isOverLimit ? "text-destructive font-bold" : "text-muted-foreground"
                }`}
              >
                {charCount} / 280
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Attribution (Immutable)
            </span>
            <div className="text-sm text-foreground">
              {quote.isOriginal ? (
                <span>Original quote</span>
              ) : (
                <span>{quote.authorName || "Unattributed"}</span>
              )}
            </div>
          </div>

          {themes.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="edit-theme-select" className="text-sm font-medium text-foreground">
                Theme
              </label>
              <select
                id="edit-theme-select"
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
