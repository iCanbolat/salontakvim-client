/**
 * Today's Schedule Component
 * Displays staff's appointments for today in a timeline format
 */

import { format, parseISO, isSameDay } from "date-fns";
import { Clock, User, MapPin, Briefcase } from "lucide-react";
import type { Appointment } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments";
import { Badge } from "@/components/ui/badge";

interface TodaysScheduleProps {
  appointments: Appointment[];
}

export function TodaysSchedule({ appointments }: TodaysScheduleProps) {
  // Filter today's appointments
  const today = new Date();
  const todayAppointments = appointments
    .filter((apt) => isSameDay(parseISO(apt.startDateTime), today))
    .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Schedule
        </CardTitle>
        <CardDescription>
          {format(today, "EEEE, MMMM d, yyyy")} • {todayAppointments.length}{" "}
          appointment
          {todayAppointments.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {todayAppointments.length > 0 ? (
          <div className="space-y-4">
            {todayAppointments.map((appointment) => {
              const startTime = format(
                parseISO(appointment.startDateTime),
                "HH:mm"
              );
              const endTime = format(
                parseISO(appointment.endDateTime),
                "HH:mm"
              );
              const customerName = appointment.guestInfo
                ? `${appointment.guestInfo.firstName} ${appointment.guestInfo.lastName}`
                : "Customer";

              return (
                <div
                  key={appointment.id}
                  className="flex gap-4 p-4 rounded-lg border hover:shadow-sm transition-shadow"
                >
                  {/* Time */}
                  <div className="shrink-0 w-24 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {startTime}
                    </div>
                    <div className="text-sm text-gray-500">{endTime}</div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{customerName}</span>
                      </div>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>

                    {appointment.serviceId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        <span>Service ID: {appointment.serviceId}</span>
                      </div>
                    )}

                    {appointment.locationId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Location ID: {appointment.locationId}</span>
                      </div>
                    )}

                    {appointment.customerNotes && (
                      <div className="text-sm text-gray-600 italic">
                        Note: {appointment.customerNotes}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-sm font-medium text-blue-600">
                        ${appointment.totalPrice}
                      </span>
                      {appointment.isPaid && (
                        <Badge variant="outline" className="text-green-600">
                          Paid
                        </Badge>
                      )}
                      {appointment.numberOfPeople > 1 && (
                        <Badge variant="secondary">
                          {appointment.numberOfPeople} people
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments today
            </h3>
            <p className="text-gray-600">
              You have a free day! Enjoy your time off.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
