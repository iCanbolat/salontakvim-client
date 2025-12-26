/**
 * Customer Card Component
 * Displays customer information in a card format
 */

import { format } from "date-fns";
import { Mail, Phone, Calendar, DollarSign } from "lucide-react";
import type { CustomerWithStats } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomerCardProps {
  customer: CustomerWithStats;
  onView: (customer: CustomerWithStats) => void;
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
}

export function CustomerCard({
  customer,
  onView,
  isSelected,
  onSelectChange,
}: CustomerCardProps) {
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "No Name";

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
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
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange?.(checked as boolean)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
            aria-label="Select customer"
          />
        </div>
      </CardHeader>
      <CardContent
        className="space-y-2 flex-1"
        onClick={() => onView(customer)}
      >
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
