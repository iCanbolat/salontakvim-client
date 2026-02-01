/**
 * Appointments List Page
 * Displays and manages all appointments using a unified hook for state and data fetching.
 */

import {
  Plus,
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
  X,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PageView } from "@/components/common/page-view";
import { cn } from "@/lib/utils";

import {
  useAppointments,
  type AppointmentFilter,
} from "./hooks/useAppointments";
import {
  AppointmentCard,
  AppointmentFormDialog,
  AppointmentStatusDialog,
  AppointmentsCalendar,
  AppointmentsListTable,
} from "./components";
import type { Appointment } from "@/types";

export function AppointmentsList() {
  const { user, store, state, data, derived, actions } = useAppointments();

  const {
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
  } = state;

  const {
    appointments,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    staffOptions,
    isInitialLoading,
    error,
    staffOptionsLoading,
  } = data;

  const { staffFilterLabel, filterTabs } = derived;

  const {
    setIsCreateDialogOpen,
    setStatusUpdateAppointment,
    setSearchTerm,
    setView,
    setPendingDateRange,
    handleEdit,
    handleCloseDialog,
    handlePageChange,
    handleApplyDateRange,
    handleClearDateRange,
    handleDatePopoverChange,
    handleStaffPopoverChange,
    handleToggleStaff,
    handleClearStaffSelection,
  } = actions;

  // Empty state messages
  const emptyTitle = searchTerm
    ? `No appointments matching "${searchTerm}"`
    : activeTab !== "all"
      ? `No appointments with status "${activeTab}"`
      : "No appointments";

  const emptyDescription = searchTerm
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

      {/* Appointments List with PageView */}
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
        onFilterChange={actions.setActiveTab}
        // Grid View
        renderGridItem={(appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            storeId={store.id}
            onEdit={handleEdit}
            onChangeStatus={setStatusUpdateAppointment}
            role={user?.role as any}
          />
        )}
        // Table View
        renderTableView={(data) => (
          <AppointmentsListTable
            appointments={data}
            onEdit={handleEdit}
            onRowClick={actions.handleViewDetail}
          />
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
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            {user?.role === "admin" && (
              <Popover
                open={isStaffPopoverOpen}
                onOpenChange={handleStaffPopoverChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedStaffIds.length ? "secondary" : "outline"}
                    size="lg"
                    className="justify-start gap-2 text-left font-normal"
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span className="truncate">{staffFilterLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="end">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">Filter by staff</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearStaffSelection}
                      disabled={!selectedStaffIds.length}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-3 space-y-2">
                    {staffOptionsLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading staff...
                      </div>
                    )}
                    {!staffOptionsLoading && staffOptions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No staff members found.
                      </p>
                    )}
                    {!staffOptionsLoading &&
                      staffOptions.map((staff) => {
                        const name =
                          staff.fullName ||
                          [staff.firstName, staff.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          "Staff";
                        const isChecked = selectedStaffIds.includes(staff.id);
                        return (
                          <label
                            key={staff.id}
                            className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleToggleStaff(staff.id, checked === true)
                              }
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {name}
                              </span>
                              {staff.title && (
                                <span className="text-xs text-muted-foreground">
                                  {staff.title}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </PopoverContent>
              </Popover>
            )}

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
                      : "w-full md:w-60",
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
