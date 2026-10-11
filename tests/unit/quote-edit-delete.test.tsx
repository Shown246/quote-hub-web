// quote-hub-web/tests/unit/quote-edit-delete.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuoteDeleteDialog } from "@/components/quotes/quote-delete-dialog";
import { QuoteEditDialog } from "@/components/quotes/quote-edit-dialog";
import * as apiClientModule from "@/lib/api-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Quote } from "@/types/api";
import React from "react";

describe("QuoteDeleteDialog", () => {
  it("confirms deletion and calls DELETE endpoint", async () => {
    const queryClient = new QueryClient();
    const deleteSpy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={queryClient}>
        <QuoteDeleteDialog quoteId="q-1" isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("/api/v1/quotes/q-1", { method: "DELETE" });
    });
    deleteSpy.mockRestore();
  });
});

describe("QuoteEditDialog", () => {
  const mockQuote: Quote = {
    id: "q-1",
    userId: "u-1",
    text: "Original wise quote.",
    isOriginal: false,
    authorName: "Marcus Aurelius",
    themeId: "018f3a2c-0000-7000-8000-000000000001",
    likeCount: 5,
    repostCount: 1,
    createdAt: "2026-03-01T10:00:00.000Z",
  };

  it("renders quote text and displays immutable attribution fields as read-only", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QuoteEditDialog quote={mockQuote} isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/quote text/i)).toHaveValue("Original wise quote.");
    expect(screen.getByText("Marcus Aurelius")).toBeInTheDocument();
  });

  it("submits updated quote text via PATCH endpoint", async () => {
    const queryClient = new QueryClient();
    const patchSpy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      ...mockQuote,
      text: "Updated wise quote.",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <QuoteEditDialog quote={mockQuote} isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    const textarea = screen.getByLabelText(/quote text/i);
    fireEvent.change(textarea, { target: { value: "Updated wise quote." } });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        "/api/v1/quotes/q-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            text: "Updated wise quote.",
            themeId: "018f3a2c-0000-7000-8000-000000000001",
          }),
        })
      );
    });
    patchSpy.mockRestore();
  });

  it("resets dirty form state when dialog re-opens", () => {
    const queryClient = new QueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <QuoteEditDialog quote={mockQuote} isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    const textarea = screen.getByLabelText(/quote text/i);
    fireEvent.change(textarea, { target: { value: "Dirty uncommitted edits" } });
    expect(textarea).toHaveValue("Dirty uncommitted edits");

    // Close dialog
    rerender(
      <QueryClientProvider client={queryClient}>
        <QuoteEditDialog quote={mockQuote} isOpen={false} onClose={() => {}} />
      </QueryClientProvider>
    );

    // Reopen dialog
    rerender(
      <QueryClientProvider client={queryClient}>
        <QuoteEditDialog quote={mockQuote} isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/quote text/i)).toHaveValue("Original wise quote.");
  });
});
