import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import QuoteDetailPage from "@/app/(app)/quotes/[id]/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as apiClientModule from "@/lib/api-client";
import * as authHook from "@/hooks/use-auth";

describe("QuoteDetailPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    });
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: { id: "u-1", username: "bob" } as any,
      isAuthenticated: true,
    } as any);
  });

  it("renders quote details and interactive card when quote exists", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      id: "q-42",
      userId: "u-2",
      text: "A unique quote text for detail page",
      isOriginal: true,
      authorName: null,
      likeCount: 12,
      repostCount: 3,
      createdAt: new Date().toISOString(),
      user: {
        id: "u-2",
        username: "carol",
        displayName: "Carol",
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <QuoteDetailPage params={Promise.resolve({ id: "q-42" })} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("A unique quote text for detail page")).toBeInTheDocument();
    });
    expect(screen.getByText("@carol")).toBeInTheDocument();
  });

  it("renders Quote Not Found when API returns 404", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(
      new apiClientModule.ApiError("Quote not found", 404, "NOT_FOUND")
    );

    render(
      <QueryClientProvider client={queryClient}>
        <QuoteDetailPage params={Promise.resolve({ id: "non-existent" })} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/quote not found/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /back to feed/i })).toBeInTheDocument();
  });

  it("renders server error state with retry button when API returns 500 error", async () => {
    const apiSpy = vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(
      new apiClientModule.ApiError("Internal Server Error", 500, "INTERNAL_ERROR")
    );

    render(
      <QueryClientProvider client={queryClient}>
        <QuoteDetailPage params={Promise.resolve({ id: "server-err-quote" })} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load quote")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Unable to load this quote due to a network or server error.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/quote not found/i)).not.toBeInTheDocument();

    const tryAgainBtn = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainBtn).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to feed/i })).toBeInTheDocument();

    const callCountBefore = apiSpy.mock.calls.length;
    fireEvent.click(tryAgainBtn);

    await waitFor(() => {
      expect(apiSpy.mock.calls.length).toBeGreaterThan(callCountBefore);
    });
  });
});
