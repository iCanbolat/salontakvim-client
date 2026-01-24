/**
 * Unified Dashboard Page
 * Automatically switches between Admin and Staff dashboards based on user role and data
 */

import {
  Calendar,
  DollarSign,
  Users,
  UserCog,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  MetricCard,
  AppointmentStatusBreakdown,
  RecentActivityList,
  QuickStats,
  RecentAppointments,
  QuickActions,
  TodaysSchedule,
  UpcomingAppointments,
} from "./components";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardData } from "./hooks/useDashboardData";

export function DashboardPage() {
  const { user, store, staffMember, adminData, staffData, isLoading } =
    useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Admin Dashboard UI
  const renderAdminDashboard = () => {
    if (adminData.error) {
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

    if (!adminData.analytics || !store) return null;

    const { stats } = adminData.analytics;

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

        {/* Fourth Row - Appointments & Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentAppointments />
          <RecentActivityList activities={adminData.activities} />
        </div>
      </div>
    );
  };

  // Staff Dashboard UI
  const renderStaffDashboard = () => {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName || "there"}! Here's your schedule
            overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Appointments
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffData.stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {staffData.stats.completed}
              </div>
              <p className="text-xs text-muted-foreground">Successfully done</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {staffData.stats.pending}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earned
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${staffData.stats.totalEarned}
              </div>
              <p className="text-xs text-muted-foreground">From completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <TodaysSchedule appointments={staffData.appointments} />

        {/* Upcoming Appointments */}
        <UpcomingAppointments appointments={staffData.appointments} />
      </div>
    );
  };

  // If user is admin, show admin dashboard (with tabs if they are also staff)
  if (user?.role === "admin") {
    if (staffMember) {
      return (
        <Tabs defaultValue="store" className="space-y-6">
          <TabsList>
            <TabsTrigger value="store">Store Dashboard</TabsTrigger>
            <TabsTrigger value="staff">My Staff Dashboard</TabsTrigger>
          </TabsList>
          <TabsContent value="store" className="space-y-6">
            {renderAdminDashboard()}
          </TabsContent>
          <TabsContent value="staff" className="space-y-6">
            {renderStaffDashboard()}
          </TabsContent>
        </Tabs>
      );
    }
    return renderAdminDashboard();
  }

  // If user is staff (and not admin), show staff dashboard
  return renderStaffDashboard();
}

export default DashboardPage;
