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
import { LoginPage, RegisterPage } from "./pages/auth";
import { DashboardPage } from "./pages/dashboard";
import {
  StoreSettings,
  ServicesList,
  StaffList,
  StaffDetails,
  LocationsList,
  AppointmentsList,
  CustomerDetails,
  CustomersList,
  WidgetSettings,
  Analytics,
  NotificationSettings,
  FilesList,
  FeedbackList,
} from "./pages/admin";
import { AppointmentDetailPage } from "./pages/appointments/AppointmentDetail";
import {
  AcceptInvitationPage,
  AppointmentsList as StaffAppointmentsList,
  StaffSchedule,
  StaffProfile,
  StaffCustomersList,
  StaffCustomerDetails,
  StaffFilesList,
  StaffFeedbackList,
} from "./pages/staff";
import HostedWidgetPage from "./pages/widget/HostedWidgetPage";
import FeedbackPage from "./pages/public/FeedbackPage";
import CancelAppointmentPage from "./pages/public/CancelAppointmentPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            {/* Toast notifications */}
            <Toaster position="top-right" richColors />

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/staff/invitations/accept"
                element={<AcceptInvitationPage />}
              />
              <Route path="/book/:slug" element={<HostedWidgetPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route
                path="/appointments/cancel"
                element={<CancelAppointmentPage />}
              />

              {/* Protected routes with layout */}
              <Route element={<MainLayout />}>
                {/* Admin routes */}
                <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                  <Route path="/admin/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/admin/appointments"
                    element={<AppointmentsList />}
                  />
                  <Route
                    path="/admin/appointments/:appointmentId"
                    element={<AppointmentDetailPage />}
                  />
                  <Route path="/admin/services" element={<ServicesList />} />

                  <Route path="/admin/staff" element={<StaffList />} />
                  <Route
                    path="/admin/staff/:staffId"
                    element={<StaffDetails />}
                  />
                  <Route path="/admin/locations" element={<LocationsList />} />
                  <Route path="/admin/customers" element={<CustomersList />} />
                  <Route
                    path="/admin/customers/:customerId"
                    element={<CustomerDetails />}
                  />
                  <Route path="/admin/files" element={<FilesList />} />
                  <Route path="/admin/feedback" element={<FeedbackList />} />
                  <Route path="/admin/widget" element={<WidgetSettings />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route
                    path="/admin/notifications"
                    element={<NotificationSettings />}
                  />
                  <Route path="/admin/profile" element={<StaffProfile />} />
                  <Route path="/admin/settings" element={<StoreSettings />} />
                </Route>

                {/* Staff routes */}
                <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
                  <Route path="/staff/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/staff/appointments"
                    element={<StaffAppointmentsList />}
                  />
                  <Route
                    path="/staff/appointments/:appointmentId"
                    element={<AppointmentDetailPage />}
                  />
                  <Route path="/staff/schedule" element={<StaffSchedule />} />
                  <Route
                    path="/staff/time-off"
                    element={<Navigate to="/staff/schedule" replace />}
                  />
                  <Route
                    path="/staff/customers"
                    element={<StaffCustomersList />}
                  />
                  <Route
                    path="/staff/customers/:customerId"
                    element={<StaffCustomerDetails />}
                  />
                  <Route path="/staff/files" element={<StaffFilesList />} />
                  <Route
                    path="/staff/feedback"
                    element={<StaffFeedbackList />}
                  />
                  <Route path="/staff/profile" element={<StaffProfile />} />
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

// Root redirect component to handle dashboard routing
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to appropriate dashboard based on role
  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.role === "staff") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default App;
