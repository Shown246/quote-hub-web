import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/components/auth/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import * as apiClientModule from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import React from "react";

function TestConsumer() {
  const { isAuthenticated, isAdmin, user, isLoading, login, register, logout } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div>Status: {isAuthenticated ? "Authenticated" : "Guest"}</div>
      <div>Role: {isAdmin ? "Admin" : "Standard"}</div>
      {user && <div>Username: {user.username}</div>}
      <button onClick={() => login({ email: "test@example.com", password: "password123" })}>
        Trigger Login
      </button>
      <button
        onClick={() =>
          register({ email: "new@example.com", password: "password123", name: "New User" })
        }
      >
        Trigger Register
      </button>
      <button onClick={() => logout()}>Trigger Logout</button>
    </div>
  );
}

describe("AuthProvider and useAuth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes as guest when session is null", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Status: Guest")).toBeInTheDocument();
      expect(screen.getByText("Role: Standard")).toBeInTheDocument();
    });
  });

  it("identifies active user and admin privileges correctly", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({
      session: { id: "s-1", userId: "u-1" },
      user: {
        id: "u-1",
        username: "admin_user",
        displayName: "Admin",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Status: Authenticated")).toBeInTheDocument();
      expect(screen.getByText("Role: Admin")).toBeInTheDocument();
      expect(screen.getByText("Username: admin_user")).toBeInTheDocument();
    });
  });

  it("handles session retrieval errors gracefully by falling back to guest mode", async () => {
    vi.spyOn(apiClientModule, "apiClient").mockRejectedValue(
      new Error("401 Unauthorized")
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Status: Guest")).toBeInTheDocument();
      expect(screen.getByText("Role: Standard")).toBeInTheDocument();
    });
  });

  it("handles login flow and updates state", async () => {
    const apiClientSpy = vi.spyOn(apiClientModule, "apiClient");
    // Initial mount session is null
    apiClientSpy.mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Status: Guest")).toBeInTheDocument();
    });

    // Mock login endpoint response, then get-session response
    apiClientSpy
      .mockResolvedValueOnce({
        token: "session-token-123",
        user: { id: "u-2", username: "logged_in_user", displayName: "Logged In", role: "USER" },
      })
      .mockResolvedValueOnce({
        session: { id: "s-2", userId: "u-2" },
        user: { id: "u-2", username: "logged_in_user", displayName: "Logged In", role: "USER" },
      });

    const loginButton = screen.getByRole("button", { name: "Trigger Login" });
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText("Status: Authenticated")).toBeInTheDocument();
      expect(screen.getByText("Role: Standard")).toBeInTheDocument();
      expect(screen.getByText("Username: logged_in_user")).toBeInTheDocument();
    });
  });

  it("handles register flow and updates state", async () => {
    const apiClientSpy = vi.spyOn(apiClientModule, "apiClient");
    apiClientSpy.mockResolvedValueOnce(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Status: Guest")).toBeInTheDocument();
    });

    // Mock register endpoint response, then get-session response
    apiClientSpy
      .mockResolvedValueOnce({
        token: "session-token-345",
        user: { id: "u-3", username: "new_registered_user", displayName: "New User", role: "USER" },
      })
      .mockResolvedValueOnce({
        session: { id: "s-3", userId: "u-3" },
        user: { id: "u-3", username: "new_registered_user", displayName: "New User", role: "USER" },
      });

    const registerButton = screen.getByRole("button", { name: "Trigger Register" });
    await act(async () => {
      registerButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText("Status: Authenticated")).toBeInTheDocument();
      expect(screen.getByText("Username: new_registered_user")).toBeInTheDocument();
    });
  });

  it("handles logout and resets state to guest", async () => {
    const apiClientSpy = vi.spyOn(apiClientModule, "apiClient");
    // Initial mount session is active
    apiClientSpy.mockResolvedValueOnce({
      session: { id: "s-1", userId: "u-1" },
      user: {
        id: "u-1",
        username: "admin_user",
        displayName: "Admin",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Status: Authenticated")).toBeInTheDocument();
    });

    // Mock logout response
    apiClientSpy.mockResolvedValueOnce(undefined);

    const logoutButton = screen.getByRole("button", { name: "Trigger Logout" });
    await act(async () => {
      logoutButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText("Status: Guest")).toBeInTheDocument();
      expect(screen.getByText("Role: Standard")).toBeInTheDocument();
    });
  });

  it("throws error if useAuth is used outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow("useAuth must be used within an AuthProvider");
    spy.mockRestore();
  });
});

describe("authClient wrapper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls getSession with correct path", async () => {
    const spy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue(null);
    await authClient.getSession();
    expect(spy).toHaveBeenCalledWith("/api/auth/get-session", { method: "GET" });
  });

  it("calls signInEmail with correct path and body", async () => {
    const spy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({});
    await authClient.signInEmail({ email: "test@example.com", password: "secret" });
    expect(spy).toHaveBeenCalledWith("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "secret" }),
    });
  });

  it("calls signUpEmail with correct path and body", async () => {
    const spy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue({});
    await authClient.signUpEmail({ email: "test@example.com", password: "secret", name: "Test" });
    expect(spy).toHaveBeenCalledWith("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "secret", name: "Test" }),
    });
  });

  it("calls signOut with correct path and body", async () => {
    const spy = vi.spyOn(apiClientModule, "apiClient").mockResolvedValue(undefined);
    await authClient.signOut();
    expect(spy).toHaveBeenCalledWith("/api/auth/sign-out", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });
});
