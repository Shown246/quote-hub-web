"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Compass,
  Search,
  Bookmark,
  User,
  Plus,
  Bell,
} from "lucide-react";
import { QuoteComposerDialog } from "@/components/quotes/quote-composer-dialog";
import { cn } from "@/lib/utils";

export interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const profileHref = user?.username ? `/profile/${user.username}` : "/login";

  return (
    <>
      <nav
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border h-16 px-3 flex items-center justify-around",
          className
        )}
        aria-label="Mobile Navigation"
      >
        <Link
          href="/feed/for-you"
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
            pathname === "/feed/for-you" || pathname === "/"
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="For You Feed"
          aria-current={pathname === "/feed/for-you" || pathname === "/" ? "page" : undefined}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">For You</span>
        </Link>

        <Link
          href="/search"
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
            pathname.startsWith("/search")
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Search"
          aria-current={pathname.startsWith("/search") ? "page" : undefined}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Search</span>
        </Link>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="flex items-center justify-center -mt-5 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Compose new quote"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        <Link
          href="/saved"
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
            pathname.startsWith("/saved")
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Saved Quotes"
          aria-current={pathname.startsWith("/saved") ? "page" : undefined}
        >
          <Bookmark className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Saved</span>
        </Link>

        <Link
          href={profileHref}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
            user?.username && pathname === `/profile/${user.username}`
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="User Profile"
          aria-current={user?.username && pathname === `/profile/${user.username}` ? "page" : undefined}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </Link>
      </nav>

      {isComposerOpen && (
        <QuoteComposerDialog
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
        />
      )}
    </>
  );
}
