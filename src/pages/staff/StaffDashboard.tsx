/**
 * Staff Dashboard Page
 * Personal dashboard for staff members showing their schedule and stats
 */

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { appointmentService, storeService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodaysSchedule } from "@/components/staff/TodaysSchedule";
import { UpcomingAppointments } from "@/components/staff/UpcomingAppointments";

export function StaffDashboard() {
  const { user } = useAuth();

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch staff's appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["staff-appointments", store?.id, user?.id],
    queryFn: () =>
      appointmentService.getAppointments(store!.id, {
        staffId: user!.id,
        limit: 100,
      }),
    enabled: !!store?.id && !!user?.id,
  });

  const appointments = appointmentsData?.data ?? [];
  const statusCounts = appointmentsData?.statusCounts ?? {
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };

  const isLoading = storeLoading || appointmentsLoading;

  // Calculate stats
  const stats = {
    total: statusCounts.all,
    completed: statusCounts.completed,
    pending: statusCounts.pending,
    totalEarned: appointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + parseFloat(a.totalPrice), 0)
      .toFixed(2),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{stats.total}</div>
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
              {stats.completed}
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
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${stats.totalEarned}
            </div>
            <p className="text-xs text-muted-foreground">From completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <TodaysSchedule appointments={appointments} />

      {/* Upcoming Appointments */}
      <UpcomingAppointments appointments={appointments} />
    </div>
  );
}
