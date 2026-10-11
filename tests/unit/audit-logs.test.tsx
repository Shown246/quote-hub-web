import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AuditLogRow } from "@/components/admin/audit-log-row";

describe("AuditLogRow", () => {
  it("renders audit action and actor accurately", () => {
    const log = {
      id: "log-1",
      action: "ADMIN_SUSPENDED_USER",
      resourceType: "USER",
      resourceId: "u-5",
      metadata: { reason: "Spam" },
      createdAt: "2026-03-01T16:00:00.000Z",
      actorUser: { id: "u-admin", username: "admin", displayName: "Admin User" },
    };

    render(<AuditLogRow log={log} />);
    expect(screen.getByText("ADMIN_SUSPENDED_USER")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText(/Spam/i)).toBeInTheDocument();
  });
});
