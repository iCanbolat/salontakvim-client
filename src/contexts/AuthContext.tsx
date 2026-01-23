/**
 * Authentication Context
 * Manages user authentication state and actions
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "@/services";
import type { User, LoginDto, RegisterDto } from "@/types";
import { queryClient } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authService.getStoredUser();

      if (storedUser && authService.isAuthenticated()) {
        try {
          // Verify token by fetching current user
          const currentUser = await authService.me();
          setUser(currentUser);
        } catch (error) {
          // Token invalid or expired
          console.error("Failed to verify token:", error);
          await authService.logout();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginDto) => {
    setIsLoading(true);
    try {
      await authService.login(data);
      // Clear cached queries from previous session to avoid cross-user bleed
      queryClient.clear();
      // Fetch full user data after login
      const fullUser = await authService.me();
      setUser(fullUser);
    } catch (error) {
      throw error; // Re-throw to let the component handle it
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDto) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      queryClient.clear();
      // Fetch full user data after registration
      const fullUser = await authService.me();
      setUser(fullUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      queryClient.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchUser = async () => {
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refetch user:", error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
