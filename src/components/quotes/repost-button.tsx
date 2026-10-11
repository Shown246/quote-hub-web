"use client";

import React from "react";
import { Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRepostMutation } from "@/hooks/use-repost-mutation";

export interface RepostButtonProps {
  quoteId: string;
  initialReposted?: boolean;
  initialRepostCount?: number;
  className?: string;
}

export function RepostButton({
  quoteId,
  initialReposted,
  initialRepostCount,
  className = "",
}: RepostButtonProps) {
  const { isReposted, repostCount, toggleRepost, isPending } = useRepostMutation(
    quoteId,
    initialRepostCount !== undefined || initialReposted !== undefined
      ? { reposted: initialReposted, repostCount: initialRepostCount }
      : undefined
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleRepost}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-2 py-1 text-xs transition-colors ${
        isReposted
          ? "text-emerald-500 hover:text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
      aria-label={isReposted ? "Undo repost" : "Repost quote"}
    >
      <Repeat2
        className={`h-4 w-4 transition-transform active:rotate-180 ${
          isReposted ? "text-emerald-500" : ""
        }`}
      />
      <span>{repostCount}</span>
    </Button>
  );
}
