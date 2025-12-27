import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import type { Appointment } from "@/types";

interface AppointmentsListTableProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
}

export function AppointmentsListTable({
  appointments,
  onEdit,
}: AppointmentsListTableProps) {
  return (
    <Table className="text-left">
      <TableHeader>
        <TableRow className="border-b border-gray-100">
          <TableHead className="py-4 px-4 font-semibold text-gray-600 text-sm">
            Date & Time
          </TableHead>
          <TableHead className="py-4 px-4 font-semibold text-gray-600 text-sm">
            Customer
          </TableHead>
          <TableHead className="py-4 px-4 font-semibold text-gray-600 text-sm">
            Service
          </TableHead>
          <TableHead className="py-4 px-4 font-semibold text-gray-600 text-sm">
            Staff
          </TableHead>
          <TableHead className="py-4 px-4 font-semibold text-gray-600 text-sm">
            Status
          </TableHead>
          <TableHead className="py-4 px-4 font-semibold text-gray-600 text-sm text-right">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-gray-50">
        {appointments.map((appointment) => {
          const guestName =
            appointment.guestInfo?.firstName && appointment.guestInfo?.lastName
              ? `${appointment.guestInfo.firstName} ${appointment.guestInfo.lastName}`
              : appointment.guestInfo?.firstName ||
                appointment.guestInfo?.lastName;

          const customerDisplayName =
            appointment.customerName || guestName || "Guest Customer";
          const serviceDisplayName =
            appointment.serviceName || "Custom Service";
          const staffDisplayName = appointment.staffName || "Any Staff";

          return (
            <TableRow
              key={appointment.id}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <TableCell className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 text-sm">
                    {format(new Date(appointment.startDateTime), "MMM d, yyyy")}
                  </span>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    {format(new Date(appointment.startDateTime), "HH:mm")} -{" "}
                    {format(new Date(appointment.endDateTime), "HH:mm")}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 px-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    {customerDisplayName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4 px-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    {serviceDisplayName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4 px-4">
                <span className="text-sm text-gray-700">
                  {staffDisplayName}
                </span>
              </TableCell>
              <TableCell className="py-4 px-4">
                <AppointmentStatusBadge status={appointment.status} />
              </TableCell>
              <TableCell className="py-4 px-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(appointment)}
                >
                  <span className="text-sm">View Details</span>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
