import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import * as useAuthModule from "@/hooks/use-auth";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits email and password and shows field errors on failure", async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      code: "VALIDATION_ERROR",
      errors: { email: ["Invalid email format"] },
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      login: mockLogin,
      isLoading: false,
    } as any);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "bad-email" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
    });
  });

  it("submits valid credentials and calls login successfully", async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      token: "valid-token",
      user: { id: "u-1", email: "user@example.com" },
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      login: mockLogin,
      isLoading: false,
    } as any);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123!" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123!",
      });
    });
  });

  it("shows general error message when failure has detail but no field errors", async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      code: "AUTHENTICATION_REQUIRED",
      detail: "Invalid email or password",
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      login: mockLogin,
      isLoading: false,
    } as any);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("renders Google OAuth button and handles click", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      login: vi.fn(),
      isLoading: false,
    } as any);

    render(<LoginForm />);

    const googleBtn = screen.getByRole("button", { name: /google/i });
    expect(googleBtn).toBeInTheDocument();
  });

  it("toggles password visibility when show/hide button is clicked", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      login: vi.fn(),
      isLoading: false,
    } as any);

    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleBtn = screen.getByTestId("toggle-password-visibility");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleBtn).toHaveAttribute("aria-label", "Show");

    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(toggleBtn).toHaveAttribute("aria-label", "Hide");

    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleBtn).toHaveAttribute("aria-label", "Show");
  });
});

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits name, email, and password and shows field errors on failure", async () => {
    const mockRegister = vi.fn().mockRejectedValue({
      code: "VALIDATION_ERROR",
      errors: {
        name: ["Name is required"],
        email: ["Email already in use"],
        password: ["Password must be at least 8 characters"],
      },
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      register: mockRegister,
      isLoading: false,
    } as any);

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "dup@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    });
  });

  it("submits valid registration successfully", async () => {
    const mockRegister = vi.fn().mockResolvedValue({
      token: "new-token",
      user: { id: "u-2", name: "Jane Doe", email: "jane@example.com" },
    });

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      register: mockRegister,
      isLoading: false,
    } as any);

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "Password123!" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Password123!",
      });
    });
  });

  it("toggles password visibility when show/hide button is clicked", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      register: vi.fn(),
      isLoading: false,
    } as any);

    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleBtn = screen.getByTestId("toggle-password-visibility");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleBtn).toHaveAttribute("aria-label", "Show");

    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(toggleBtn).toHaveAttribute("aria-label", "Hide");

    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleBtn).toHaveAttribute("aria-label", "Show");
  });
});
