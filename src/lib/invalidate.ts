import type { QueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";

export function invalidateAfterAppointmentChange(
  queryClient: QueryClient,
  storeId: string,
) {
  queryClient.invalidateQueries({ queryKey: qk.appointments(storeId) });
  queryClient.invalidateQueries({ queryKey: qk.appointment(storeId) });
  queryClient.invalidateQueries({ queryKey: qk.recentAppointments(storeId) });
  queryClient.invalidateQueries({ queryKey: qk.customers(storeId) });
  queryClient.invalidateQueries({
    queryKey: qk.appointmentAnalytics(storeId),
  });
  queryClient.invalidateQueries({
    queryKey: qk.revenueAnalytics(storeId),
  });
}

export function invalidateAfterTimeOffChange(
  queryClient: QueryClient,
  storeId: string,
  staffId?: string,
) {
  if (staffId) {
    queryClient.invalidateQueries({
      queryKey: qk.staffBreaks(storeId, staffId),
    });
    queryClient.invalidateQueries({
      queryKey: qk.staffDetails(storeId, staffId),
    });
  }

  queryClient.invalidateQueries({
    queryKey: qk.adminActivities(storeId),
  });

  queryClient.invalidateQueries({ queryKey: qk.notifications() });
}
