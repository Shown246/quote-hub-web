import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";

export interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actorUser?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
}

export interface AuditLogRowProps {
  log: AuditLogItem;
}

export function AuditLogRow({ log }: AuditLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActionBadge = (action: string) => {
    if (action.includes("SUSPEND") || action.includes("DELETE") || action.includes("TAKEDOWN")) {
      return <Badge variant="destructive" className="font-mono text-xs">{action}</Badge>;
    }
    if (action.includes("REINSTATE") || action.includes("CREATE")) {
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono text-xs">{action}</Badge>;
    }
    return <Badge variant="outline" className="font-mono text-xs">{action}</Badge>;
  };

  const actorName = log.actorUser?.displayName || log.actorUser?.username || "System";
  const actorUsername = log.actorUser?.username ? `@${log.actorUser.username}` : "";
  const formattedDate = new Date(log.createdAt).toLocaleString();
  const hasMetadata = Boolean(log.metadata && Object.keys(log.metadata).length > 0);

  return (
    <div className="p-4 border-b border-border bg-card hover:bg-muted/20 transition-colors space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          {getActionBadge(log.action)}
          <span className="text-xs font-mono text-muted-foreground">
            {log.resourceType}: <span className="text-foreground font-semibold">{log.resourceId}</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Actor:</span>
          <span className="font-medium text-foreground">{actorName}</span>
          {actorUsername && <span className="text-xs text-muted-foreground">{actorUsername}</span>}
        </div>

        {hasMetadata && log.metadata?.reason != null && (
          <div className="text-xs text-muted-foreground">
            Reason: <span className="text-foreground font-medium">{String(log.metadata.reason)}</span>
          </div>
        )}
      </div>

      {hasMetadata && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>{isExpanded ? "Hide Metadata JSON" : "View Metadata Details"}</span>
          </button>
          {isExpanded && (
            <pre className="mt-2 p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto text-foreground border border-border">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
