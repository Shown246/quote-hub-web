import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SuspendUserModal } from "@/components/admin/suspend-user-modal";
import * as apiClientModule from "@/lib/api-client";

describe("SuspendUserModal", () => {
  it("requires non-empty reason before enabling suspension submit", async () => {
    const patchSpy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({});

    render(
      <SuspendUserModal
        user={{ id: "u-1", username: "spammer" }}
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /suspend user/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Repeated spam violations" } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        "/api/v1/admin/users/u-1/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "SUSPENDED", reason: "Repeated spam violations" }),
        })
      );
    });
  });
});
