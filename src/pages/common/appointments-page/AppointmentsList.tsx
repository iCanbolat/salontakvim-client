/**
 * Appointments List Page
 * Displays and manages all appointments
 */

import { useEffect, useState, useMemo } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useSearchParams } from "react-router-dom";
import { useDebouncedSearch, useMediaQuery } from "@/hooks";
import { storeService, appointmentService, staffService } from "@/services";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { AppointmentStatusDialog } from "@/components/appointments/AppointmentStatusDialog";
import { AppointmentsCalendar } from "@/components/appointments/AppointmentsCalendar";
import { PageView } from "@/components/common/page-view";
import type { FilterTab } from "@/components/common/page-view";
import { AppointmentsListTable } from "./AppointmentsListTable";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentStatusCounts,
  PaginatedAppointmentsResponse,
} from "@/types";
import { useNotifications, useAuth } from "@/contexts";
import { cn } from "@/lib/utils";

type AppointmentFilter = AppointmentStatus | "all";

export function AppointmentsList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { latestNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [statusUpdateAppointment, setStatusUpdateAppointment] =
    useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentFilter>("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list" | "calendar">("grid");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pendingDateRange, setPendingDateRange] = useState<
    DateRange | undefined
  >();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const itemsPerPage = 8;
  const debouncedSearch = useDebouncedSearch(searchTerm, {
    minLength: 2,
    delay: 400,
  });

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

  // If navigated with startDate/endDate query params, initialize date filter.
  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch && initialSearch !== searchTerm) {
      setSearchTerm(initialSearch);
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

  // Keep URL in sync with search text so deep links / notifications can prefill
  useEffect(() => {
    const current = new URLSearchParams(searchParams);
    if (searchTerm) {
      current.set("search", searchTerm);
    } else {
      current.delete("search");
    }
    const nextSearch = current.toString();
    const prevSearch = searchParams.toString();

    if (nextSearch !== prevSearch) {
      setSearchParams(current, { replace: true });
    }
  }, [searchTerm, setSearchParams, searchParams]);

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
      debouncedSearch,
      dateRange?.from,
      dateRange?.to,
      staffMember?.id,
    ],
    queryFn: () =>
      appointmentService.getAppointments(store!.id, {
        page,
        limit: itemsPerPage,
        status: statusFilter,
        search: debouncedSearch || undefined,
        startDate: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        staffId: user?.role === "staff" ? staffMember?.id : undefined,
      }),
    enabled:
      !!store?.id &&
      (user?.role !== "staff" || !!staffMember) &&
      (view !== "calendar" || isMobile),
    placeholderData: keepPreviousData,
  });

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

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, dateRange]);

  // Force grid view on screens smaller than xl if currently in list view
  useEffect(() => {
    if (isMobile && view === "list") {
      setView("grid");
    }
  }, [isMobile, view]);

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingAppointment(null);
  };

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

  // Filter tabs configuration
  const filterTabs: FilterTab<AppointmentFilter>[] = useMemo(
    () => [
      { value: "all", label: "All", count: statusCounts.all },
      { value: "pending", label: "Pending", count: statusCounts.pending },
      { value: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
      { value: "completed", label: "Completed", count: statusCounts.completed },
      { value: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
      { value: "no_show", label: "No Show", count: statusCounts.no_show },
      { value: "expired", label: "Expired", count: statusCounts.expired },
    ],
    [statusCounts]
  );

  // Empty state message
  const emptyTitle = debouncedSearch
    ? `No appointments matching "${debouncedSearch}"`
    : activeTab !== "all"
    ? `No appointments with status "${activeTab}"`
    : "No appointments";

  const emptyDescription = debouncedSearch
    ? "Try adjusting your search keywords or filters"
    : activeTab === "all"
    ? "Create your first appointment to get started"
    : "No appointments match this status filter";

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage customer appointments and bookings
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load appointments. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col text-center sm:text-start md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage customer appointments and bookings
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => setView(view === "calendar" ? "grid" : "calendar")}
            className="hidden md:flex"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {view === "calendar" ? "List View" : "Calendar View"}
          </Button>
          {user?.role === "admin" && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Calendar View - Tablet and up only */}
      {!isMobile && view === "calendar" && (
        <div className="hidden md:block">
          <AppointmentsCalendar storeId={store.id} />
        </div>
      )}

      {/* Appointments List with Status Tabs */}
      <PageView<Appointment, AppointmentFilter>
        data={appointments}
        // Search
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search..."
        // View Toggle
        view={view === "calendar" ? "grid" : view}
        onViewChange={(next) => setView(next)}
        // Filter Tabs
        filterTabs={filterTabs}
        activeFilter={activeTab}
        onFilterChange={setActiveTab}
        // Grid View
        renderGridItem={(appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            storeId={store.id}
            onEdit={handleEdit}
            onChangeStatus={setStatusUpdateAppointment}
          />
        )}
        // Table View
        renderTableView={(data) => (
          <AppointmentsListTable appointments={data} onEdit={handleEdit} />
        )}
        // Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        // Empty State
        emptyIcon={<CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={
          activeTab === "all" &&
          user?.role === "admin" && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          )
        }
        headerActions={
          <div className="flex w-full md:w-auto">
            <Popover
              open={isDatePopoverOpen}
              onOpenChange={handleDatePopoverChange}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={dateRange?.from ? "secondary" : "outline"}
                  size="lg"
                  className={cn(
                    "justify-start gap-2 text-left font-normal relative",
                    dateRange?.from
                      ? "w-full md:w-[calc(15rem-2.25rem)] border"
                      : "w-full md:w-60"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                  {dateRange?.from && (
                    <Button
                      variant={dateRange?.from ? "secondary" : "ghost"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearDateRange();
                      }}
                      className="absolute right-1 top-1 border-none border-b w-7 h-7 hover:bg-primary/50 rounded-4xl focus:ring-0"
                    >
                      <X />
                    </Button>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={(pendingDateRange ?? dateRange)?.from}
                  selected={pendingDateRange ?? dateRange}
                  onSelect={setPendingDateRange}
                />
                <div className="flex items-center gap-2 border-t p-3">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleApplyDateRange}
                    disabled={!pendingDateRange?.from && !dateRange?.from}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
        // Card wrapper
        cardClassName={cn(view === "calendar" ? "block md:hidden" : "block")}
      />

      {/* Create/Edit Dialog */}
      <AppointmentFormDialog
        storeId={store.id}
        appointment={editingAppointment}
        open={isCreateDialogOpen || !!editingAppointment}
        onClose={handleCloseDialog}
      />

      {/* Status Update Dialog */}
      {statusUpdateAppointment && (
        <AppointmentStatusDialog
          appointment={statusUpdateAppointment}
          open={!!statusUpdateAppointment}
          onOpenChange={(open) => !open && setStatusUpdateAppointment(null)}
        />
      )}
    </div>
  );
}
