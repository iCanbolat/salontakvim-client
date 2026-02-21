/**
 * Appointment Detail Page
 */

import { useState, useEffect, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { AppointmentDetailHeader } from "./components/AppointmentDetailHeader";
import { AppointmentSummaryCard } from "./components/AppointmentSummaryCard";
import { AppointmentFeedbackCard } from "./components/AppointmentFeedbackCard";
import { AppointmentFileUploadCard } from "./components/AppointmentFileUploadCard";
import { AppointmentCancellationCard } from "./components/AppointmentCancellationCard";
import { AppointmentFormDialog } from "./components/AppointmentFormDialog";
import { AppointmentStatusDialog } from "./components/AppointmentStatusDialog";
import { AppointmentSettlePaymentDialog } from "./components/AppointmentSettlePaymentDialog";
import { useAppointmentDetail } from "./hooks/useAppointmentDetail";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import {
  appointmentService,
  staffService,
  serviceService,
  locationService,
} from "@/services";
import { invalidateAfterAppointmentChange } from "@/lib/invalidate";
import { toast } from "sonner";
import { RecentActivityList } from "../../components/common/RecentActivityList";

export function AppointmentDetailPage() {
  const {
    appointment,
    store,
    isLoading,
    appointmentError,
    feedbackError,
    feedbackLoading,
    feedback,
    canShowFeedback,
    appointmentId,
  } = useAppointmentDetail();

  const { setBreadcrumbLabel, clearBreadcrumbLabel } = useBreadcrumb();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isSettlePaymentDialogOpen, setIsSettlePaymentDialogOpen] =
    useState(false);

  // Pre-fetch data for edit dialog to prevent UI lag
  const availabilityParams = useMemo(() => {
    if (
      !appointment ||
      !store ||
      !appointment.serviceId ||
      !appointment.staffId
    )
      return null;
    return {
      storeId: store.id,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId,
      date: new Date(appointment.startDateTime).toISOString().split("T")[0],
      excludeAppointmentId: appointment.id,
    };
  }, [appointment, store]);

  useQuery({
    queryKey: [
      "availability",
      availabilityParams?.storeId,
      availabilityParams?.serviceId,
      availabilityParams?.staffId,
      availabilityParams?.date,
      availabilityParams?.excludeAppointmentId,
    ],
    queryFn: () => appointmentService.getAvailability(availabilityParams!),
    enabled: !!availabilityParams,
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: ["staff-by-service", store?.id, appointment?.serviceId],
    queryFn: () =>
      staffService.getStaffMembers(store!.id, {
        includeHidden: false,
        serviceId: appointment?.serviceId || undefined,
      }),
    enabled: !!store?.id && !!appointment?.serviceId,
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: ["services", store?.id],
    queryFn: () => serviceService.getServices(store!.id),
    enabled: !!store?.id,
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: ["locations", store?.id],
    queryFn: () => locationService.getLocations(store!.id),
    enabled: !!store?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Set breadcrumb label
  useEffect(() => {
    if (appointment?.publicNumber) {
      setBreadcrumbLabel(pathname, `Appointment: ${appointment.publicNumber}`);
    }
    return () => {
      clearBreadcrumbLabel(pathname);
    };
  }, [
    appointment?.publicNumber,
    pathname,
    setBreadcrumbLabel,
    clearBreadcrumbLabel,
  ]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () =>
      appointmentService.deleteAppointment(store!.id, appointmentId!),
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, store!.id);
      toast.success("Appointment deleted successfully");
      navigate(-1);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete appointment");
    },
  });

  const settlePaymentMutation = useMutation({
    mutationFn: (payload: { finalTotalPrice: number; markAsPaid?: boolean }) =>
      appointmentService.settleAppointmentPayment(store!.id, appointmentId!, {
        ...payload,
      }),
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, store!.id);
      toast.success("Payment settled successfully");
      setIsSettlePaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to settle payment");
    },
  });

  const appointmentActivities = appointment?.activities || [];

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this appointment? This action cannot be undone.",
      )
    ) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (appointmentError || !appointment || !store) {
    return (
      <div className="space-y-6">
        <AppointmentDetailHeader
          title="Appointment Details"
          subtitle="Unable to load appointment"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load appointment details. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppointmentDetailHeader
        title="Appointment Details"
        subtitle={`Reference #${appointment.publicNumber}`}
        onEdit={() => setIsEditDialogOpen(true)}
        onChangeStatus={() => setIsStatusDialogOpen(true)}
        onSettlePayment={
          appointment.status === "confirmed" ||
          appointment.status === "completed"
            ? () => setIsSettlePaymentDialogOpen(true)
            : undefined
        }
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      <AppointmentSummaryCard appointment={appointment} />

      {appointment.status === "completed" && canShowFeedback && feedback && (
        <AppointmentFeedbackCard feedback={feedback} />
      )}

      {(appointment.status === "confirmed" ||
        appointment.status === "completed") && (
        <AppointmentFileUploadCard
          storeId={store.id}
          customerId={appointment.customerId}
          appointmentId={appointment.id}
          isReadOnly={appointment.status === "completed"}
          files={appointment.files}
        />
      )}

      <RecentActivityList
        activities={appointmentActivities}
        title="Randevu Geçmişi"
        emptyMessage="Henüz bu randevu için bir aktivite bulunmuyor."
        showViewAll={false}
      />

      {appointment.status === "cancelled" && (
        <AppointmentCancellationCard appointment={appointment} />
      )}

      {feedbackError && !feedbackLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Feedback could not be loaded. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Dialogs */}
      {isEditDialogOpen && (
        <AppointmentFormDialog
          storeId={store.id}
          appointment={appointment}
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}

      {isStatusDialogOpen && (
        <AppointmentStatusDialog
          appointment={appointment}
          open={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
        />
      )}

      {isSettlePaymentDialogOpen && (
        <AppointmentSettlePaymentDialog
          appointment={appointment}
          open={isSettlePaymentDialogOpen}
          onOpenChange={setIsSettlePaymentDialogOpen}
          onSettle={(data) => settlePaymentMutation.mutate(data)}
          isPending={settlePaymentMutation.isPending}
        />
      )}
    </div>
  );
}
