/**
 * AppointmentsListTable Component
 * Table view for appointments list using TableView component.
 */

import { format } from "date-fns";
import { Edit } from "lucide-react";
import type { Appointment } from "@/types";
import { TableView, type TableColumn } from "@/components/common/page-view";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { Button } from "@/components/ui/button";

interface AppointmentsListTableProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
}

export function AppointmentsListTable({
  appointments,
  onEdit,
}: AppointmentsListTableProps) {
  const columns: TableColumn<Appointment>[] = [
    {
      key: "publicNumber",
      header: "#",
      render: (appointment) => (
        <span className="font-mono text-muted-foreground">
          {appointment.publicNumber}
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
          {appointment.guestInfo?.phone && (
            <span className="text-sm text-muted-foreground">
              {appointment.guestInfo.phone}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(appointment);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      ),
      cellClassName: "text-right",
    },
  ];

  return (
    <TableView
      data={appointments}
      columns={columns}
      getRowKey={(appointment) => appointment.id}
      onRowClick={onEdit}
    />
  );
}
