import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AppShell } from "@/components/layout/app-shell";
import * as useAuthModule from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

describe("Sidebar Navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders core navigation items: For You, Following, Search, Saved, Profile", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { username: "alice" } as any,
    } as any);

    render(<SidebarNav />);
    expect(screen.getByRole("link", { name: /for you/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /following/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /saved/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /admin/i })).not.toBeInTheDocument();
  });

  it("includes Admin link when authenticated user has ADMIN role", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      user: { username: "admin", role: "ADMIN" } as any,
    } as any);

    render(<SidebarNav />);
    expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
  });
});

describe("Mobile Navigation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders mobile navigation items and compose button when authenticated", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { username: "alice" } as any,
    } as any);

    render(<MobileNav />);
    expect(screen.getByRole("link", { name: /for you/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /saved/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compose/i })).toBeInTheDocument();
  });
});

describe("AppShell", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders main content children along with sidebar and mobile nav", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      user: { username: "alice" } as any,
    } as any);

    render(
      <AppShell showTrending={false}>
        <div data-testid="feed-content">Feed Stream</div>
      </AppShell>,
      { wrapper }
    );

    expect(screen.getByTestId("feed-content")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: /desktop sidebar/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /mobile navigation/i })).toBeInTheDocument();
  });
});
