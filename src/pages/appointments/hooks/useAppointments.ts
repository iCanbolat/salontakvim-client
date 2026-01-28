import { useEffect, useMemo, useRef, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useSearchParams } from "react-router-dom";
import { useDebouncedSearch, useMediaQuery } from "@/hooks";
import { storeService, appointmentService, staffService } from "@/services";
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
  const { latestNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [statusUpdateAppointment, setStatusUpdateAppointment] =
    useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentFilter>("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTermState] = useState("");
  const [view, setView] = useState<"grid" | "list" | "calendar">("grid");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pendingDateRange, setPendingDateRange] = useState<
    DateRange | undefined
  >();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isStaffPopoverOpen, setIsStaffPopoverOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
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

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

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

    const initialSearch = searchParams.get("search");
    const normalizedSearch = initialSearch?.trim() ?? "";

    if (normalizedSearch !== searchTerm) {
      setSearchTermState(normalizedSearch);
      setUrlSearchOverride(normalizedSearch || null);
    }
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    if (!startDateParam && !endDateParam) return;

    const from = startDateParam
      ? new Date(`${startDateParam}T00:00:00`)
      : undefined;
    const to = endDateParam ? new Date(`${endDateParam}T00:00:00`) : undefined;

    if (from && Number.isNaN(from.getTime())) return;
    if (to && Number.isNaN(to.getTime())) return;

    setDateRange({
      from,
      to: to ?? from,
    });
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    skipSearchParamSync.current = true;
    setUrlSearchOverride(null);
    setSearchTermState(value);

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
  };

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
    enabled:
      !!store?.id &&
      (user?.role !== "staff" || !!staffMember) &&
      (view !== "calendar" || isMobile),
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
    setPage(1);
  }, [activeTab, searchFilter, dateRange, selectedStaffIds]);

  // Force grid view on mobile
  useEffect(() => {
    if (isMobile && view === "list") {
      setView("grid");
    }
  }, [isMobile, view]);

  // Handlers
  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingAppointment(null);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyDateRange = () => {
    setDateRange(pendingDateRange);
    setIsDatePopoverOpen(false);
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
    setPendingDateRange(undefined);
  };

  const handleDatePopoverChange = (open: boolean) => {
    setIsDatePopoverOpen(open);
    if (open) {
      setPendingDateRange(dateRange);
    } else {
      setPendingDateRange(undefined);
    }
  };

  const handleStaffPopoverChange = (open: boolean) => {
    setIsStaffPopoverOpen(open);
  };

  const handleToggleStaff = (staffId: string, checked: boolean) => {
    setSelectedStaffIds((prev) =>
      checked ? [...prev, staffId] : prev.filter((id) => id !== staffId),
    );
  };

  const handleClearStaffSelection = () => {
    setSelectedStaffIds([]);
  };

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
      view,
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
      setActiveTab,
      setSearchTerm: handleSearchChange,
      setView,
      setPage,
      setPendingDateRange,
      setIsDatePopoverOpen,
      setIsStaffPopoverOpen,
      handleEdit,
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
