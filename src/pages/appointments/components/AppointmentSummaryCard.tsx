/**
 * Appointment Summary Card
 */

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  MapPin,
  Wallet,
  Star,
} from "lucide-react";
import type { Appointment, Feedback } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import { useCurrentStore } from "@/hooks/useCurrentStore";
import {
  formatAppointmentNumber,
  formatCurrency,
} from "@/utils/appointment.utils";

interface AppointmentSummaryCardProps {
  appointment: Appointment;
  feedback?: Feedback | null;
}

export function AppointmentSummaryCard({
  appointment,
  feedback,
}: AppointmentSummaryCardProps) {
  const { store } = useCurrentStore();
  const customerDisplayName =
    appointment.customerName ||
    (appointment.customerId
      ? `Customer #${appointment.customerId}`
      : "Customer");

  const appointmentDate = format(
    new Date(appointment.startDateTime),
    "MMM d, yyyy",
  );
  const appointmentTime = `${format(
    new Date(appointment.startDateTime),
    "HH:mm",
  )} - ${format(new Date(appointment.endDateTime), "HH:mm")}`;

  const total = Number(appointment.totalPrice || 0);
  const deposit = Number(appointment.depositAmount || 0);
  const remaining = Number(
    appointment.remainingAmount ?? Math.max(0, total - deposit).toFixed(2),
  );

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, index) => {
      const filled = index < rating;
      return (
        <Star
          key={index}
          className={
            filled
              ? "h-3.5 w-3.5 text-yellow-500 fill-yellow-500"
              : "h-3.5 w-3.5 text-gray-200"
          }
        />
      );
    });

  const renderRatingItem = (
    label: string,
    rating: number | null | undefined,
  ) => {
    if (rating === null || rating === undefined) return null;
    return (
      <div className="flex flex-row md:flex-col justify-between items-center md:items-start py-1 md:py-0 min-w-fit">
        <span className="text-[10px] md:text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-0 md:mb-1">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">{renderStars(rating)}</div>
          <span className="text-[10px] font-bold md:hidden">{rating}/5</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">{customerDisplayName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {formatAppointmentNumber(appointment.publicNumber, store?.country)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-0 md:h-[540px] overflow-y-auto">
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-1 rounded-sm transition-colors">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Date
            </p>
          </div>
          <p className="text-sm font-semibold">{appointmentDate}</p>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-1 rounded-sm transition-colors">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Time
            </p>
          </div>
          <p className="text-sm font-semibold">{appointmentTime}</p>
        </div>

        {appointment.serviceName && (
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-1 rounded-sm transition-colors">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Service
              </p>
            </div>
            <p className="text-sm font-semibold text-right max-w-[200px] truncate">
              {appointment.serviceName}
            </p>
          </div>
        )}

        {appointment.staffName && (
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-1 rounded-sm transition-colors">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Staff
              </p>
            </div>
            <p className="text-sm font-semibold text-right max-w-[200px] truncate">
              {appointment.staffName}
            </p>
          </div>
        )}

        {appointment.locationName && (
          <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-1 rounded-sm transition-colors">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Location
              </p>
            </div>
            <p className="text-sm font-semibold text-right max-w-[200px] truncate">
              {appointment.locationName}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-1 rounded-sm transition-colors">
          <div className="flex items-center gap-3">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Total Price
            </p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-sm font-bold text-blue-700">
              {formatCurrency(total, store?.currency)}
            </p>
            {deposit > 0 && (
              <div className="flex flex-col items-end mt-1 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">
                  Deposit: {formatCurrency(deposit, store?.currency)}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Remaining: {formatCurrency(remaining, store?.currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        {feedback && (
          <div className="pt-4 mt-2 border-t border-gray-100">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground pb-2">
              Customer Feedback
            </p>
            <div className="flex flex-col md:flex-row md:flex-wrap gap-x-6 gap-y-3">
              {renderRatingItem("Overall", feedback.overallRating)}
              {renderRatingItem("Service", feedback.serviceRating)}
              {renderRatingItem("Staff", feedback.staffRating)}
              {/* {renderRatingItem("Cleanliness", feedback.cleanlinessRating)}
              {renderRatingItem("Value", feedback.valueRating)} */}
            </div>

            {feedback.comment && (
              <div className="mt-3 text-sm text-gray-700 bg-gray-50/80 p-3 rounded-lg border border-gray-100 italic">
                “{feedback.comment}”
              </div>
            )}
          </div>
        )}

        {(appointment.customerNotes || appointment.internalNotes) && (
          <div className="space-y-4 pt-4 mt-2 border-t border-gray-100">
            {appointment.customerNotes && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Customer Notes
                </p>
                <div className="bg-orange-50/30 p-3 rounded-lg text-sm text-gray-700 border border-orange-100/50 italic">
                  "{appointment.customerNotes}"
                </div>
              </div>
            )}
            {appointment.internalNotes && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-blue-600/70">
                  Internal Notes (Admin Only)
                </p>
                <div className="bg-blue-50/50 p-3 rounded-lg text-sm text-blue-900 border border-blue-100/50">
                  {appointment.internalNotes}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
