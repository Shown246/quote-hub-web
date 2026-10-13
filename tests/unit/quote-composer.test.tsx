// quote-hub-web/tests/unit/quote-composer.test.tsx
import { describe, it, expect } from "vitest";
import { countUnicodeCharacters } from "@/lib/unicode";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QuoteComposerDialog } from "@/components/quotes/quote-composer-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

describe("Quote Composer Validation and Invariants", () => {
  it("counts Unicode code points accurately for multi-byte emojis", () => {
    const text = "Inspiring quote 🚀";
    expect(countUnicodeCharacters(text)).toBe(17);

    const emojis = "✨".repeat(280);
    expect(countUnicodeCharacters(emojis)).toBe(280);

    const overflow = "✨".repeat(281);
    expect(countUnicodeCharacters(overflow)).toBe(281);
  });

  it("hides author name field when 'Original quote' is checked and shows it when unchecked (PRD §13)", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QuoteComposerDialog isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    const originalCheckbox = screen.getByRole("checkbox", { name: /original quote/i });
    expect(originalCheckbox).toBeChecked();

    // Field disappears when original is enabled per PRD §13
    expect(screen.queryByLabelText(/author name/i)).not.toBeInTheDocument();

    // When unchecked, author input appears
    fireEvent.click(originalCheckbox);
    expect(screen.getByLabelText(/author name/i)).toBeInTheDocument();
  });

  it("displays live character counter in 'X / 280' format and toggles submit button (PRD §12.2)", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QuoteComposerDialog isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    const textarea = screen.getByLabelText(/quote text/i);
    const submitBtn = screen.getByRole("button", { name: /post quote/i });
    const counter = screen.getByTestId("char-counter");

    // Initially empty -> disabled, 0 / 280
    expect(submitBtn).toBeDisabled();
    expect(counter.textContent).toBe("0 / 280");

    // 280 emojis -> valid, 280 / 280, submit enabled
    fireEvent.change(textarea, { target: { value: "🚀".repeat(280) } });
    expect(counter.textContent).toBe("280 / 280");
    expect(submitBtn).not.toBeDisabled();

    // 281 emojis -> invalid, 281 / 280, submit disabled
    fireEvent.change(textarea, { target: { value: "🚀".repeat(281) } });
    expect(counter.textContent).toBe("281 / 280");
    expect(submitBtn).toBeDisabled();
  });

  it("renders live styled preview reflecting typed text (PRD §12.1, §61)", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QuoteComposerDialog isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    const preview = screen.getByTestId("composer-live-preview");
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByText(/your quote will appear here/i)).toBeInTheDocument();

    const textarea = screen.getByLabelText(/quote text/i);
    fireEvent.change(textarea, { target: { value: "Knowledge speaks, but wisdom listens." } });

    expect(within(preview).getByText("Knowledge speaks, but wisdom listens.")).toBeInTheDocument();
    expect(within(preview).getByText(/original \(you\)/i)).toBeInTheDocument();
  });
});
