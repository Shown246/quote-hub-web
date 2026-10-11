"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  authClient,
  type SessionInfo,
  type SignInCredentials,
  type SignUpData,
  type AuthResponse,
} from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import type { UserProfile } from "@/types/api";

export interface AuthContextValue {
  user: UserProfile | null;
  session: SessionInfo | any;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: SignInCredentials) => Promise<AuthResponse>;
  register: (data: SignUpData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SessionInfo | any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await authClient.getSession();
      if (res && res.user) {
        if ((res.user as any).role) {
          setUser(res.user);
        } else {
          try {
            const profile = await apiClient<UserProfile>("/api/v1/users/me");
            setUser({ ...res.user, ...profile });
          } catch {
            setUser(res.user as UserProfile);
          }
        }
        setSession(res.session ?? null);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (credentials: SignInCredentials): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authClient.signInEmail(credentials);
        try {
          const sessionData = await authClient.getSession();
          const targetUser = sessionData?.user || res?.user;
          if (targetUser && (targetUser as any).role) {
            setUser(targetUser as UserProfile);
          } else if (targetUser) {
            try {
              const profile = await apiClient<UserProfile>("/api/v1/users/me");
              setUser({ ...targetUser, ...profile });
            } catch {
              setUser(targetUser as UserProfile);
            }
          }
          setSession(sessionData?.session ?? res?.session ?? null);
        } catch {
          if (res && res.user) {
            setUser(res.user as UserProfile);
            setSession(res.session ?? null);
          }
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (data: SignUpData): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authClient.signUpEmail(data);
        try {
          const sessionData = await authClient.getSession();
          const targetUser = sessionData?.user || res?.user;
          if (targetUser && (targetUser as any).role) {
            setUser(targetUser as UserProfile);
          } else if (targetUser) {
            try {
              const profile = await apiClient<UserProfile>("/api/v1/users/me");
              setUser({ ...targetUser, ...profile });
            } catch {
              setUser(targetUser as UserProfile);
            }
          }
          setSession(sessionData?.session ?? res?.session ?? null);
        } catch {
          if (res && res.user) {
            setUser(res.user as UserProfile);
            setSession(res.session ?? null);
          }
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authClient.signOut();
    } catch {
      // Clear local session state even if API call fails
    } finally {
      setUser(null);
      setSession(null);
      setIsLoading(false);
    }
  }, []);

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user && user.role === "ADMIN");

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
