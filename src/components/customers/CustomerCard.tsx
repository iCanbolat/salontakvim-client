/**
 * Customer Card Component
 * Displays customer information in a card format
 */

import { format } from "date-fns";
import {
  Mail,
  Phone,
  Calendar,
  DollarSign,
  User,
  MoreVertical,
} from "lucide-react";
import type { CustomerWithStats } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerCardProps {
  customer: CustomerWithStats;
  onView: (customer: CustomerWithStats) => void;
  onEdit?: (customer: CustomerWithStats) => void;
  onDelete?: (customer: CustomerWithStats) => void;
}

export function CustomerCard({
  customer,
  onView,
  onEdit,
  onDelete,
}: CustomerCardProps) {
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "No Name";

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onView(customer)}>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{fullName}</CardTitle>
              {!customer.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {customer.emailVerified && (
                <Badge variant="outline" className="text-green-600">
                  Verified
                </Badge>
              )}
            </div>
            <CardDescription>Customer #{customer.id}</CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(customer)}>
                <User className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(customer)}>
                  <User className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(customer)}
                    className="text-red-600"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Deactivate
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2" onClick={() => onView(customer)}>
        {/* Email */}
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-gray-500" />
          <span className="truncate">{customer.email}</span>
        </div>

        {/* Phone */}
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>{customer.phone}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
              <Calendar className="h-3 w-3" />
              <span>Appointments</span>
            </div>
            <div className="font-semibold">
              {customer.totalAppointments}
              <span className="text-xs text-gray-500 ml-1">
                ({customer.completedAppointments} done)
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
              <DollarSign className="h-3 w-3" />
              <span>Total Spent</span>
            </div>
            <div className="font-semibold text-green-600">
              ${customer.totalSpent}
            </div>
          </div>
        </div>

        {/* Last Appointment */}
        {customer.lastAppointmentDate && (
          <div className="text-xs text-gray-600 mt-2">
            Last visit:{" "}
            {format(new Date(customer.lastAppointmentDate), "MMM d, yyyy")}
          </div>
        )}

        {/* Next Appointment */}
        {customer.nextAppointmentDate && (
          <div className="text-xs text-blue-600 mt-1">
            Next visit:{" "}
            {format(new Date(customer.nextAppointmentDate), "MMM d, yyyy")}
          </div>
        )}

        {/* Member since */}
        <div className="text-xs text-gray-500 mt-2">
          Member since {format(new Date(customer.createdAt), "MMM d, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
}
