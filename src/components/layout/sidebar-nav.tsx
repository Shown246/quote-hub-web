"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Compass,
  Users,
  Search,
  Bookmark,
  User,
  Shield,
  PenSquare,
  Bell,
  LogOut,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteComposerDialog } from "@/components/quotes/quote-composer-dialog";
import { cn } from "@/lib/utils";

export interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const navItems = [
    {
      name: "For You",
      href: "/feed/for-you",
      icon: Compass,
      active: pathname === "/feed/for-you" || pathname === "/",
    },
    {
      name: "Following",
      href: "/feed/following",
      icon: Users,
      active: pathname === "/feed/following",
    },
    {
      name: "Search",
      href: "/search",
      icon: Search,
      active: pathname.startsWith("/search"),
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      active: pathname.startsWith("/notifications"),
    },
    {
      name: "Saved",
      href: "/saved",
      icon: Bookmark,
      active: pathname.startsWith("/saved"),
    },
    {
      name: "Profile",
      href: user?.username ? `/profile/${user.username}` : (isAuthenticated ? "/settings" : "/login"),
      icon: User,
      active: Boolean(user?.username && pathname === `/profile/${user.username}`),
    },
  ];

  return (
    <div className={cn("flex flex-col h-full justify-between p-4", className)}>
      <div className="space-y-6">
        <div className="px-2">
          <Link
            href="/feed/for-you"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-lg shadow-sm">
              Q
            </span>
            <span>Quote-Hub</span>
          </Link>
        </div>

        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  item.active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={item.active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", item.active ? "text-primary" : "text-muted-foreground")} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            >
              <Shield
                className={cn(
                  "h-5 w-5",
                  pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {isAuthenticated && (
          <div className="pt-2">
            <Button
              onClick={() => setIsComposerOpen(true)}
              className="w-full gap-2 rounded-xl py-5 shadow-sm font-semibold"
              size="lg"
            >
              <PenSquare className="h-4 w-4" />
              <span>New Quote</span>
            </Button>
          </div>
        )}
      </div>

      <div className="border-t pt-4 mt-auto">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40">
            <Link
              href={user.username ? `/profile/${user.username}` : "/settings"}
              aria-label="Account details"
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {(user.displayName || user.username || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate leading-tight text-foreground">
                  {user.displayName || user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.username ? `@${user.username}` : (user as any).email || ""}
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>

      {isComposerOpen && (
        <QuoteComposerDialog
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
        />
      )}
    </div>
  );
}
