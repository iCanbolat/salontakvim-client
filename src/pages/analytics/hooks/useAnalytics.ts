import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store.service";
import { analyticsService } from "@/services/analytics.service";
import { DateRangePreset, type AnalyticsQuery } from "@/types";
import { qk } from "@/lib/query-keys";

export function useAnalytics() {
  const [dateRange, setDateRange] = useState<string>(
    DateRangePreset.LAST_30_DAYS,
  );
  const [activeTab, setActiveTab] = useState("appointments");
  const [isExporting, setIsExporting] = useState(false);

  // Get current store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: qk.currentStore,
    queryFn: storeService.getMyStore,
  });

  const analyticsQuery = useMemo<AnalyticsQuery>(
    () => ({
      dateRange: dateRange as any,
    }),
    [dateRange],
  );

  // Get appointment analytics
  const {
    data: appointmentData,
    isLoading: appointmentLoading,
    error: appointmentError,
  } = useQuery({
    queryKey: qk.appointmentAnalytics(store?.id, dateRange),
    queryFn: () =>
      analyticsService.getAppointmentAnalytics(store!.id, analyticsQuery),
    enabled: !!store?.id,
  });

  // Get revenue analytics
  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
  } = useQuery({
    queryKey: qk.revenueAnalytics(store?.id, dateRange),
    queryFn: () =>
      analyticsService.getRevenueAnalytics(store!.id, analyticsQuery),
    enabled: !!store?.id,
  });

  const handleExport = async () => {
    if (!store?.id) return;

    setIsExporting(true);
    try {
      const blob = await analyticsService.exportToExcel(
        store.id,
        analyticsQuery,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export analytics:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = storeLoading || appointmentLoading || revenueLoading;
  const error = appointmentError || revenueError;

  // Prepare chart data
  const appointmentsByDate = useMemo(
    () =>
      appointmentData?.byDate.map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count: item.count,
        revenue: parseFloat(item.revenue),
      })) || [],
    [appointmentData?.byDate],
  );

  const appointmentsByStatus = useMemo(
    () =>
      appointmentData?.byStatus.map((item) => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        value: item.count,
        percentage: item.percentage,
      })) || [],
    [appointmentData?.byStatus],
  );

  const appointmentsByService = useMemo(
    () =>
      appointmentData?.byService.slice(0, 10).map((item) => ({
        name: item.serviceName,
        count: item.count,
        revenue: parseFloat(item.revenue),
      })) || [],
    [appointmentData?.byService],
  );

  const revenueByDate = useMemo(
    () =>
      revenueData?.byDate.map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: parseFloat(item.revenue),
        appointments: item.appointmentCount,
      })) || [],
    [revenueData?.byDate],
  );

  const revenueByService = useMemo(
    () =>
      revenueData?.byService.slice(0, 10).map((item) => ({
        name: item.serviceName,
        revenue: parseFloat(item.revenue),
        percentage: item.percentage,
      })) || [],
    [revenueData?.byService],
  );

  return {
    state: {
      dateRange,
      activeTab,
      isExporting,
      isLoading,
      error,
    },
    actions: {
      setDateRange,
      setActiveTab,
      handleExport,
    },
    data: {
      store,
      appointmentData,
      revenueData,
      appointmentsByDate,
      appointmentsByStatus,
      appointmentsByService,
      revenueByDate,
      revenueByService,
    },
  };
}
