/**
 * Appointment Status Breakdown Component
 * Shows appointment counts by status
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

interface AppointmentStatusBreakdownProps {
  stats: DashboardStats;
}

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  no_show: "bg-gray-500",
  expired: "bg-slate-500",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  expired: "Expired",
};

export function AppointmentStatusBreakdown({
  stats,
}: AppointmentStatusBreakdownProps) {
  const statusData = [
    { status: "pending", count: stats.pendingAppointments },
    { status: "confirmed", count: stats.confirmedAppointments },
    { status: "completed", count: stats.completedAppointments },
    { status: "cancelled", count: stats.cancelledAppointments },
    { status: "no_show", count: stats.noShowAppointments },
    { status: "expired", count: stats.expiredAppointments },
  ] as const;

  const total = statusData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusData.map(({ status, count }) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {statusLabels[status]}
                  </span>
                  <span className="text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColors[status]} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
