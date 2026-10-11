"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { TakedownQuoteModal } from "@/components/admin/takedown-quote-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Quote as QuoteIcon, 
  Search, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  Heart,
  Repeat2
} from "lucide-react";

interface AdminQuoteItem {
  id: string;
  text: string;
  isOriginal: boolean;
  authorName?: string | null;
  themeKey?: string | null;
  likeCount: number;
  repostCount: number;
  deletedAt?: string | null;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    displayName: string;
  };
}

interface AdminQuotesResponse {
  quotes: AdminQuoteItem[];
  total: number;
}

export default function AdminQuotesPage() {
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(true);
  const [selectedQuoteIdForTakedown, setSelectedQuoteIdForTakedown] = useState<string | null>(null);

  const queryParams = new URLSearchParams();
  if (search.trim()) {
    queryParams.set("search", search.trim());
  }
  if (includeDeleted) {
    queryParams.set("includeDeleted", "true");
  }

  const { data, isLoading, isError, refetch } = useQuery<AdminQuotesResponse>({
    queryKey: ["admin", "quotes", search, includeDeleted],
    queryFn: async () => {
      const url = `/api/v1/admin/quotes${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      return apiClient<AdminQuotesResponse>(url);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <QuoteIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Quote Content Moderation</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Search published quotes, view content reports, and issue administrative takedowns.
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

      {/* Controls: Search and Include Deleted Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quote text or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <span>Include Taken-Down Quotes</span>
        </label>
      </div>

      {/* Quotes Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load quotes</p>
            <p className="text-xs opacity-90 mt-0.5">Please check your permissions and try again.</p>
          </div>
        </div>
      ) : data?.quotes?.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl">
          <QuoteIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-base font-semibold">No quotes found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3">Quote Content</th>
                  <th className="px-4 py-3">Author / Attribution</th>
                  <th className="px-4 py-3">Theme</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.quotes?.map((q) => {
                  const isDeleted = Boolean(q.deletedAt);
                  return (
                    <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 max-w-md">
                        <div className={`line-clamp-2 ${isDeleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          “{q.text}”
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: {q.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs">
                          {q.author ? (
                            <div>
                              <span className="font-semibold">@{q.author.username}</span>
                              <div className="text-muted-foreground">{q.author.displayName}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Unknown User</span>
                          )}
                          {!q.isOriginal && q.authorName && (
                            <div className="text-muted-foreground mt-0.5">
                              Attr: <span className="italic">{q.authorName}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs capitalize font-mono">
                          {q.themeKey || "default"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500" />
                            {q.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat2 className="w-3.5 h-3.5 text-emerald-500" />
                            {q.repostCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isDeleted ? (
                          <Badge variant="destructive" className="text-xs">
                            Taken Down
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isDeleted ? (
                          <span className="text-xs text-muted-foreground italic">
                            Soft-Deleted
                          </span>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedQuoteIdForTakedown(q.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Take Down</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Takedown Modal */}
      <TakedownQuoteModal
        quoteId={selectedQuoteIdForTakedown}
        isOpen={Boolean(selectedQuoteIdForTakedown)}
        onClose={() => setSelectedQuoteIdForTakedown(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
