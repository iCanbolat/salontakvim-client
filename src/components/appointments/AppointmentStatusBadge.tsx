/**
 * Appointment Status Badge Component
 * Color-coded status badges for appointments
 */

import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/types";
import { CheckCircle, Clock, XCircle, UserX } from "lucide-react";

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
    className: string;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  confirmed: {
    label: "Confirmed",
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />,
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  completed: {
    label: "Completed",
    variant: "outline",
    icon: <CheckCircle className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 border-green-300",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 border-red-300",
  },
  no_show: {
    label: "No Show",
    variant: "outline",
    icon: <UserX className="h-3 w-3" />,
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
};

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${
        className || ""
      } flex items-center gap-1`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
