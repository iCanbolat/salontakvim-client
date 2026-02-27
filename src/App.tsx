/**
 * Main App Component with Routing
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, NotificationProvider, useAuth } from "./contexts";
import { queryClient } from "./lib/queryClient";
import { MainLayout } from "./components/layout";
import { ProtectedRoute } from "./components/routes/ProtectedRoute";
import {
  LoginPage,
  RegisterPage,
  WelcomePage,
  AuthCallbackPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/auth";
import { DashboardPage } from "./pages/dashboard";
import { ServicesList } from "./pages/services";
import { AppointmentsList } from "./pages/appointments";
import { CustomersList } from "./pages/customers";
import { CustomerDetails } from "./pages/customers/CustomerDetails";
import FeedbackList from "./pages/feedback-page";
import { LocationsList } from "./pages/locations";
import { Analytics } from "./pages/analytics";
import { StoreSettings } from "./pages/settings/store";
import { WidgetSettings } from "./pages/settings/widget";
import { NotificationSettings } from "./pages/settings/notifications";
import { AppointmentDetailPage } from "./pages/appointments/AppointmentDetail";
import {
  AcceptInvitationPage,
  StaffSchedule,
  StaffProfile,
  StaffManagement as StaffList,
  StaffDetails,
} from "./pages/staff";
import HostedWidgetPage from "./pages/widget/HostedWidgetPage";
import FeedbackPage from "./pages/public/FeedbackPage";
import CancelAppointmentPage from "./pages/public/CancelAppointmentPage";
import { authService } from "./services";
import { CurrentStoreBootstrap } from "./hooks";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <CurrentStoreBootstrap />

            {/* Toast notifications */}
            <Toaster position="top-right" richColors />

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route
                path="/invitations/accept"
                element={<AcceptInvitationPage />}
              />
              <Route path="/book/:slug" element={<HostedWidgetPage />} />
              <Route path="/appointments/feedback" element={<FeedbackPage />} />
              <Route
                path="/appointments/cancel"
                element={<CancelAppointmentPage />}
              />

              {/* Welcome/Onboarding route (protected but no store required) */}
              <Route path="/welcome" element={<WelcomeRoute />} />

              {/* Protected routes with layout */}
              <Route element={<MainLayout />}>
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "manager", "staff"]}
                    />
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/appointments" element={<AppointmentsList />} />
                  <Route
                    path="/appointments/:appointmentId"
                    element={<AppointmentDetailPage />}
                  />
                  <Route path="/customers" element={<CustomersList />} />
                  <Route
                    path="/customers/:customerId"
                    element={<CustomerDetails />}
                  />
                  <Route path="/feedback" element={<FeedbackList />} />
                  <Route
                    path="/notifications"
                    element={<NotificationSettings />}
                  />
                  <Route path="/profile" element={<StaffProfile />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager"]} />
                  }
                >
                  <Route path="/services" element={<ServicesList />} />
                  <Route path="/staff" element={<StaffList />} />
                  <Route path="/staff/:staffId" element={<StaffDetails />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/locations" element={<LocationsList />} />
                  <Route path="/widget" element={<WidgetSettings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<StoreSettings />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
                  <Route path="/schedule" element={<StaffSchedule />} />
                  <Route
                    path="/time-off"
                    element={<Navigate to="/schedule" replace />}
                  />
                </Route>
              </Route>

              {/* Root redirect based on auth */}
              <Route path="/" element={<RootRedirect />} />

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold mb-4">404</h1>
                      <p className="text-gray-600">Page not found</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Welcome route - requires auth but shows onboarding page
function WelcomeRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user already has a store (doesn't need onboarding), redirect to dashboard
  if (!authService.needsOnboarding()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <WelcomePage />;
}

// Root redirect component to handle dashboard routing
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs onboarding
  if (authService.needsOnboarding() && user.role === "admin") {
    return <Navigate to="/welcome" replace />;
  }

  // Redirect to appropriate dashboard based on role
  return <Navigate to="/dashboard" replace />;
}

export default App;
