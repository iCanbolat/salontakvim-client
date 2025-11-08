/**
 * Appointments Calendar Page
 * Admin view for calendar-based appointment management
 */

import { useQuery } from "@tanstack/react-query";
import { useRequireRole } from "@/hooks";
import { storeService } from "@/services";
import { AppointmentsCalendar } from "@/components/appointments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function AppointmentsCalendarPage() {
  useRequireRole("admin");

  // Fetch user's store
  const { data: store, isLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No store found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AppointmentsCalendar storeId={store.id} />
    </div>
  );
}
