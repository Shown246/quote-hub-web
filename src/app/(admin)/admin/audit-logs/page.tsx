"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AuditLogRow, type AuditLogItem } from "@/components/admin/audit-log-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ScrollText, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck 
} from "lucide-react";

interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
}

const PAGE_SIZE = 25;

export default function AdminAuditLogsPage() {
  const [resourceType, setResourceType] = useState<string>("ALL");
  const [resourceId, setResourceId] = useState("");
  const [page, setPage] = useState(0);

  const queryParams = new URLSearchParams();
  if (resourceType !== "ALL") {
    queryParams.set("resourceType", resourceType);
  }
  if (resourceId.trim()) {
    queryParams.set("resourceId", resourceId.trim());
  }
  queryParams.set("limit", String(PAGE_SIZE));
  queryParams.set("offset", String(page * PAGE_SIZE));

  const { data, isLoading, isError, refetch } = useQuery<AuditLogsResponse>({
    queryKey: ["admin", "audit-logs", resourceType, resourceId, page],
    queryFn: async () => {
      const url = `/api/v1/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      return apiClient<AuditLogsResponse>(url);
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <ScrollText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs & Governance</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable, append-only security logs recording all moderator actions and administrative events.
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

      {/* Controls: Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by resource ID..."
            value={resourceId}
            onChange={(e) => {
              setResourceId(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "USER", "QUOTE"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setResourceType(type);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                resourceType === type
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "ALL" ? "All Resources" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Entries List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load audit logs</p>
            <p className="text-xs opacity-90 mt-0.5">Please check your permissions and try again.</p>
          </div>
        </div>
      ) : data?.logs?.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl">
          <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-base font-semibold">No audit logs found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No administrative events matching your current filters have been recorded.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {data?.logs?.map((log) => (
            <AuditLogRow key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} ({data?.total} total events)
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
