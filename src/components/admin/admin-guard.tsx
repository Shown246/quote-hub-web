"use client";

import React, { type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const isAuthorized = Boolean(isAdmin && user?.status === "ACTIVE");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <p className="text-sm text-muted-foreground animate-pulse">Checking administrator permissions...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
        <div className="p-3 bg-destructive/10 text-destructive rounded-full">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          Admin access required. You do not have permission to view or manage the administrative governance console.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
