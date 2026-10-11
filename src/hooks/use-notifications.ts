"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type { NotificationItem } from "@/types/api";
import { toast } from "sonner";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

export function useNotifications(): UseNotificationsResult {
  const queryClient = useQueryClient();

  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = Boolean(auth?.isAuthenticated);
  } catch {
    isAuthenticated = false;
  }

  const {
    data: queryData = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<NotificationItem[]>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiClient<{ data: NotificationItem[] }>("/api/v1/notifications", {
        signal,
      });
      return res?.data ?? [];
    },
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 30000 : false,
    staleTime: 10000,
  });

  const notifications = isAuthenticated
    ? (queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_QUERY_KEY) ?? queryData)
    : [];
  const unreadCount = isAuthenticated
    ? notifications.filter((n) => n.readAt === null).length
    : 0;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiClient<{ count: number }>("/api/v1/notifications/read-all", {
        method: "PATCH",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previousNotifications = queryClient.getQueryData<NotificationItem[]>(
        NOTIFICATIONS_QUERY_KEY
      );

      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_QUERY_KEY, (old = []) =>
        old.map((item) => ({
          ...item,
          readAt: item.readAt ?? now,
        }))
      );

      return { previousNotifications };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousNotifications);
      }
      toast.error(err?.detail || err?.message || "Failed to mark all notifications as read");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient<NotificationItem>(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      });
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previousNotifications = queryClient.getQueryData<NotificationItem[]>(
        NOTIFICATIONS_QUERY_KEY
      );

      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_QUERY_KEY, (old = []) =>
        old.map((item) =>
          item.id === id ? { ...item, readAt: item.readAt ?? now } : item
        )
      );

      return { previousNotifications };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousNotifications !== undefined) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousNotifications);
      }
      toast.error(err?.detail || err?.message || "Failed to mark notification as read");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  const markAllRead = () => {
    if (unreadCount === 0 || markAllReadMutation.isPending) return;
    markAllReadMutation.mutate();
  };

  const markRead = (id: string) => {
    if (!id || markReadMutation.isPending) return;
    markReadMutation.mutate(id);
  };

  return {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
