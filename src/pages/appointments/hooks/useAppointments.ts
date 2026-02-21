import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { DateRange } from "react-day-picker";
import { useDebouncedSearch, useMediaQuery, useCurrentStore } from "@/hooks";
import { appointmentService, staffService } from "@/services";
import { useNotifications, useAuth } from "@/contexts";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentStatusCounts,
  PaginatedAppointmentsResponse,
} from "@/types";

export type AppointmentFilter = AppointmentStatus | "all";

export function useAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { latestNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [statusUpdateAppointment, setStatusUpdateAppointment] =
    useState<Appointment | null>(null);

  // Filter State (formerly in Zustand)
  const [activeTab, setActiveTab] = useState<AppointmentFilter>("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pendingDateRange, setPendingDateRange] = useState<
    DateRange | undefined
  >(undefined);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const toggleStaffSelection = useCallback(
    (staffId: string, checked: boolean) => {
      setSelectedStaffIds((prev) =>
        checked
          ? prev.includes(staffId)
            ? prev
            : [...prev, staffId]
          : prev.filter((id) => id !== staffId),
      );
    },
    [],
  );

  const clearStaffSelection = useCallback(() => {
    setSelectedStaffIds([]);
  }, []);

  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isStaffPopoverOpen, setIsStaffPopoverOpen] = useState(false);
  const [urlSearchOverride, setUrlSearchOverride] = useState<string | null>(
    null,
  );
  const skipSearchParamSync = useRef(false);

  const isMobile = useMediaQuery("(max-width: 767px)");
  const itemsPerPage = 8;
  const debouncedSearch = useDebouncedSearch(searchTerm, {
    minLength: 2,
    delay: 400,
  });
  const searchFilter = (urlSearchOverride ?? debouncedSearch) || undefined;

  const { store, isLoading: storeLoading } = useCurrentStore();

  // Fetch staff member record if user is staff
  const { data: staffMember, isLoading: staffLoading } = useQuery({
    queryKey: ["my-staff-member", store?.id, user?.id],
    queryFn: async () => {
      const staffMembers = await staffService.getStaffMembers(store!.id);
      return staffMembers.find((s) => s.userId === user?.id);
    },
    enabled: !!store?.id && user?.role === "staff",
  });

  // Fetch staff options for admin filter
  const { data: staffOptions = [], isLoading: staffOptionsLoading } = useQuery({
    queryKey: ["staff-members", store?.id],
    queryFn: () =>
      staffService.getStaffMembers(store!.id, {
        includeHidden: true,
      }),
    enabled: !!store?.id && user?.role === "admin",
  });

  // Sync with search params
  useEffect(() => {
    if (skipSearchParamSync.current) {
      skipSearchParamSync.current = false;
      return;
    }

    // Status sync
    const initialStatus = searchParams.get("status") as AppointmentFilter;
    if (initialStatus && initialStatus !== activeTab) {
      setActiveTab(initialStatus);
    }

    // Search sync
    const initialSearch = searchParams.get("search");
    const normalizedSearch = initialSearch?.trim() ?? "";

    if (normalizedSearch !== searchTerm) {
      setSearchTerm(normalizedSearch);
      setUrlSearchOverride(normalizedSearch || null);
    }

    // Date sync
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (startDateParam || endDateParam) {
      const from = startDateParam
        ? new Date(`${startDateParam}T00:00:00`)
        : undefined;
      const to = endDateParam
        ? new Date(`${endDateParam}T00:00:00`)
        : undefined;

      if (from && !Number.isNaN(from.getTime())) {
        const hasRangeChanged =
          from.getTime() !== dateRange?.from?.getTime() ||
          (to && to.getTime() !== dateRange?.to?.getTime());

        if (hasRangeChanged) {
          setDateRange({
            from,
            to: to ?? from,
          });
        }
      }
    } else if (dateRange) {
      setDateRange(undefined);
    }

    // Staff sync
    const staffIdsParam = searchParams.get("staffIds");
    const nextStaffIds = staffIdsParam ? staffIdsParam.split(",") : [];
    if (JSON.stringify(nextStaffIds) !== JSON.stringify(selectedStaffIds)) {
      setSelectedStaffIds(nextStaffIds);
    }
  }, [searchParams]);

  const handleStatusChange = useCallback(
    (status: AppointmentFilter) => {
      skipSearchParamSync.current = true;
      setActiveTab(status);

      const nextParams = new URLSearchParams(searchParams);
      if (status !== "all") {
        nextParams.set("status", status);
      } else {
        nextParams.delete("status");
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams, setActiveTab],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      skipSearchParamSync.current = true;
      setUrlSearchOverride(null);
      setSearchTerm(value);

      const normalized = value.trim();
      const nextParams = new URLSearchParams(searchParams);

      if (normalized) {
        nextParams.set("search", normalized);
      } else {
        nextParams.delete("search");
      }

      const nextSearch = nextParams.toString();
      const prevSearch = searchParams.toString();

      if (nextSearch !== prevSearch) {
        setSearchParams(nextParams, { replace: true });
      }
    },
    [searchParams, setSearchParams, setSearchTerm],
  );

  const statusFilter = activeTab === "all" ? undefined : activeTab;

  // Fetch appointments
  const {
    data: appointmentsData,
    isPending,
    error,
  } = useQuery<PaginatedAppointmentsResponse>({
    queryKey: [
      "appointments",
      store?.id,
      page,
      statusFilter,
      searchFilter,
      dateRange?.from,
      dateRange?.to,
      selectedStaffIds,
      staffMember?.id,
    ],
    queryFn: () =>
      appointmentService.getAppointments(store!.id, {
        page,
        limit: itemsPerPage,
        status: statusFilter,
        search: searchFilter,
        startDate: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        staffId: user?.role === "staff" ? staffMember?.id : undefined,
        staffIds:
          user?.role === "admin" && selectedStaffIds.length > 0
            ? selectedStaffIds
            : undefined,
      }),
    enabled: !!store?.id && (user?.role !== "staff" || !!staffMember),
    placeholderData: keepPreviousData,
  });

  // Handle real-time updates via notifications
  useEffect(() => {
    if (!store?.id || !latestNotification) {
      return;
    }

    const shouldRefresh =
      latestNotification.storeId === store.id &&
      [
        "appointment_created",
        "appointment_cancelled",
        "appointment_status_changed",
      ].includes(latestNotification.type);

    if (shouldRefresh) {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  }, [
    latestNotification?.id,
    latestNotification?.type,
    latestNotification?.storeId,
    store?.id,
    queryClient,
  ]);

  // Reset page on filter change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [activeTab, searchFilter, dateRange, selectedStaffIds, page, setPage]);

  // Handlers
  const handleEdit = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
  }, []);

  const handleViewDetail = useCallback(
    (appointment: Appointment) => {
      navigate(`/${user?.role}/appointments/${appointment.id}`);
    },
    [navigate, user?.role],
  );

  const handleCloseDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setEditingAppointment(null);
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setPage],
  );

  const handleApplyDateRange = useCallback(() => {
    skipSearchParamSync.current = true;
    setDateRange(pendingDateRange);
    setIsDatePopoverOpen(false);

    const nextParams = new URLSearchParams(searchParams);
    if (pendingDateRange?.from) {
      nextParams.set("startDate", format(pendingDateRange.from, "yyyy-MM-dd"));
    } else {
      nextParams.delete("startDate");
    }

    if (pendingDateRange?.to) {
      nextParams.set("endDate", format(pendingDateRange.to, "yyyy-MM-dd"));
    } else {
      nextParams.delete("endDate");
    }

    setSearchParams(nextParams, { replace: true });
  }, [pendingDateRange, searchParams, setSearchParams, setDateRange]);

  const handleClearDateRange = useCallback(() => {
    skipSearchParamSync.current = true;
    setDateRange(undefined);
    setPendingDateRange(undefined);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("startDate");
    nextParams.delete("endDate");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, setDateRange, setPendingDateRange]);

  const handleDatePopoverChange = useCallback(
    (open: boolean) => {
      setIsDatePopoverOpen(open);
      if (open) {
        setPendingDateRange(dateRange);
      } else {
        setPendingDateRange(undefined);
      }
    },
    [dateRange, setPendingDateRange],
  );

  const handleStaffPopoverChange = useCallback((open: boolean) => {
    setIsStaffPopoverOpen(open);
  }, []);

  const handleToggleStaff = useCallback(
    (staffId: string, checked: boolean) => {
      skipSearchParamSync.current = true;

      // Calculate new selection to sync with URL
      const nextSelection = checked
        ? selectedStaffIds.includes(staffId)
          ? selectedStaffIds
          : [...selectedStaffIds, staffId]
        : selectedStaffIds.filter((id) => id !== staffId);

      toggleStaffSelection(staffId, checked);

      const nextParams = new URLSearchParams(searchParams);
      if (nextSelection.length > 0) {
        nextParams.set("staffIds", nextSelection.join(","));
      } else {
        nextParams.delete("staffIds");
      }
      setSearchParams(nextParams, { replace: true });
    },
    [selectedStaffIds, toggleStaffSelection, searchParams, setSearchParams],
  );

  const handleClearStaffSelection = useCallback(() => {
    skipSearchParamSync.current = true;
    clearStaffSelection();

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("staffIds");
    setSearchParams(nextParams, { replace: true });
  }, [clearStaffSelection, searchParams, setSearchParams]);

  // Derived Values
  const defaultStatusCounts: AppointmentStatusCounts = {
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    expired: 0,
  };

  const appointments: Appointment[] = appointmentsData?.data ?? [];
  const statusCounts = appointmentsData?.statusCounts ?? defaultStatusCounts;
  const totalItems = appointmentsData?.total ?? 0;
  const totalPages = appointmentsData?.totalPages ?? 1;
  const startIndex = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(page * itemsPerPage, totalItems);

  const isInitialLoading =
    (storeLoading || staffLoading || isPending) && !appointmentsData;

  const staffFilterLabel = useMemo(() => {
    if (!selectedStaffIds.length) return "All staff";
    if (selectedStaffIds.length === 1) {
      const staff = staffOptions.find((s) => s.id === selectedStaffIds[0]);
      return (
        staff?.fullName ||
        [staff?.firstName, staff?.lastName].filter(Boolean).join(" ") ||
        "Staff"
      );
    }
    return `${selectedStaffIds.length} staff selected`;
  }, [selectedStaffIds, staffOptions]);

  const filterTabs: {
    value: AppointmentFilter;
    label: string;
    count: number;
  }[] = useMemo(
    () => [
      { value: "all", label: "All", count: statusCounts.all },
      { value: "pending", label: "Pending", count: statusCounts.pending },
      { value: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
      { value: "completed", label: "Completed", count: statusCounts.completed },
      { value: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
      { value: "no_show", label: "No Show", count: statusCounts.no_show },
      { value: "expired", label: "Expired", count: statusCounts.expired },
    ],
    [statusCounts],
  );

  return {
    user,
    store,
    state: {
      isCreateDialogOpen,
      editingAppointment,
      statusUpdateAppointment,
      activeTab,
      page,
      searchTerm,
      dateRange,
      pendingDateRange,
      isDatePopoverOpen,
      isStaffPopoverOpen,
      selectedStaffIds,
      isMobile,
    },
    data: {
      appointments,
      statusCounts,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      staffOptions,
      isInitialLoading,
      error,
      staffOptionsLoading,
    },
    derived: {
      staffFilterLabel,
      filterTabs,
    },
    actions: {
      setIsCreateDialogOpen,
      setEditingAppointment,
      setStatusUpdateAppointment,
      setActiveTab: handleStatusChange,
      setSearchTerm: handleSearchChange,
      setPage,
      setPendingDateRange,
      setIsDatePopoverOpen,
      setIsStaffPopoverOpen,
      handleEdit,
      handleViewDetail,
      handleCloseDialog,
      handlePageChange,
      handleApplyDateRange,
      handleClearDateRange,
      handleDatePopoverChange,
      handleStaffPopoverChange,
      handleToggleStaff,
      handleClearStaffSelection,
    },
  };
}
