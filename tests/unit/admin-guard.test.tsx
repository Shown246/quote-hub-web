import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AdminGuard } from "@/components/admin/admin-guard";
import * as useAuthModule from "@/hooks/use-auth";

describe("AdminGuard", () => {
  it("renders access denied message for non-admin users", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "u-1", role: "USER" } as any,
      isAdmin: false,
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <AdminGuard>
        <div>Admin Restricted Content</div>
      </AdminGuard>
    );

    expect(screen.queryByText("Admin Restricted Content")).not.toBeInTheDocument();
    expect(screen.getByText(/admin access required/i)).toBeInTheDocument();
  });

  it("renders protected admin content when user has ADMIN role and ACTIVE status", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "u-admin", role: "ADMIN", status: "ACTIVE" } as any,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <AdminGuard>
        <div>Admin Restricted Content</div>
      </AdminGuard>
    );

    expect(screen.getByText("Admin Restricted Content")).toBeInTheDocument();
  });

  it("denies access when user has ADMIN role but status is SUSPENDED", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "u-admin-suspended", role: "ADMIN", status: "SUSPENDED" } as any,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
    } as any);

    render(
      <AdminGuard>
        <div>Admin Restricted Content</div>
      </AdminGuard>
    );

    expect(screen.queryByText("Admin Restricted Content")).not.toBeInTheDocument();
    expect(screen.getByText(/admin access required/i)).toBeInTheDocument();
  });
});

