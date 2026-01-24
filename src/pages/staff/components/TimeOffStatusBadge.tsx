/**
 * Time Off Status Badge Component
 * Color-coded status badges for time-off requests
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type TimeOffStatus = "pending" | "approved" | "declined";

interface TimeOffStatusBadgeProps {
  status: TimeOffStatus;
  className?: string;
}

const statusConfig: Record<
  TimeOffStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
    className: string;
  }
> = {
  pending: {
    label: "Pending",
    variant: "default",
    icon: <Clock className="h-3 w-3" />,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    label: "Approved",
    variant: "secondary",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "border-green-200 bg-green-50 text-green-700",
  },
  declined: {
    label: "Declined",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function TimeOffStatusBadge({
  status,
  className,
}: TimeOffStatusBadgeProps) {
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
