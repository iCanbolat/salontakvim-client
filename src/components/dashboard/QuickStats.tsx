/**
 * Quick Stats Component
 * Shows quick overview stats
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatsProps {
  stats: DashboardStats;
}

export function QuickStats({ stats }: QuickStatsProps) {
  const cancellationRate = parseFloat(stats.cancellationRate);
  const isHighCancellation = cancellationRate > 20;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Today's Appointments */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Appointments
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.appointmentsToday}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-lg font-semibold text-green-600 mt-1">
                {stats.revenueToday}
              </p>
            </div>
          </div>

          {/* Tomorrow's Schedule */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">
              Tomorrow's Appointments
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.appointmentsTomorrow}
            </p>
          </div>

          {/* Average Appointment Value */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">
              Avg. Appointment Value
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {stats.averageAppointmentValue}
            </p>
          </div>

          {/* Cancellation Rate */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">
              Cancellation Rate
            </p>
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-lg font-semibold",
                  isHighCancellation ? "text-red-600" : "text-green-600"
                )}
              >
                {stats.cancellationRate}
              </p>
              {isHighCancellation ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>

          {/* Popular Time Slot */}
          {stats.popularTimeSlot && (
            <div className="flex items-center justify-between py-3">
              <p className="text-sm font-medium text-gray-600">
                Most Popular Time
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.popularTimeSlot}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
