/**
 * Appointment Cancellation Card
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment } from "@/types";

interface AppointmentCancellationCardProps {
  appointment: Appointment;
}

export function AppointmentCancellationCard({
  appointment,
}: AppointmentCancellationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cancellation Reason</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">
          {appointment.cancellationReason || "No reason provided."}
        </p>
      </CardContent>
    </Card>
  );
}
