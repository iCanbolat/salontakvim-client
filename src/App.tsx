/**
 * Main App Component with Routing
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts";
import { MainLayout } from "./components/layout";
import { LoginPage, RegisterPage } from "./pages/auth";
import {
  AdminDashboard,
  StoreSettings,
  ServicesList,
  CategoriesList,
  StaffList,
  LocationsList,
  AppointmentsList,
  CustomersList,
  WidgetSettings,
  Analytics,
  NotificationSettings,
} from "./pages/admin";
import AppointmentsCalendarPage from "./pages/admin/AppointmentsCalendarPage";
import { StaffDashboard } from "./pages/staff";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {/* Toast notifications */}
          <Toaster position="top-right" richColors />

          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes with layout */}
            <Route element={<MainLayout />}>
              {/* Admin routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route
                path="/admin/appointments"
                element={<AppointmentsList />}
              />
              <Route
                path="/admin/appointments/calendar"
                element={<AppointmentsCalendarPage />}
              />
              <Route path="/admin/services" element={<ServicesList />} />
              <Route path="/admin/categories" element={<CategoriesList />} />
              <Route path="/admin/staff" element={<StaffList />} />
              <Route path="/admin/locations" element={<LocationsList />} />
              <Route path="/admin/customers" element={<CustomersList />} />
              <Route path="/admin/widget" element={<WidgetSettings />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route
                path="/admin/notifications"
                element={<NotificationSettings />}
              />
              <Route path="/admin/settings" element={<StoreSettings />} />

              {/* Staff routes */}
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route
                path="/staff/appointments"
                element={<div>My Appointments (Coming Soon)</div>}
              />
              <Route
                path="/staff/schedule"
                element={<div>My Schedule (Coming Soon)</div>}
              />
              <Route
                path="/staff/time-off"
                element={<div>Time Off (Coming Soon)</div>}
              />
              <Route
                path="/staff/profile"
                element={<div>Profile (Coming Soon)</div>}
              />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
