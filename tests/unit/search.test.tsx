import { renderHook, waitFor, render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSearch } from "@/hooks/use-search";
import { SearchInput } from "@/components/search/search-input";
import SearchPage from "@/app/(app)/search/page";
import * as apiClientModule from "@/lib/api-client";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("useSearch Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("does not trigger query when search query is whitespace", () => {
    const fetchSpy = vi.spyOn(apiClientModule, "apiClient");
    const { result } = renderHook(() => useSearch("   "), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("queries /api/v1/search and returns ranked results for valid input", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValueOnce({
      data: [{ id: "q-1", text: "The unexamined life is not worth living.", rankScore: 0.88 }],
    });

    const { result } = renderHook(() => useSearch("unexamined"), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.[0].rankScore).toBe(0.88);
  });
});

describe("SearchInput component", () => {
  it("renders input field and calls onChange handler", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="stoic" onChange={handleChange} placeholder="Search quotes..." />);

    const input = screen.getByPlaceholderText("Search quotes...");
    expect(input).toHaveValue("stoic");

    fireEvent.change(input, { target: { value: "marcus" } });
    expect(handleChange).toHaveBeenCalledWith("marcus");
  });

  it("clears search input when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="stoic" onChange={handleChange} />);

    const clearBtn = screen.getByRole("button", { name: /clear search/i });
    fireEvent.click(clearBtn);
    expect(handleChange).toHaveBeenCalledWith("");
  });
});

describe("SearchPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders search input and results with relevance badges", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      data: [
        {
          id: "q-1",
          text: "The unexamined life is not worth living.",
          isOriginal: false,
          authorName: "Socrates",
          likeCount: 42,
          repostCount: 10,
          createdAt: "2026-03-01T10:00:00.000Z",
          rankScore: 0.88,
          username: "philosopher",
          displayName: "Philosopher",
          themeKey: "classic-serif",
          author: {
            id: "u-1",
            username: "philosopher",
            displayName: "Philosopher",
            avatarUrl: null,
            profileImageUrl: null,
          },
        },
      ],
    });

    render(<SearchPage />, { wrapper });

    const input = screen.getByPlaceholderText(/search quotes, authors, or topics/i);
    fireEvent.change(input, { target: { value: "unexamined" } });

    await waitFor(() => {
      const resultsContainer = screen.getByTestId("search-results");
      expect(within(resultsContainer).getByText("The unexamined life is not worth living.")).toBeInTheDocument();
      expect(screen.getByText(/88% match/i)).toBeInTheDocument();
    });
  });
});
