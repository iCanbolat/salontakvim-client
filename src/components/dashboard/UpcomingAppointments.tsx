/**
 * Upcoming Appointments Component
 * Shows tomorrow's appointments
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { appointmentService, storeService } from "@/services";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-gray-100 text-gray-800 border-gray-200",
};

export function UpcomingAppointments() {
  // Fetch user's store
  const { data: store } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Get tomorrow's date range
  const tomorrow = addDays(new Date(), 1);
  const startDate = startOfDay(tomorrow).toISOString();
  const endDate = endOfDay(tomorrow).toISOString();

  // Fetch tomorrow's appointments
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["upcoming-appointments", store?.id, startDate],
    queryFn: () =>
      appointmentService.getAppointments(store!.id, {
        startDate,
        endDate,
        limit: 100,
      }),
    enabled: !!store?.id,
  });

  const appointments = appointmentsData?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tomorrow's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tomorrow's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No appointments scheduled for tomorrow</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by start time
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tomorrow's Schedule</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {appointments.length}{" "}
            {appointments.length === 1 ? "appointment" : "appointments"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {/* Time */}
              <div className="shrink-0 text-center">
                <div className="w-14 py-1 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600">
                    {format(new Date(appointment.startDateTime), "HH:mm")}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {appointment.guestInfo
                      ? `${appointment.guestInfo.firstName} ${appointment.guestInfo.lastName}`
                      : "Customer"}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      statusColors[
                        appointment.status as keyof typeof statusColors
                      ]
                    )}
                  >
                    {appointment.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(appointment.endDateTime), "HH:mm")}
                  </span>
                  {appointment.numberOfPeople > 1 && (
                    <span>{appointment.numberOfPeople} people</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {appointment.totalPrice}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
