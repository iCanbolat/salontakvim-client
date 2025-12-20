/**
 * Appointment Card Component
 * Displays appointment details with actions
 */

import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  MapPin,
  Edit,
  Trash2,
  MessageSquare,
  Banknote,
} from "lucide-react";
import { appointmentService } from "@/services";
import type { Appointment } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { invalidateAfterAppointmentChange } from "@/lib/invalidate";

interface AppointmentCardProps {
  appointment: Appointment;
  storeId: number;
  onEdit: (appointment: Appointment) => void;
  onChangeStatus?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  storeId,
  onEdit,
  onChangeStatus,
}: AppointmentCardProps) {
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () =>
      appointmentService.deleteAppointment(storeId, appointment.id),
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, storeId);
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this appointment? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate();
    }
  };

  // Customer name
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

  const serviceDisplayName =
    appointment.serviceName ||
    (appointment.serviceId ? `Service #${appointment.serviceId}` : undefined);

  const staffDisplayName =
    appointment.staffName ||
    (appointment.staffId ? `Staff #${appointment.staffId}` : undefined);

  const locationDisplayName =
    appointment.locationName ||
    (appointment.locationId
      ? `Location #${appointment.locationId}`
      : undefined);

  // Format date and time
  const appointmentDate = format(
    new Date(appointment.startDateTime),
    "MMM d, yyyy"
  );
  const appointmentTime = `${format(
    new Date(appointment.startDateTime),
    "HH:mm"
  )} - ${format(new Date(appointment.endDateTime), "HH:mm")}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{customerDisplayName}</CardTitle>
            </div>
            <CardDescription className="mb-2">
              Appointment #{appointment.id}
            </CardDescription>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(appointment)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {onChangeStatus && (
                <DropdownMenuItem onClick={() => onChangeStatus(appointment)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Change Status
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          {/* Date  */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Date
              </span>
            </div>
            <span className="text-sm font-medium">{appointmentDate}</span>
          </div>

          {/* Appointment Time */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Time
              </span>
            </div>
            <span className="text-sm font-medium">{appointmentTime}</span>
          </div>

          {/* Service */}
          {serviceDisplayName && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Service
                </span>
              </div>
              <span className="text-sm font-medium truncate">
                {serviceDisplayName}
              </span>
            </div>
          )}

          {/* Staff */}
          {staffDisplayName && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <User className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Staff
                </span>
              </div>
              <span className="text-sm font-medium truncate">
                {staffDisplayName}
              </span>
            </div>
          )}

          {/* Location */}
          {locationDisplayName && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Location
                </span>
              </div>
              <span className="text-sm font-medium truncate">
                {locationDisplayName}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Banknote className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Price
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-700">
                ${appointment.totalPrice}
              </span>
              {appointment.isPaid && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
                  Paid
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer Notes */}
        {appointment.customerNotes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
            <p className="text-gray-600 text-xs mb-1">Customer Notes:</p>
            <p className="text-gray-800">{appointment.customerNotes}</p>
          </div>
        )}

        {/* Internal Notes */}
        {appointment.internalNotes && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
            <p className="text-blue-600 text-xs mb-1">Internal Notes:</p>
            <p className="text-blue-800">{appointment.internalNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
