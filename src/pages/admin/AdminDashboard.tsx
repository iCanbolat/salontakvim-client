/**
 * Admin Dashboard Page
 */

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  DollarSign,
  Users,
  UserCog,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRequireRole } from "@/hooks";
import { analyticsService, storeService } from "@/services";
import {
  MetricCard,
  AppointmentStatusBreakdown,
  RecentActivityList,
  QuickStats,
  RecentAppointments,
  UpcomingAppointments,
  QuickActions,
} from "@/components/dashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdminDashboard() {
  useRequireRole("admin");

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch dashboard data
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard", store?.id],
    queryFn: () => analyticsService.getDashboard(store!.id),
    enabled: !!store?.id,
  });

  const isLoading = storeLoading || dashboardLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboard || !store) {
    return null;
  }

  const { stats, recentActivity } = dashboard;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Appointments"
          value={stats.totalAppointments}
          icon={Calendar}
          description="All time"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <MetricCard
          title="Revenue"
          value={stats.totalRevenue}
          icon={DollarSign}
          description="All time"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <MetricCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="Registered customers"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <MetricCard
          title="Active Staff"
          value={stats.totalStaff}
          icon={UserCog}
          description="Team members"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* Second Row - Status & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentStatusBreakdown stats={stats} />
        <QuickStats stats={stats} />
      </div>

      {/* Third Row - Quick Actions */}
      <QuickActions />

      {/* Fourth Row - Recent & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAppointments />
        <UpcomingAppointments />
      </div>

      {/* Fifth Row - Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <RecentActivityList activities={recentActivity} />
      </div>
    </div>
  );
}
