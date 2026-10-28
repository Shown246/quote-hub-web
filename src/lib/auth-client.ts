import { apiClient } from "@/lib/api-client";
import type { UserProfile } from "@/types/api";

export interface SessionInfo {
  id: string;
  userId: string;
  token?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface SessionResponse {
  session: SessionInfo | null;
  user: UserProfile | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  username?: string;
}

export interface AuthResponse {
  token?: string;
  user?: UserProfile | null;
  session?: SessionInfo | null;
  [key: string]: unknown;
}

export async function getSession(): Promise<SessionResponse | null> {
  return apiClient<SessionResponse | null>("/api/auth/get-session", {
    method: "GET",
  });
}

export async function signInEmail(credentials: SignInCredentials): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function signUpEmail(data: SignUpData): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function signOut(): Promise<void> {
  return apiClient<void>("/api/auth/sign-out", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function requestPasswordReset(
  email: string,
  redirectTo?: string
): Promise<{ message?: string; status?: boolean }> {
  return apiClient<{ message?: string; status?: boolean }>("/api/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email, redirectTo }),
  });
}

export async function resetPassword(data: {
  newPassword: string;
  token: string;
}): Promise<{ message?: string; status?: boolean }> {
  return apiClient<{ message?: string; status?: boolean }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyEmail(
  token: string
): Promise<{ message?: string; status?: boolean }> {
  return apiClient<{ message?: string; status?: boolean }>(
    `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
    }
  );
}

export async function signInSocial(provider: "google" = "google"): Promise<void> {
  if (typeof window === "undefined") return;

  const response = await apiClient<{ url?: string }>("/api/auth/sign-in/social", {
    method: "POST",
    body: JSON.stringify({
      provider,
      callbackURL: window.location.origin,
      disableRedirect: true,
    }),
  });

  if (!response?.url) {
    throw new Error("Google sign-in could not be started. Please try again.");
  }

  window.location.assign(response.url);
}

export async function finalizeUsername(username: string): Promise<UserProfile> {
  return apiClient<UserProfile>("/api/v1/users/me/username", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export const signInWithEmail = signInEmail;
export const signUpWithEmail = signUpEmail;
export const forgetPassword = requestPasswordReset;

export const authClient = {
  getSession,
  signInEmail,
  signUpEmail,
  signOut,
  requestPasswordReset,
  forgetPassword,
  resetPassword,
  verifyEmail,
  signInSocial,
  finalizeUsername,
  signIn: {
    email: signInEmail,
    social: signInSocial,
  },
  signUp: {
    email: signUpEmail,
  },
};
