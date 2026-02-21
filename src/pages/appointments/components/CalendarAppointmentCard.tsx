/**
 * Calendar Appointment Card
 * Compact appointment display for calendar cells
 */

import { format } from "date-fns";
import type { Appointment } from "@/types";
import { cn } from "@/lib/utils";

interface CalendarAppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export function CalendarAppointmentCard({
  appointment,
  onClick,
}: CalendarAppointmentCardProps) {
  const customerName = appointment.guestInfo
    ? `${appointment.guestInfo.firstName} ${appointment.guestInfo.lastName}`
    : "Customer";

  const startTime = format(new Date(appointment.startDateTime), "HH:mm");

  // Status colors
  const statusColors = {
    pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
    confirmed: "bg-blue-100 border-blue-300 text-blue-800",
    completed: "bg-green-100 border-green-300 text-green-800",
    cancelled: "bg-red-100 border-red-300 text-red-800",
    no_show: "bg-gray-100 border-gray-300 text-gray-800",
    expired: "bg-orange-100 border-orange-300 text-orange-800",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "text-xs p-1 mb-1 rounded border cursor-pointer hover:shadow-sm transition-shadow",
        statusColors[appointment.status],
      )}
    >
      <div className="font-medium truncate">{startTime}</div>
      <div className="truncate">{customerName}</div>
      {appointment.isPaid && (
        <div className="text-[10px] font-semibold">✓ Paid</div>
      )}
    </div>
  );
}
