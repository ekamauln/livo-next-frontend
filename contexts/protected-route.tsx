"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, isLoading, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      // toast.error("Please login to access this page");
      router.push("/auth/login");
      return;
    }

    if (requiredRoles.length > 0 && user && !hasAnyRole(requiredRoles)) {
      toast.error("You do not have permission to access this page");
      router.push("/dashboard");
      return;
    }
  }, [user, isLoading, requiredRoles, requireAuth, router, hasAnyRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (requiredRoles.length > 0 && user && !hasAnyRole(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}
