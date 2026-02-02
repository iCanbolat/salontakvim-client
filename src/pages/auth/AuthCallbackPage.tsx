/**
 * Auth Callback Page
 * Handles OAuth callback from Google and other providers
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authService } from "@/services";
import { useAuth } from "@/contexts";
import { apiClient } from "@/services/api-client";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const needsOnboarding = searchParams.get("needsOnboarding") === "true";
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(errorParam);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      if (!accessToken || !refreshToken) {
        setError("Missing authentication tokens");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      // Save tokens to localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      if (needsOnboarding) {
        localStorage.setItem("needsOnboarding", "true");
      }

      // Set tokens in API client
      apiClient.setAccessToken(accessToken);
      apiClient.setRefreshToken(refreshToken);

      // Fetch user data
      try {
        const user = await authService.me();
        localStorage.setItem("user", JSON.stringify(user));
        await refetchUser();

        // Redirect based on onboarding status
        if (needsOnboarding) {
          navigate("/welcome");
        } else if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else if (user.role === "staff") {
          navigate("/staff/dashboard");
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to complete authentication");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refetchUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
