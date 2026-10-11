"use client";

import React from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLikeMutation } from "@/hooks/use-like-mutation";

export interface LikeButtonProps {
  quoteId: string;
  isOwner?: boolean;
  initialLiked?: boolean;
  initialLikeCount?: number;
  className?: string;
}

export function LikeButton({
  quoteId,
  isOwner = false,
  initialLiked,
  initialLikeCount,
  className = "",
}: LikeButtonProps) {
  const { isLiked, likeCount, toggleLike, canLike, isPending } = useLikeMutation(
    quoteId,
    isOwner,
    initialLikeCount !== undefined || initialLiked !== undefined
      ? { liked: initialLiked, likeCount: initialLikeCount }
      : undefined
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={!canLike || isPending}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs transition-colors ${
        isLiked
          ? "text-red-500 hover:text-red-600 dark:text-red-400"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
      aria-label={isLiked ? "Unlike quote" : "Like quote"}
      title={!canLike ? "You cannot like your own quote" : undefined}
    >
      <Heart
        className={`h-4 w-4 transition-transform active:scale-125 ${
          isLiked ? "fill-current text-red-500" : ""
        }`}
      />
      <span>{likeCount}</span>
    </Button>
  );
}
