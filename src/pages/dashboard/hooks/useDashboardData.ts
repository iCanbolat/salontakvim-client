import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import {
  analyticsService,
  activityService,
  storeService,
  staffService,
  appointmentService,
} from "@/services";

export function useDashboardData() {
  const { user } = useAuth();
  const managerLocationId =
    user?.role === "manager" ? (user.locationId ?? undefined) : undefined;
  const isStoreDashboardRole =
    user?.role === "admin" || user?.role === "manager";

  // 1. Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
    enabled: !!user,
  });

  // 2. Fetch staff member record (works for both staff and admin-who-is-also-staff)
  const { data: staffMember, isLoading: staffLoading } = useQuery({
    queryKey: ["my-staff-member", store?.id, user?.id],
    queryFn: async () => {
      const staffMembers = await staffService.getStaffMembers(store!.id);
      return staffMembers.find((s) => s.userId === user?.id) || null;
    },
    enabled: !!store?.id && !!user?.id,
  });

  // 3. Admin specific data
  const {
    data: adminAnalytics,
    isLoading: adminAnalyticsLoading,
    error: adminError,
  } = useQuery({
    queryKey: ["admin-dashboard", store?.id, managerLocationId],
    queryFn: () =>
      analyticsService.getDashboard(
        store!.id,
        managerLocationId ? { locationId: managerLocationId } : undefined,
      ),
    enabled: !!store?.id && isStoreDashboardRole,
  });

  const { data: adminActivities = [], isLoading: adminActivitiesLoading } =
    useQuery({
      queryKey: ["admin-activities", store?.id, managerLocationId],
      queryFn: () =>
        activityService.getRecentActivities(store!.id, {
          locationId: managerLocationId,
        }),
      enabled: !!store?.id && isStoreDashboardRole,
    });

  // 4. Staff specific data
  const { data: staffAppointmentsData, isLoading: staffAppointmentsLoading } =
    useQuery({
      queryKey: ["staff-appointments", store?.id, staffMember?.id],
      queryFn: () =>
        appointmentService.getAppointments(store!.id, {
          staffId: staffMember!.id,
          limit: 100,
        }),
      enabled: !!store?.id && !!staffMember?.id,
    });

  const staffAppointments = staffAppointmentsData?.data ?? [];
  const staffStatusCounts = staffAppointmentsData?.statusCounts ?? {
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };

  // Compute staff stats
  const staffStats = {
    total: staffStatusCounts.all,
    completed: staffStatusCounts.completed,
    pending: staffStatusCounts.pending,
    totalEarned: staffAppointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + parseFloat(a.totalPrice), 0)
      .toFixed(2),
  };

  const isLoading =
    storeLoading ||
    staffLoading ||
    (isStoreDashboardRole &&
      (adminAnalyticsLoading || adminActivitiesLoading)) ||
    (staffMember && staffAppointmentsLoading);

  return {
    user,
    store,
    staffMember,
    // Admin specific
    adminData: {
      analytics: adminAnalytics,
      activities: adminActivities,
      error: adminError,
    },
    // Staff specific
    staffData: {
      appointments: staffAppointments,
      stats: staffStats,
    },
    isLoading,
  };
}
