/**
 * Appointments List Page
 * Displays and manages all appointments
 */

import { useEffect, useState } from "react";
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
  LayoutGrid,
  List,
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useSearchParams } from "react-router-dom";
import { useDebouncedSearch, useMediaQuery } from "@/hooks";
import { storeService, appointmentService, staffService } from "@/services";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { AppointmentStatusDialog } from "@/components/appointments/AppointmentStatusDialog";
import { AppointmentsCalendar } from "@/components/appointments/AppointmentsCalendar";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { AppointmentsListTable } from "./AppointmentsListTable";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentStatusCounts,
  PaginatedAppointmentsResponse,
} from "@/types";
import { useNotifications, useAuth } from "@/contexts";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<AppointmentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list" | "calendar">("grid");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pendingDateRange, setPendingDateRange] = useState<
    DateRange | undefined
  >();
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");
  // const isXl = useMediaQuery("(min-width: 1280px)");
  const itemsPerPage = 6;
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

  const handleDatePopoverChange = (open: boolean) => {
    setIsDatePopoverOpen(open);
    if (open) {
      setPendingDateRange(dateRange);
    } else {
      setPendingDateRange(undefined);
    }
  };

  const handleApplyDateRange = () => {
    setDateRange(pendingDateRange);
    setIsDatePopoverOpen(false);
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
    setPendingDateRange(undefined);
  };

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
      <div className="flex flex-col md:flex-row items-center justify-between">
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

      {/* Appointments List with Status Tabs - Always visible on mobile */}
      <Card
        className={cn(
          view === "calendar" ? "block md:hidden" : "block",
          view === "list" && "h-full"
        )}
      >
        <CardHeader className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search..."
              className="w-full"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex w-full md:w-auto">
              <Popover
                open={isDatePopoverOpen}
                onOpenChange={handleDatePopoverChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange?.from ? "secondary" : "outline"}
                    size="lg"
                    className={`justify-start gap-2 text-left font-normal relative ${
                      dateRange?.from
                        ? "w-full md:w-[calc(15rem-2.25rem)] border"
                        : "w-full md:w-60"
                    }`}
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
                        onClick={handleClearDateRange}
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
            <div className="hidden md:flex items-center border rounded-md p-1 bg-gray-50">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn(view === "list" && "h-full")}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as AppointmentStatus | "all")}
            className={cn(view === "list" && "h-full")}
          >
            <div className="overflow-x-auto -mx-2 px-2 mb-4">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="all" className="whitespace-nowrap">
                  All ({statusCounts.all})
                </TabsTrigger>
                <TabsTrigger value="pending" className="whitespace-nowrap">
                  Pending ({statusCounts.pending})
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="whitespace-nowrap">
                  Confirmed ({statusCounts.confirmed})
                </TabsTrigger>
                <TabsTrigger value="completed" className="whitespace-nowrap">
                  Completed ({statusCounts.completed})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="whitespace-nowrap">
                  Cancelled ({statusCounts.cancelled})
                </TabsTrigger>
                <TabsTrigger value="no_show" className="whitespace-nowrap">
                  No Show ({statusCounts.no_show})
                </TabsTrigger>
                <TabsTrigger value="expired" className="whitespace-nowrap">
                  Expired ({statusCounts.expired})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value={activeTab}
              className={cn(view === "list" && "h-full")}
            >
              {appointments.length > 0 ? (
                <div
                  className={cn(
                    "flex flex-col",
                    view === "grid" && totalPages > 1 && "min-h-[850px]",
                    view === "list" && "h-full"
                  )}
                >
                  {view === "list" ? (
                    <AppointmentsListTable
                      appointments={appointments}
                      onEdit={handleEdit}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {appointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          storeId={store.id}
                          onEdit={handleEdit}
                          onChangeStatus={setStatusUpdateAppointment}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-auto">
                    <PaginationControls
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      canGoPrevious={page > 1}
                      canGoNext={page < totalPages}
                      startIndex={startIndex}
                      endIndex={endIndex}
                      totalItems={totalItems}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No appointments
                    {debouncedSearch
                      ? ` matching "${debouncedSearch}"`
                      : activeTab !== "all"
                      ? ` with status "${activeTab}"`
                      : ""}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {debouncedSearch
                      ? "Try adjusting your search keywords or filters"
                      : activeTab === "all"
                      ? "Create your first appointment to get started"
                      : "No appointments match this status filter"}
                  </p>
                  {activeTab === "all" && user?.role === "admin" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Appointment
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
