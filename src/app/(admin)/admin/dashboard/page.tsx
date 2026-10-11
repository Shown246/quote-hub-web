"use client";

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { MetricsCards } from "@/components/admin/metrics-cards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefreshCw, BarChart2, ShieldCheck, AlertCircle } from "lucide-react";

interface AnalyticsResponse {
  metrics: Array<{
    metricDate: string;
    registeredUsers: number;
    activeUsers: number;
    quotesCreated: number;
    likesCreated: number;
    repostsCreated: number;
    bookmarksCreated: number;
    followsCreated: number;
  }>;
  total?: number;
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery<AnalyticsResponse>({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      return apiClient<AnalyticsResponse>("/api/v1/admin/analytics");
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      return apiClient<{ success: boolean; message: string }>("/api/v1/admin/reconcile-counters", {
        method: "POST",
      });
    },
    onSuccess: (res) => {
      toast.success(res?.message || "Counters reconciled successfully");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to reconcile counters");
    },
  });

  const latestMetric = data?.metrics?.[0] || {
    registeredUsers: 0,
    activeUsers: 0,
    quotesCreated: 0,
    likesCreated: 0,
    repostsCreated: 0,
    bookmarksCreated: 0,
    followsCreated: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            System overview, daily engagement totals, and database counter reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${reconcileMutation.isPending ? "animate-spin" : ""}`} />
            <span>{reconcileMutation.isPending ? "Reconciling..." : "Reconcile Counters"}</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load platform analytics</p>
            <p className="text-xs opacity-90 mt-0.5">Please check your permissions and try again.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <MetricsCards metric={latestMetric} />

          {/* Engagement History Table */}
          {data?.metrics && data.metrics.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-base font-semibold">Historical Activity Log</h2>
                <span className="text-xs text-muted-foreground">
                  Showing last {data.metrics.length} recorded snapshot(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3">Active (24h)</th>
                      <th className="px-4 py-3">Quotes</th>
                      <th className="px-4 py-3">Likes</th>
                      <th className="px-4 py-3">Reposts</th>
                      <th className="px-4 py-3">Bookmarks</th>
                      <th className="px-4 py-3">Follows</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.metrics.map((row, idx) => (
                      <tr key={row.metricDate || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {row.metricDate ? new Date(row.metricDate).toLocaleDateString() : "Latest"}
                        </td>
                        <td className="px-4 py-3">{row.registeredUsers.toLocaleString()}</td>
                        <td className="px-4 py-3">{row.activeUsers.toLocaleString()}</td>
                        <td className="px-4 py-3">{row.quotesCreated.toLocaleString()}</td>
                        <td className="px-4 py-3">{row.likesCreated.toLocaleString()}</td>
                        <td className="px-4 py-3">{row.repostsCreated.toLocaleString()}</td>
                        <td className="px-4 py-3">{row.bookmarksCreated.toLocaleString()}</td>
                        <td className="px-4 py-3">{row.followsCreated.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
