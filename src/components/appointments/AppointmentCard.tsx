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
  DollarSign,
  Edit,
  Trash2,
  MessageSquare,
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
      queryClient.invalidateQueries({ queryKey: ["appointments", storeId] });
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
  const customerName = appointment.guestInfo
    ? `${appointment.guestInfo.firstName} ${appointment.guestInfo.lastName}`
    : "Customer";

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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{customerName}</CardTitle>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <CardDescription>Appointment #{appointment.id}</CardDescription>
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
      <CardContent className="space-y-2">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{appointmentDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{appointmentTime}</span>
        </div>

        {/* Service */}
        {appointment.serviceId && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-gray-500" />
            <span>Service ID: {appointment.serviceId}</span>
          </div>
        )}

        {/* Staff */}
        {appointment.staffId && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-500" />
            <span>Staff ID: {appointment.staffId}</span>
          </div>
        )}

        {/* Location */}
        {appointment.locationId && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>Location ID: {appointment.locationId}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span>${appointment.totalPrice}</span>
          {appointment.isPaid && (
            <span className="text-xs text-green-600 ml-2">(Paid)</span>
          )}
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
