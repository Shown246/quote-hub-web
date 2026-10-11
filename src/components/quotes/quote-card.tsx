import React, { useState } from "react";
import Link from "next/link";
import { Quote } from "@/types/api";
import { PresentationMode } from "@/hooks/use-presentation-mode";
import { getThemeDefinition } from "@/themes/registry";
import { QuoteAttribution } from "./quote-attribution";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { LikeButton } from "./like-button";
import { RepostButton } from "./repost-button";
import { BookmarkButton } from "./bookmark-button";
import { QuoteEditDialog } from "./quote-edit-dialog";
import { QuoteDeleteDialog } from "./quote-delete-dialog";

export interface QuoteCardProps {
  quote: Quote;
  presentationMode?: PresentationMode;
  currentUserId?: string | null;
  onEdit?: (quote: Quote) => void;
  onDelete?: (quoteId: string) => void;
  className?: string;
}

export function QuoteCard({
  quote,
  presentationMode = "card",
  currentUserId,
  onEdit,
  onDelete,
  className = "",
}: QuoteCardProps) {
  const theme = getThemeDefinition(quote.themeKey || quote.theme?.key);
  const isOwner = Boolean(currentUserId && currentUserId === quote.userId);
  const user = quote.user;
  const username = user?.username || "unknown";
  const userInitials = (user?.displayName || username).slice(0, 2).toUpperCase();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isCard = presentationMode === "card";

  return (
    <>
      <article
        className={`relative rounded-xl border p-5 transition-shadow ${
          isCard
            ? `${theme.containerClass} shadow-sm hover:shadow-md`
            : "bg-background border-border/50 hover:bg-muted/30"
        } ${className}`}
        data-testid={`quote-card-${quote.id}`}
        data-presentation-mode={presentationMode}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${username}`}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={username} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/profile/${username}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                @{username}
              </Link>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => (onEdit ? onEdit(quote) : setIsEditDialogOpen(true))}
                aria-label="Edit quote"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => (onDelete ? onDelete(quote.id) : setIsDeleteDialogOpen(true))}
                aria-label="Delete quote"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

      <div className="mb-4">
        <blockquote
          className={`text-base leading-relaxed ${
            isCard ? theme.textClass : "font-normal text-foreground"
          }`}
        >
          {quote.text}
        </blockquote>
      </div>

      <div className="mb-4">
        <QuoteAttribution
          isOriginal={quote.isOriginal}
          authorName={quote.authorName}
          user={user}
          authorClass={isCard ? theme.authorClass : undefined}
        />
      </div>

      <div className="flex items-center justify-between border-t pt-3 text-muted-foreground text-xs">
        <div className="flex items-center gap-1">
          <LikeButton
            quoteId={quote.id}
            isOwner={isOwner}
            initialLiked={quote.liked ?? quote.isLiked}
            initialLikeCount={quote.likeCount}
          />
          <RepostButton
            quoteId={quote.id}
            initialReposted={quote.reposted ?? quote.isReposted}
            initialRepostCount={quote.repostCount}
          />
          <BookmarkButton
            quoteId={quote.id}
            initialBookmarked={quote.bookmarked ?? quote.isBookmarked}
          />
        </div>
        {quote.createdAt && (
          <time dateTime={quote.createdAt}>
            {new Date(quote.createdAt).toLocaleDateString()}
          </time>
        )}
      </div>
    </article>

    {isOwner && (
      <>
        <QuoteEditDialog
          quote={quote}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
        <QuoteDeleteDialog
          quoteId={quote.id}
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
        />
      </>
    )}
  </>
);
}
