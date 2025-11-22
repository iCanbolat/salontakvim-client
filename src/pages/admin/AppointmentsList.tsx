/**
 * Appointments List Page
 * Displays and manages all appointments
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, AlertCircle, Calendar } from "lucide-react";
import { useRequireRole, usePagination } from "@/hooks";
import { storeService, appointmentService } from "@/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { AppointmentStatusDialog } from "@/components/appointments/AppointmentStatusDialog";
import { PaginationControls } from "@/components/ui/PaginationControls";
import type { Appointment, AppointmentStatus } from "@/types";

export function AppointmentsList() {
  useRequireRole("admin");
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [statusUpdateAppointment, setStatusUpdateAppointment] =
    useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | "all">("all");

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch appointments
  const {
    data: appointments,
    isLoading: appointmentsLoading,
    error,
  } = useQuery({
    queryKey: ["appointments", store?.id],
    queryFn: () => appointmentService.getAppointments(store!.id),
    enabled: !!store?.id,
  });

  const isLoading = storeLoading || appointmentsLoading;

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingAppointment(null);
  };

  // Filter appointments by status
  const filteredAppointments =
    activeTab === "all"
      ? appointments
      : appointments?.filter((apt) => apt.status === activeTab);

  // Pagination
  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
  } = usePagination({
    items: filteredAppointments || [],
    itemsPerPage: 12,
  });

  // Count appointments by status
  const statusCounts = {
    all: appointments?.length || 0,
    pending: appointments?.filter((a) => a.status === "pending").length || 0,
    confirmed:
      appointments?.filter((a) => a.status === "confirmed").length || 0,
    completed:
      appointments?.filter((a) => a.status === "completed").length || 0,
    cancelled:
      appointments?.filter((a) => a.status === "cancelled").length || 0,
    no_show: appointments?.filter((a) => a.status === "no_show").length || 0,
  };

  if (isLoading) {
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
            onClick={() => navigate("/admin/appointments/calendar")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Appointments List with Status Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
          <CardDescription>
            {appointments?.length || 0} appointment
            {appointments?.length !== 1 ? "s" : ""} total
          </CardDescription>
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
              {filteredAppointments && filteredAppointments.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedItems.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        storeId={store.id}
                        onEdit={handleEdit}
                        onChangeStatus={setStatusUpdateAppointment}
                      />
                    ))}
                  </div>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    canGoPrevious={canGoPrevious}
                    canGoNext={canGoNext}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    totalItems={filteredAppointments.length}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No appointments{" "}
                    {activeTab !== "all" && `with status "${activeTab}"`}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === "all"
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
