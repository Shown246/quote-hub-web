import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TakedownQuoteModal } from "@/components/admin/takedown-quote-modal";
import * as apiClientModule from "@/lib/api-client";

describe("TakedownQuoteModal", () => {
  it("submits administrative takedown with reason", async () => {
    const deleteSpy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({});

    render(
      <TakedownQuoteModal
        quoteId="q-bad"
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Terms violation" } });
    fireEvent.click(screen.getByRole("button", { name: /take down quote/i }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("/api/v1/admin/quotes/q-bad", {
        method: "DELETE",
        body: JSON.stringify({ reason: "Terms violation" }),
      });
    });
  });
});
