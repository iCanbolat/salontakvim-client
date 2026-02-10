/**
 * Authentication hooks
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts";
import type { UserRole } from "@/types";

/**
 * Redirect to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
}

/**
 * Redirect if user doesn't have required role
 */
export function useRequireRole(requiredRole: UserRole | UserRole[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isLoading && user) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(user.role)) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, isAuthenticated, isLoading, requiredRole, navigate]);

  return { user, isAuthenticated, isLoading };
}

/**
 * Check if user has specific role
 */
export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}
