/**
 * Axios configuration and API client
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("accessToken");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Avoid multiple simultaneous refresh requests
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }

            const newAccessToken = await this.refreshPromise;
            this.refreshPromise = null;

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout user
            this.clearTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    return accessToken;
  }

  private clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  public setAccessToken(token: string) {
    localStorage.setItem("accessToken", token);
  }

  public setRefreshToken(token: string) {
    localStorage.setItem("refreshToken", token);
  }

  public logout() {
    this.clearTokens();
  }
}

export const apiClient = new ApiClient();
export const axiosInstance = apiClient.getClient();
