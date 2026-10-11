import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ErrorBoundary from "@/app/error";
import { ApiError } from "@/lib/api-client";

describe("ErrorBoundary", () => {
  it("displays correlation ID when error is an ApiError", () => {
    const apiError = new ApiError(
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      "Field invalid",
      "req-correlation-99"
    );

    render(<ErrorBoundary error={apiError} reset={() => {}} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/req-correlation-99/i)).toBeInTheDocument();
  });

  it("handles generic errors and invokes reset callback when Try Again is clicked", () => {
    const genericError = new Error("Generic failure");
    const resetFn = vi.fn();

    render(<ErrorBoundary error={genericError} reset={resetFn} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    const tryAgainBtn = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainBtn).toBeInTheDocument();
    fireEvent.click(tryAgainBtn);
    expect(resetFn).toHaveBeenCalledTimes(1);
  });
});
