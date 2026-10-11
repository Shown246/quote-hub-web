import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/use-notifications";
import * as apiClientModule from "@/lib/api-client";
import * as useAuthModule from "@/hooks/use-auth";
import React from "react";

describe("useNotifications Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({ isAuthenticated: true } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("calculates unreadCount accurately based on readAt === null", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
      data: [
        { id: "n-1", type: "LIKE", readAt: null },
        { id: "n-2", type: "FOLLOW", readAt: "2026-03-01T12:00:00Z" },
        { id: "n-3", type: "REPOST", readAt: null },
      ],
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => {
      expect(result.current.notifications.length).toBe(3);
    });
    expect(result.current.unreadCount).toBe(2);
  });

  it("disables query when unauthenticated (guest protection)", async () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({ isAuthenticated: false } as any);
    const apiSpy = vi.spyOn(apiClientModule, "apiClient");

    const { result } = renderHook(() => useNotifications(), { wrapper });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("optimistically marks all notifications as read before API finishes", async () => {
    let apiResolved = false;
    const initialData = [
      { id: "n-1", type: "LIKE", readAt: null },
      { id: "n-2", type: "REPOST", readAt: null },
    ];
    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/notifications/read-all")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            apiResolved = true;
            resolve({ count: 2 });
          }, 100);
        });
      }
      return { data: initialData };
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    act(() => {
      result.current.markAllRead();
    });

    // Zeroed out optimistically before the API finishes
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every((n) => n.readAt !== null)).toBe(true);
    });
    expect(apiResolved).toBe(false);
  });

  it("optimistically marks a single notification as read before API finishes", async () => {
    let apiResolved = false;
    const initialData = [
      { id: "n-1", type: "LIKE", readAt: null },
      { id: "n-2", type: "REPOST", readAt: null },
    ];
    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/notifications/n-1/read")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            apiResolved = true;
            resolve({ id: "n-1", type: "LIKE", readAt: "2026-03-01T13:00:00Z" });
          }, 100);
        });
      }
      return { data: initialData };
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    act(() => {
      result.current.markRead("n-1");
    });

    // Updated optimistically before the API finishes
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
      const n1 = result.current.notifications.find((n) => n.id === "n-1");
      expect(n1?.readAt).not.toBeNull();
    });
    expect(apiResolved).toBe(false);
  });

  it("rolls back optimistic markAllRead state when mutation fails", async () => {
    const initialData = [
      { id: "n-1", type: "LIKE", readAt: null },
      { id: "n-2", type: "REPOST", readAt: null },
    ];
    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/notifications/read-all")) {
        throw new Error("Failed to mark all as read");
      }
      return { data: initialData };
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    act(() => {
      result.current.markAllRead();
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
      expect(result.current.notifications.every((n) => n.readAt === null)).toBe(true);
    });
  });

  it("rolls back optimistic markRead state when mutation fails", async () => {
    const initialData = [
      { id: "n-1", type: "LIKE", readAt: null },
      { id: "n-2", type: "REPOST", readAt: null },
    ];
    vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/notifications/n-1/read")) {
        throw new Error("Failed to mark single as read");
      }
      return { data: initialData };
    });

    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    act(() => {
      result.current.markRead("n-1");
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
      const n1 = result.current.notifications.find((n) => n.id === "n-1");
      expect(n1?.readAt).toBeNull();
    });
  });
});
