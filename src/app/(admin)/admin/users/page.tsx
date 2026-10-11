"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { SuspendUserModal } from "@/components/admin/suspend-user-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  UserX,
  RefreshCw 
} from "lucide-react";

interface AdminUserItem {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: string;
  suspensionReason?: string | null;
  suspendedUntil?: string | null;
}

interface AdminUsersResponse {
  users: AdminUserItem[];
  total: number;
}

export default function AdminUsersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedUserForSuspension, setSelectedUserForSuspension] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const queryParams = new URLSearchParams();
  if (statusFilter !== "ALL") {
    queryParams.set("status", statusFilter);
  }
  if (search.trim()) {
    queryParams.set("search", search.trim());
  }

  const { data, isLoading, isError, refetch } = useQuery<AdminUsersResponse>({
    queryKey: ["admin", "users", statusFilter, search],
    queryFn: async () => {
      const url = `/api/v1/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      return apiClient<AdminUsersResponse>(url);
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient(`/api/v1/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      });
    },
    onSuccess: () => {
      toast.success("User reinstated successfully");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to reinstate user");
    },
  });

  const handleReinstate = (user: AdminUserItem) => {
    if (confirm(`Are you sure you want to reinstate @${user.username}?`)) {
      reinstateMutation.mutate(user.id);
    }
  };

  const getStatusBadge = (status: AdminUserItem["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Active</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">Suspended</Badge>;
      case "DELETED":
        return <Badge variant="outline" className="text-muted-foreground">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">User Moderation</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user accounts, view status, and enforce platform moderation.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Controls: Search and Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "ACTIVE", "SUSPENDED", "DELETED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "ALL" ? "All Users" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load users</p>
            <p className="text-xs opacity-90 mt-0.5">Please check your permissions and try again.</p>
          </div>
        </div>
      ) : data?.users?.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-base font-semibold">No users found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.users?.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-foreground">
                          {u.displayName || u.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{u.username} {u.email ? `• ${u.email}` : ""}
                        </div>
                        {u.suspensionReason && (
                          <div className="text-xs text-destructive mt-1 font-mono">
                            Suspended: {u.suspensionReason}
                            {u.suspendedUntil && ` (until ${new Date(u.suspendedUntil).toLocaleDateString()})`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-medium">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(u.status)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {u.status === "ACTIVE" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setSelectedUserForSuspension({ id: u.id, username: u.username })}
                        >
                          Suspend
                        </Button>
                      )}
                      {u.status === "SUSPENDED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReinstate(u)}
                          disabled={reinstateMutation.isPending}
                        >
                          Reinstate
                        </Button>
                      )}
                      {u.status === "DELETED" && (
                        <span className="text-xs text-muted-foreground italic">
                          Deactivated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      <SuspendUserModal
        user={selectedUserForSuspension}
        isOpen={Boolean(selectedUserForSuspension)}
        onClose={() => setSelectedUserForSuspension(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
