/**
 * Main App Component with Routing
 */

import { lazy, Suspense, type ReactNode } from "react";
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
import { authService } from "./services";
import { CurrentStoreBootstrap } from "./hooks";

const DashboardPage = lazy(() =>
  import("./pages/dashboard").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ServicesList = lazy(() =>
  import("./pages/services").then((module) => ({
    default: module.ServicesList,
  })),
);
const AppointmentsList = lazy(() =>
  import("./pages/appointments").then((module) => ({
    default: module.AppointmentsList,
  })),
);
const AppointmentDetailPage = lazy(() =>
  import("./pages/appointments/AppointmentDetail").then((module) => ({
    default: module.AppointmentDetailPage,
  })),
);
const CustomersList = lazy(() =>
  import("./pages/customers").then((module) => ({
    default: module.CustomersList,
  })),
);
const CustomerDetails = lazy(() =>
  import("./pages/customers/CustomerDetails").then((module) => ({
    default: module.CustomerDetails,
  })),
);
const FeedbackList = lazy(() => import("./pages/feedback-page"));
const LocationsList = lazy(() =>
  import("./pages/locations").then((module) => ({
    default: module.LocationsList,
  })),
);
const Analytics = lazy(() =>
  import("./pages/analytics").then((module) => ({
    default: module.Analytics,
  })),
);
const StoreSettings = lazy(() =>
  import("./pages/settings/store").then((module) => ({
    default: module.StoreSettings,
  })),
);
const WidgetSettings = lazy(() =>
  import("./pages/settings/widget").then((module) => ({
    default: module.WidgetSettings,
  })),
);
const NotificationSettings = lazy(() =>
  import("./pages/settings/notifications").then((module) => ({
    default: module.NotificationSettings,
  })),
);
const AcceptInvitationPage = lazy(() =>
  import("./pages/staff").then((module) => ({
    default: module.AcceptInvitationPage,
  })),
);
const StaffSchedule = lazy(() =>
  import("./pages/staff").then((module) => ({
    default: module.StaffSchedule,
  })),
);
const StaffProfile = lazy(() =>
  import("./pages/staff").then((module) => ({
    default: module.StaffProfile,
  })),
);
const StaffList = lazy(() =>
  import("./pages/staff").then((module) => ({
    default: module.StaffManagement,
  })),
);
const StaffDetails = lazy(() =>
  import("./pages/staff").then((module) => ({
    default: module.StaffDetails,
  })),
);
const HostedWidgetPage = lazy(() => import("./pages/widget/HostedWidgetPage"));
const FeedbackPage = lazy(() => import("./pages/public/FeedbackPage"));
const CancelAppointmentPage = lazy(
  () => import("./pages/public/CancelAppointmentPage"),
);

function RouteSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

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
                element={
                  <RouteSuspense>
                    <AcceptInvitationPage />
                  </RouteSuspense>
                }
              />
              <Route
                path="/book/:slug"
                element={
                  <RouteSuspense>
                    <HostedWidgetPage />
                  </RouteSuspense>
                }
              />
              <Route
                path="/appointments/feedback"
                element={
                  <RouteSuspense>
                    <FeedbackPage />
                  </RouteSuspense>
                }
              />
              <Route
                path="/appointments/cancel"
                element={
                  <RouteSuspense>
                    <CancelAppointmentPage />
                  </RouteSuspense>
                }
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
                  <Route
                    path="/dashboard"
                    element={
                      <RouteSuspense>
                        <DashboardPage />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/appointments"
                    element={
                      <RouteSuspense>
                        <AppointmentsList />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/appointments/:appointmentId"
                    element={
                      <RouteSuspense>
                        <AppointmentDetailPage />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <RouteSuspense>
                        <CustomersList />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/customers/:customerId"
                    element={
                      <RouteSuspense>
                        <CustomerDetails />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/feedback"
                    element={
                      <RouteSuspense>
                        <FeedbackList />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <RouteSuspense>
                        <NotificationSettings />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RouteSuspense>
                        <StaffProfile />
                      </RouteSuspense>
                    }
                  />
                </Route>

                <Route
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager"]} />
                  }
                >
                  <Route
                    path="/services"
                    element={
                      <RouteSuspense>
                        <ServicesList />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/staff"
                    element={
                      <RouteSuspense>
                        <StaffList />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/staff/:staffId"
                    element={
                      <RouteSuspense>
                        <StaffDetails />
                      </RouteSuspense>
                    }
                  />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route
                    path="/locations"
                    element={
                      <RouteSuspense>
                        <LocationsList />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/widget"
                    element={
                      <RouteSuspense>
                        <WidgetSettings />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <RouteSuspense>
                        <Analytics />
                      </RouteSuspense>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RouteSuspense>
                        <StoreSettings />
                      </RouteSuspense>
                    }
                  />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
                  <Route
                    path="/schedule"
                    element={
                      <RouteSuspense>
                        <StaffSchedule />
                      </RouteSuspense>
                    }
                  />
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
