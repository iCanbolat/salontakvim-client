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
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useDebouncedSearch } from "@/hooks";
import { storeService, appointmentService } from "@/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type {
  Appointment,
  AppointmentStatus,
  AppointmentStatusCounts,
  PaginatedAppointmentsResponse,
} from "@/types";
import { useNotifications } from "@/contexts";

export function AppointmentsList() {
  const queryClient = useQueryClient();
  const { latestNotification } = useNotifications();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [statusUpdateAppointment, setStatusUpdateAppointment] =
    useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const itemsPerPage = 6;
  const debouncedSearch = useDebouncedSearch(searchTerm, {
    minLength: 3,
    delay: 400,
  });

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

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
      }),
    enabled: !!store?.id,
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
  };

  const appointments: Appointment[] = appointmentsData?.data ?? [];
  const statusCounts = appointmentsData?.statusCounts ?? defaultStatusCounts;
  const totalItems = appointmentsData?.total ?? 0;
  const totalPages = appointmentsData?.totalPages ?? 1;
  const startIndex = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(page * itemsPerPage, totalItems);

  const isInitialLoading = (storeLoading || isPending) && !appointmentsData;

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
            onClick={() => setView(view === "list" ? "calendar" : "list")}
            className="hidden md:flex"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {view === "list" ? "Calendar View" : "List View"}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Calendar View - Tablet and up only */}
      <div className={view === "calendar" ? "hidden md:block" : "hidden"}>
        <AppointmentsCalendar storeId={store.id} />
      </div>

      {/* Appointments List with Status Tabs - Always visible on mobile */}
      <Card className={view === "calendar" ? "block md:hidden" : "block"}>
        <CardHeader className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search..."
              className="w-full"
            />
          </div>
          <div className="flex w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateRange?.from ? "secondary" : "outline"}
                  size="sm"
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
                      onClick={() => setDateRange(undefined)}
                      className="absolute right-1 top-1 border-none border-b w-6 h-6 "
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as AppointmentStatus | "all")}
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
              </TabsList>
            </div>

            <TabsContent value={activeTab}>
              {appointments.length > 0 ? (
                <div
                  className={`flex flex-col ${
                    totalPages > 1 ? "min-h-[850px]" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  {activeTab === "all" && (
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
