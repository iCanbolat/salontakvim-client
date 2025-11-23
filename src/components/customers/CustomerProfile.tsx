/**
 * Customer Profile Component
 * Detailed customer profile with appointment history
 */

import { format } from "date-fns";
import { Mail, Phone, Calendar, User, X } from "lucide-react";
import type { CustomerProfile as CustomerProfileType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CustomerProfileProps {
  profile: CustomerProfileType | null;
  open: boolean;
  onClose: () => void;
}

interface CustomerProfileContentProps {
  profile: CustomerProfileType;
}

export function CustomerProfile({
  profile,
  open,
  onClose,
}: CustomerProfileProps) {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Customer Profile</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <CustomerProfileContent profile={profile} />
      </DialogContent>
    </Dialog>
  );
}

export function CustomerProfileContent({
  profile,
}: CustomerProfileContentProps) {
  const { customer, appointments } = profile;
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "No Name";

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {fullName}
            </CardTitle>
            <div className="flex gap-2">
              {!customer.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {customer.emailVerified && (
                <Badge variant="outline" className="text-green-600">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{customer.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              Member since{" "}
              {format(new Date(customer.createdAt), "MMMM d, yyyy")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customer.totalAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customer.completedAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {customer.cancelledAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${customer.totalSpent}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment History</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments && appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map((appointment, index) => (
                <div key={appointment.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {format(
                            new Date(appointment.startDateTime),
                            "MMMM d, yyyy 'at' HH:mm"
                          )}
                        </span>
                        <AppointmentStatusBadge status={appointment.status} />
                      </div>
                      {(appointment.serviceName || appointment.serviceId) && (
                        <div className="text-sm text-gray-600">
                          Service:{" "}
                          {appointment.serviceName ??
                            `#${appointment.serviceId}`}
                        </div>
                      )}
                      {(appointment.staffName || appointment.staffId) && (
                        <div className="text-sm text-gray-600">
                          Staff:{" "}
                          {appointment.staffName ?? `#${appointment.staffId}`}
                        </div>
                      )}
                      {appointment.customerNotes && (
                        <div className="text-sm text-gray-600 mt-1 italic">
                          Note: {appointment.customerNotes}
                        </div>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="font-semibold text-blue-600">
                        ${appointment.totalPrice}
                      </div>
                      {appointment.isPaid && (
                        <Badge
                          variant="outline"
                          className="text-green-600 mt-1"
                        >
                          Paid
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No appointments found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
