import type { QueryClient } from "@tanstack/react-query";

export function invalidateAfterAppointmentChange(
  queryClient: QueryClient,
  storeId: string,
) {
  // Appointments list for this store
  queryClient.invalidateQueries({ queryKey: ["appointments", storeId] });

  // Recent appointments for dashboard (any location scope)
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return key[0] === "recent-appointments" && key[1] === storeId;
    },
  });

  // Customers list for this store (any search/page)
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return key[0] === "customers" && key[1] === storeId;
    },
  });

  // Dashboard stats (store-agnostic key currently)
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

  // Appointment analytics for this store (any dateRange)
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return key[0] === "appointmentAnalytics" && key[1] === storeId;
    },
  });

  // Revenue analytics for this store (any dateRange)
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return key[0] === "revenueAnalytics" && key[1] === storeId;
    },
  });
}

export function invalidateAfterTimeOffChange(
  queryClient: QueryClient,
  storeId: string,
  staffId?: string,
) {
  // Invalidate breaks list
  if (staffId) {
    queryClient.invalidateQueries({
      queryKey: ["staff-breaks", storeId, staffId],
    });
    queryClient.invalidateQueries({
      queryKey: ["staff-details", storeId, staffId],
    });
  }

  // Invalidate activities (matches both global and location-scoped)
  queryClient.invalidateQueries({
    queryKey: ["admin-activities", storeId],
  });

  // Invalidate notifications
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
}
