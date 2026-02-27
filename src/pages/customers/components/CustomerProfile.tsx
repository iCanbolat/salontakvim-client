import { format } from "date-fns";
import { Mail, Phone, Calendar, User, X } from "lucide-react";
import type { CustomerProfile as CustomerProfileType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/pages/appointments/components";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CustomerFiles } from "@/components/common/customer-files";
import { useCurrentStore } from "@/hooks";
import { formatCustomerNumber } from "@/utils/customer.utils";
import { formatCurrency } from "@/utils/appointment.utils";

interface CustomerProfileProps {
  profile: CustomerProfileType | null;
  open: boolean;
  onClose: () => void;
}

interface CustomerProfileContentProps {
  profile: CustomerProfileType;
  storeId?: string;
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
  storeId: propStoreId,
}: CustomerProfileContentProps) {
  const { store } = useCurrentStore();
  const { customer, appointments, smsHistory } = profile;
  const fullName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "No Name";

  const storeId = propStoreId || store?.id;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {fullName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatCustomerNumber(customer.publicNumber, store?.country)}
            </p>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Appointments
                </p>
                <p className="text-2xl font-bold">
                  {customer.totalAppointments}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {customer.completedAppointments}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {customer.cancelledAppointments}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Spent
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(customer.totalSpent, store?.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment History</CardTitle>
        </CardHeader>
        <CardContent className="max-h-84 overflow-y-auto">
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
                            "MMMM d, yyyy 'at' HH:mm",
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
                        {formatCurrency(
                          appointment.totalPrice,
                          store?.currency,
                        )}
                      </div>
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

      {smsHistory && smsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SMS History</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            <div className="space-y-3">
              {smsHistory.map((sms, index) => (
                <div key={sms.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {sms.metadata?.action === "sms_failed"
                          ? "Failed SMS"
                          : sms.metadata?.isBulk
                            ? "Bulk SMS"
                            : "SMS"}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(sms.createdAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{sms.message}</p>
                    {sms.metadata?.preview && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        “{sms.metadata.preview}”
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Files Section */}
      {storeId && <CustomerFiles storeId={storeId} customerId={customer.id} />}
    </div>
  );
}
