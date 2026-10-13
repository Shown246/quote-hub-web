import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminUsersPage from "@/app/(admin)/admin/users/page";
import * as apiClientModule from "@/lib/api-client";

describe("Admin User Permanent Ban & Deletion", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  const mockUsersResponse = {
    users: [
      {
        id: "u-spammer",
        username: "spammer",
        displayName: "Spam Bot",
        email: "spam@example.com",
        role: "USER",
        status: "ACTIVE",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ],
    total: 1,
  };

  it("renders Ban & Delete action button and opens modal to perform permanent account deletion", async () => {
    const patchSpy = vi.spyOn(apiClientModule, "apiClient").mockImplementation(async (url: string, opts?: any) => {
      if (url.includes("/api/v1/admin/users") && (!opts || opts.method === undefined)) {
        return mockUsersResponse as any;
      }
      if (url.includes("/api/v1/admin/users/u-spammer/status") && opts?.method === "PATCH") {
        return { success: true } as any;
      }
      throw new Error(`Unexpected call: ${url}`);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminUsersPage />
      </QueryClientProvider>
    );

    // Verify user row loads and Ban & Delete button exists
    expect(await screen.findByText("Spam Bot")).toBeInTheDocument();
    const banDeleteBtn = screen.getByRole("button", { name: /ban & delete/i });
    expect(banDeleteBtn).toBeInTheDocument();

    // Click Ban & Delete to open modal
    fireEvent.click(banDeleteBtn);

    // Verify modal appears
    expect(
      screen.getByRole("heading", { name: /permanently ban & delete user/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all quotes and reposts will immediately disappear from feeds/i)
    ).toBeInTheDocument();

    // Fill optional reason
    const reasonInput = screen.getByPlaceholderText(/explain why this account is being permanently banned/i);
    fireEvent.change(reasonInput, { target: { value: "Repeated spam abuse" } });

    // Submit confirmation
    const confirmBtn = screen.getByRole("button", { name: /^permanently ban & delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        "/api/v1/admin/users/u-spammer/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            status: "DELETED",
            reason: "Repeated spam abuse",
          }),
        })
      );
    });
  });
});
