/**
 * Authentication API Service
 */

import { axiosInstance, apiClient } from "./api-client";
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  User,
  MeResponse,
} from "@/types";

export class AuthService {
  /**
   * Register new admin user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      data
    );
    this.saveAuthData(response.data);
    return response.data;
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      data
    );
    this.saveAuthData(response.data);
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await axiosInstance.post("/auth/logout", { refreshToken });
      }
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Get current user
   */
  async me(): Promise<User> {
    const response = await axiosInstance.get<MeResponse>("/auth/me");
    return response.data.user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });
    this.saveAuthData(response.data);
    return response.data;
  }

  /**
   * Save auth data to localStorage
   */
  private saveAuthData(authData: AuthResponse) {
    localStorage.setItem("accessToken", authData.accessToken);
    localStorage.setItem("refreshToken", authData.refreshToken);

    // Convert AuthResponse.user (minimal) to full User object for storage
    const user: User = {
      id: authData.user.id,
      email: authData.user.email,
      firstName: authData.user.firstName,
      lastName: authData.user.lastName,
      role: authData.user.role,
      paymentStatus: authData.user.paymentStatus,
      avatar: authData.user.avatar,
      authProvider: "local", // Will be updated on /me call
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("user", JSON.stringify(user));
    apiClient.setAccessToken(authData.accessToken);
    apiClient.setRefreshToken(authData.refreshToken);
  }

  /**
   * Clear auth data from localStorage
   */
  private clearAuthData() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    apiClient.logout();
  }

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
  }
}

export const authService = new AuthService();
