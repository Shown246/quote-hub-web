import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuoteDeleteDialog } from "@/components/quotes/quote-delete-dialog";
import { QuoteEditDialog } from "@/components/quotes/quote-edit-dialog";
import { SuspendUserModal } from "@/components/admin/suspend-user-modal";
import { DeleteUserModal } from "@/components/admin/delete-user-modal";
import { TakedownQuoteModal } from "@/components/admin/takedown-quote-modal";
import { DeleteAccountModal } from "@/components/profile/delete-account-modal";
import { Quote } from "@/types/api";

const mockQuote: Quote = {
  id: "q-1",
  userId: "u-1",
  text: "Sample quote for testing portaling",
  isOriginal: true,
  authorName: null,
  likeCount: 0,
  repostCount: 0,
  createdAt: "2026-03-01T10:00:00.000Z",
};

describe("Modal Portaling", () => {
  it("renders QuoteDeleteDialog directly under document.body", () => {
    const queryClient = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <div id="nested-parent">
          <QuoteDeleteDialog quoteId="q-1" isOpen={true} onClose={vi.fn()} />
        </div>
      </QueryClientProvider>
    );

    const dialog = screen.getByRole("dialog");
    expect(container.querySelector("#nested-parent")?.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("renders QuoteEditDialog directly under document.body", () => {
    const queryClient = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <div id="nested-parent">
          <QuoteEditDialog quote={mockQuote} isOpen={true} onClose={vi.fn()} />
        </div>
      </QueryClientProvider>
    );

    const dialog = screen.getByRole("dialog");
    expect(container.querySelector("#nested-parent")?.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("renders SuspendUserModal directly under document.body", () => {
    const { container } = render(
      <div id="nested-parent">
        <SuspendUserModal
          user={{ id: "u-1", username: "alice" }}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </div>
    );

    const dialog = screen.getByRole("dialog");
    expect(container.querySelector("#nested-parent")?.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("renders DeleteUserModal directly under document.body", () => {
    const { container } = render(
      <div id="nested-parent">
        <DeleteUserModal
          user={{ id: "u-1", username: "bob" }}
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </div>
    );

    const dialog = screen.getByRole("dialog");
    expect(container.querySelector("#nested-parent")?.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("renders TakedownQuoteModal directly under document.body", () => {
    const { container } = render(
      <div id="nested-parent">
        <TakedownQuoteModal
          quoteId="q-1"
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />
      </div>
    );

    const dialog = screen.getByRole("dialog");
    expect(container.querySelector("#nested-parent")?.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("renders DeleteAccountModal directly under document.body", () => {
    const { container } = render(
      <div id="nested-parent">
        <DeleteAccountModal
          isOpen={true}
          onClose={vi.fn()}
          onDeleted={vi.fn()}
        />
      </div>
    );

    const dialog = screen.getByRole("dialog");
    expect(container.querySelector("#nested-parent")?.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });
});
