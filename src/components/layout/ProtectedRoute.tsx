"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/types";

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && roles && !roles.includes(user.role)) router.replace("/painel");
  }, [loading, roles, router, user]);

  if (loading) {
    return <div className="center-state">Carregando sessao...</div>;
  }

  if (!user || (roles && !roles.includes(user.role))) {
    return <div className="center-state">Redirecionando...</div>;
  }

  return children;
}
