/**
 * AppointmentsListTable Component
 * Table view for appointments list using TableView component.
 */

import { format } from "date-fns";
import { memo, useMemo } from "react";
import { Edit, MoreVertical, Trash2, MessageSquare } from "lucide-react";
import type { Appointment } from "@/types";
import { TableView, type TableColumn } from "@/components/common/page-view";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import { Button } from "@/components/ui/button";
import { useCurrentStore } from "@/hooks/useCurrentStore";
import { formatAppointmentNumber } from "@/utils/appointment.utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppointmentsListTableProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onChangeStatus?: (appointment: Appointment) => void;
  onRowClick?: (appointment: Appointment) => void;
}

export const AppointmentsListTable = memo(function AppointmentsListTable({
  appointments,
  onEdit,
  onDelete,
  onChangeStatus,
  onRowClick,
}: AppointmentsListTableProps) {
  const { store } = useCurrentStore();
  const columns: TableColumn<Appointment>[] = useMemo(
    () => [
      {
        key: "publicNumber",
        header: "#",
        render: (appointment) => (
          <span className="font-mono text-muted-foreground">
            {formatAppointmentNumber(appointment.publicNumber, store?.country)}
          </span>
        ),
        headerClassName: "w-20",
      },
      {
        key: "customer",
        header: "Customer",
        render: (appointment) => (
          <div className="flex flex-col">
            <span className="font-medium">{appointment.customerName}</span>
            {appointment.phone && (
              <span className="text-sm text-muted-foreground">
                {appointment.phone}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "service",
        header: "Service",
        render: (appointment) => (
          <span className="font-medium">{appointment.serviceName}</span>
        ),
        hideOnMobile: true,
      },
      {
        key: "staff",
        header: "Staff",
        render: (appointment) => <span>{appointment.staffName}</span>,
        hideOnMobile: true,
      },
      {
        key: "dateTime",
        header: "Date & Time",
        render: (appointment) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {format(new Date(appointment.startDateTime), "MMM d, yyyy")}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(appointment.startDateTime), "h:mm a")} -{" "}
              {format(new Date(appointment.endDateTime), "h:mm a")}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (appointment) => (
          <AppointmentStatusBadge status={appointment.status} />
        ),
      },
      {
        key: "price",
        header: "Price",
        render: (appointment) => (
          <span className="font-medium">
            ₺{Number(appointment.totalPrice).toFixed(2)}
          </span>
        ),
        hideOnMobile: true,
        hideOnTablet: true,
      },
      {
        key: "actions",
        header: "",
        render: (appointment) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(appointment);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {onChangeStatus && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeStatus(appointment);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Change Status
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    confirm(
                      "Are you sure you want to delete this appointment? This action cannot be undone.",
                    )
                  ) {
                    onDelete(appointment.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        cellClassName: "text-right",
      },
    ],
    [onEdit, onDelete, onChangeStatus, store?.country],
  );

  return (
    <TableView
      data={appointments}
      columns={columns}
      getRowKey={(appointment) => appointment.id}
      onRowClick={onRowClick}
      rowClassName="cursor-pointer"
    />
  );
});

AppointmentsListTable.displayName = "AppointmentsListTable";
