"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { countUnicodeCharacters } from "@/lib/unicode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Theme, Quote } from "@/types/api";
import { getThemeDefinition } from "@/themes/registry";
import { X } from "lucide-react";

export interface QuoteComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (quote: Quote) => void;
}

export function QuoteComposerDialog({
  isOpen,
  onClose,
  onSuccess,
}: QuoteComposerDialogProps) {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [isOriginal, setIsOriginal] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ["themes"],
    queryFn: () => apiClient<Theme[]>("/api/v1/themes"),
    enabled: isOpen,
  });

  useEffect(() => {
    if (themes.length > 0 && !selectedThemeId) {
      setSelectedThemeId(themes[0].id);
    }
  }, [themes, selectedThemeId]);

  if (!isOpen) return null;

  const charCount = countUnicodeCharacters(text);
  const remaining = 280 - charCount;
  const isOverLimit = remaining < 0;
  const isValid = text.trim().length > 0 && !isOverLimit;

  const selectedTheme = themes.find((t) => t.id === selectedThemeId);
  const previewTheme = getThemeDefinition(selectedTheme?.key);

  const handleOriginalChange = (checked: boolean) => {
    setIsOriginal(checked);
    if (checked) {
      setAuthorName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `quote-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const payload = {
        text: text.trim(),
        isOriginal,
        authorName: isOriginal ? null : (authorName.trim() || null),
        themeId: selectedThemeId || (themes[0]?.id ?? "018f3a2c-0000-7000-8000-000000000001"),
      };

      const createdQuote = await apiClient<Quote>("/api/v1/quotes", {
        method: "POST",
        body: JSON.stringify(payload),
        idempotencyKey,
      });

      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });

      setText("");
      setIsOriginal(true);
      setAuthorName("");
      onSuccess?.(createdQuote);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || "Failed to create quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-dialog-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 id="composer-dialog-title" className="text-lg font-semibold text-foreground">
            Create Quote
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
            <label htmlFor="quote-text-input" className="text-sm font-medium text-foreground">
              Quote text
            </label>
            <Textarea
              id="quote-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your quote or words of wisdom..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Max 280 characters</span>
              <span
                data-testid="char-counter"
                className={`font-mono ${
                  isOverLimit ? "text-destructive font-bold" : "text-muted-foreground"
                }`}
              >
                {charCount} / 280
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="original-quote-checkbox"
              checked={isOriginal}
              onChange={(e) => handleOriginalChange(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <label
              htmlFor="original-quote-checkbox"
              className="text-sm font-medium text-foreground cursor-pointer select-none"
            >
              Original quote
            </label>
          </div>

          {!isOriginal && (
            <div className="space-y-1.5">
              <label htmlFor="author-name-input" className="text-sm font-medium text-foreground">
                Author name
              </label>
              <Input
                id="author-name-input"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Marcus Aurelius (optional)"
              />
            </div>
          )}

          {themes.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="theme-select" className="text-sm font-medium text-foreground">
                Theme
              </label>
              <select
                id="theme-select"
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

          {/* Live Preview Card */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Live Preview
            </span>
            <div
              data-testid="composer-live-preview"
              className={`rounded-xl border p-4 transition-all shadow-sm ${previewTheme.containerClass}`}
            >
              <blockquote className={`text-base leading-relaxed ${previewTheme.textClass}`}>
                {text.trim() ? text : "Your quote will appear here..."}
              </blockquote>
              <div className={`mt-3 text-xs font-medium ${previewTheme.authorClass}`}>
                {isOriginal ? "— Original (You)" : `— ${authorName.trim() || "Attributed author"}`}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Quote"}
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
