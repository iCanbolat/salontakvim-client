/**
 * Appointment Summary Card
 */

import { format } from "date-fns";
import { Calendar, Clock, User, Briefcase, MapPin, Wallet } from "lucide-react";
import type { Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";

interface AppointmentSummaryCardProps {
  appointment: Appointment;
}

export function AppointmentSummaryCard({
  appointment,
}: AppointmentSummaryCardProps) {
  const guestName = appointment.guestInfo
    ? `${appointment.guestInfo.firstName || ""} ${
        appointment.guestInfo.lastName || ""
      }`.trim()
    : "";

  const customerDisplayName =
    appointment.customerName ||
    guestName ||
    (appointment.customerId
      ? `Customer #${appointment.customerId}`
      : "Customer");

  const appointmentDate = format(
    new Date(appointment.startDateTime),
    "MMM d, yyyy",
  );
  const appointmentTime = `${format(
    new Date(appointment.startDateTime),
    "HH:mm",
  )} - ${format(new Date(appointment.endDateTime), "HH:mm")}`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-xl">{customerDisplayName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Appointment #{appointment.publicNumber}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Date
            </p>
            <p className="text-sm font-medium">{appointmentDate}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Time
            </p>
            <p className="text-sm font-medium">{appointmentTime}</p>
          </div>
        </div>
        {appointment.serviceName && (
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Service
              </p>
              <p className="text-sm font-medium">{appointment.serviceName}</p>
            </div>
          </div>
        )}
        {appointment.staffName && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Staff
              </p>
              <p className="text-sm font-medium">{appointment.staffName}</p>
            </div>
          </div>
        )}
        {appointment.locationName && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="text-sm font-medium">{appointment.locationName}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total Price
            </p>
            <p className="text-sm font-medium">{appointment.totalPrice}</p>
          </div>
        </div>

        {(appointment.customerNotes || appointment.internalNotes) && (
          <div className="col-span-full border-t pt-4 mt-2 space-y-4">
            {appointment.customerNotes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Customer Notes
                </p>
                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-800">
                  {appointment.customerNotes}
                </div>
              </div>
            )}
            {appointment.internalNotes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Internal Notes (Admin Only)
                </p>
                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-100">
                  {appointment.internalNotes}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
