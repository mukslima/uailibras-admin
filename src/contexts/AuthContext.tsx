"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import type { Role, User } from "@/lib/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.refreshSession();
      setUser(result.user);
    } catch (err) {
      setUser(null);
      api.setAccessToken(null);
      if (pathname?.startsWith("/painel")) {
        router.replace("/login");
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      setError(null);
      const signedUser = await api.login(identifier, password);
      setUser(signedUser);
      router.replace("/painel");
    },
    [router],
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      error,
      signIn,
      signOut,
      refresh,
      hasRole: (roles) => Boolean(user && roles.includes(user.role)),
    }),
    [user, loading, error, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
