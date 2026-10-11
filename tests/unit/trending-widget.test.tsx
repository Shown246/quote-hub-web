import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrendingWidget } from "@/components/feed/trending-widget";
import * as apiClientModule from "@/lib/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

describe("TrendingWidget", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders top trending quotes list", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      data: [
        {
          id: "q-1",
          text: "Trending wisdom",
          likeCount: 50,
          repostCount: 12,
          isOriginal: false,
          authorName: "Marcus Aurelius",
        },
      ],
    });

    render(<TrendingWidget />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Trending wisdom")).toBeInTheDocument();
      expect(screen.getByText(/Marcus Aurelius/i)).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });
  });

  it("renders fallback message when trending data is empty", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      data: [],
    });

    render(<TrendingWidget />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no trending quotes yet/i)).toBeInTheDocument();
    });
  });

  it("renders fallback message when trending request errors without crashing", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(new Error("Network failure"));

    render(<TrendingWidget />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/unable to load trending quotes/i)).toBeInTheDocument();
    });
  });
});
