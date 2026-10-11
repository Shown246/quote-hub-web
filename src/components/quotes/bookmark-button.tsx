"use client";

import React from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarkMutation } from "@/hooks/use-bookmark-mutation";

export interface BookmarkButtonProps {
  quoteId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export function BookmarkButton({
  quoteId,
  initialBookmarked,
  className = "",
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, isPending } = useBookmarkMutation(
    quoteId,
    initialBookmarked !== undefined ? { bookmarked: initialBookmarked } : undefined
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleBookmark}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs transition-colors ${
        isBookmarked
          ? "text-blue-500 hover:text-blue-600 dark:text-blue-400"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark quote"}
      title={isBookmarked ? "Remove bookmark" : "Bookmark quote"}
    >
      <Bookmark
        className={`h-4 w-4 transition-transform active:scale-125 ${
          isBookmarked ? "fill-current text-blue-500" : ""
        }`}
      />
    </Button>
  );
}
