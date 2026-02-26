/**
 * Recent Appointments Component
 * Shows recent appointments list with status badges
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/pages/appointments/components/AppointmentStatusBadge";
import { Calendar, Clock, User } from "lucide-react";
import { appointmentService } from "@/services";
import { format } from "date-fns";
import { useAuth, useNotifications } from "@/contexts";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentStore } from "@/hooks";

export function RecentAppointments() {
  const { user } = useAuth();
  const { latestNotification } = useNotifications();
  const queryClient = useQueryClient();
  const managerLocationId =
    user?.role === "manager" ? (user.locationId ?? undefined) : undefined;

  // Handle real-time invalidation
  useEffect(() => {
    if (!latestNotification) return;

    const appointmentTypes = [
      "appointment_created",
      "appointment_cancelled",
      "appointment_status_changed",
    ];

    if (appointmentTypes.includes(latestNotification.type)) {
      queryClient.invalidateQueries({
        queryKey: ["recent-appointments", latestNotification.storeId],
      });
    }
  }, [latestNotification, queryClient]);

  const { store } = useCurrentStore();

  // Fetch recent appointments
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["recent-appointments", store?.id, managerLocationId],
    queryFn: () =>
      appointmentService.getAppointments(store!.id, {
        limit: 5,
        locationId: managerLocationId,
        sortBy: "createdAt",
        sortOrder: "desc",
        prioritizePending: true,
      }),
    enabled: !!store?.id,
  });

  const appointments = appointmentsData?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-12 w-12 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
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
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No recent appointments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {/* Icon */}
              <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {appointment.customerName}
                  </p>
                  <AppointmentStatusBadge
                    status={appointment.status}
                    className="text-xs"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(
                      new Date(appointment.startDateTime),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {appointment.numberOfPeople}{" "}
                    {appointment.numberOfPeople === 1 ? "person" : "people"}
                  </span>
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
