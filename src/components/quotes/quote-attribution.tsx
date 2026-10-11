import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface QuoteAttributionProps {
  isOriginal: boolean;
  authorName?: string | null;
  user?: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string | null;
  } | null;
  authorClass?: string;
}

export function QuoteAttribution({
  isOriginal,
  authorName,
  user,
  authorClass = "",
}: QuoteAttributionProps) {
  const username = user?.username || "unknown";
  const displayName = user?.displayName || user?.username || "Anonymous";

  if (isOriginal) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/profile/${username}`}
          className={`font-medium hover:underline text-foreground ${authorClass}`}
        >
          {displayName}
        </Link>
        <Badge variant="secondary" className="text-xs font-normal">
          Original
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {authorName ? (
        <div className={`font-medium text-foreground ${authorClass}`}>
          ― {authorName}
        </div>
      ) : null}
      <div className="text-xs">
        <Link href={`/profile/${username}`} className="hover:underline">
          Posted by @{username}
        </Link>
      </div>
    </div>
  );
}
