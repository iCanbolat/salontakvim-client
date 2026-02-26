/**
 * Upcoming Appointments Component
 * Shows staff's next 5 upcoming appointments
 */

import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { Calendar, User } from "lucide-react";
import type { Appointment } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/pages/appointments/components";

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

export function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  // Get upcoming appointments (after today, next 5)
  const tomorrow = startOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingAppointments = appointments
    .filter(
      (apt) =>
        isAfter(parseISO(apt.startDateTime), tomorrow) &&
        apt.status !== "cancelled" &&
        apt.status !== "no_show",
    )
    .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Appointments
        </CardTitle>
        <CardDescription>Your next scheduled appointments</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => {
              const customerName = appointment.customerName || "Customer";

              return (
                <div
                  key={appointment.id}
                  className="flex items-start justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{customerName}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(
                        parseISO(appointment.startDateTime),
                        "MMM d, yyyy 'at' HH:mm",
                      )}
                    </div>
                    {(appointment.serviceName || appointment.serviceId) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {appointment.serviceName ||
                          `Service ID: ${appointment.serviceId}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <AppointmentStatusBadge status={appointment.status} />
                    <div className="text-sm font-medium text-blue-600 mt-1">
                      ${appointment.totalPrice}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No upcoming appointments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
