// quote-hub-web/tests/unit/quote-composer.test.tsx
import { describe, it, expect } from "vitest";
import { countUnicodeCharacters } from "@/lib/unicode";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("disables author name field when 'Original quote' is checked", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QuoteComposerDialog isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    const originalCheckbox = screen.getByRole("checkbox", { name: /original quote/i });
    expect(originalCheckbox).toBeChecked();

    const authorInput = screen.queryByLabelText(/author name/i);
    expect(authorInput).toBeDisabled();

    fireEvent.click(originalCheckbox);
    expect(screen.getByLabelText(/author name/i)).not.toBeDisabled();
  });

  it("enables submit for 280 emojis and disables submit with overflow counter for 281 emojis", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <QuoteComposerDialog isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    const textarea = screen.getByLabelText(/quote text/i);
    const submitBtn = screen.getByRole("button", { name: /post quote/i });
    const counter = screen.getByTestId("char-counter");

    // Initially empty -> disabled
    expect(submitBtn).toBeDisabled();
    expect(counter.textContent).toBe("280");

    // 280 emojis -> valid, 0 remaining, submit enabled
    fireEvent.change(textarea, { target: { value: "🚀".repeat(280) } });
    expect(counter.textContent).toBe("0");
    expect(submitBtn).not.toBeDisabled();

    // 281 emojis -> invalid, -1 remaining, submit disabled
    fireEvent.change(textarea, { target: { value: "🚀".repeat(281) } });
    expect(counter.textContent).toBe("-1");
    expect(submitBtn).toBeDisabled();
  });
});
