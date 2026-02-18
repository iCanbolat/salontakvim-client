/**
 * Appointment Detail Page
 */

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AppointmentDetailHeader } from "./components/AppointmentDetailHeader";
import { AppointmentSummaryCard } from "./components/AppointmentSummaryCard";
import { AppointmentFeedbackCard } from "./components/AppointmentFeedbackCard";
import { AppointmentFileUploadCard } from "./components/AppointmentFileUploadCard";
import { AppointmentCancellationCard } from "./components/AppointmentCancellationCard";
import { AppointmentFormDialog } from "./components/AppointmentFormDialog";
import { AppointmentStatusDialog } from "./components/AppointmentStatusDialog";
import { useAppointmentDetail } from "./hooks/useAppointmentDetail";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { appointmentService } from "@/services";
import { invalidateAfterAppointmentChange } from "@/lib/invalidate";
import { toast } from "sonner";

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
    mutationFn: (payload: {
      finalTotalPrice: number;
      paymentMethod?: "cash" | "card" | "online" | "stripe" | "paypal";
      markAsPaid?: boolean;
      internalNotes?: string;
    }) =>
      appointmentService.settleAppointmentPayment(store!.id, appointmentId!, {
        ...payload,
      }),
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, store!.id);
      toast.success("Payment settled successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to settle payment");
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this appointment? This action cannot be undone.",
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const handleSettlePayment = () => {
    if (!appointment) {
      return;
    }

    const initialTotal = String(appointment.totalPrice || "0");
    const finalAmountInput = window.prompt(
      "Final total amount for this appointment:",
      initialTotal,
    );

    if (!finalAmountInput) {
      return;
    }

    const finalTotalPrice = Number(finalAmountInput);
    if (!Number.isFinite(finalTotalPrice) || finalTotalPrice < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const methodInput = window
      .prompt(
        "Payment method (cash/card/online/stripe/paypal):",
        appointment.paymentMethod || "cash",
      )
      ?.trim()
      .toLowerCase();

    const allowedMethods = ["cash", "card", "online", "stripe", "paypal"];
    const paymentMethod = allowedMethods.includes(methodInput || "")
      ? (methodInput as "cash" | "card" | "online" | "stripe" | "paypal")
      : undefined;

    settlePaymentMutation.mutate({
      finalTotalPrice,
      paymentMethod,
      markAsPaid: true,
    });
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
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      <AppointmentSummaryCard appointment={appointment} />

      {(appointment.status === "confirmed" ||
        appointment.status === "completed") && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleSettlePayment}
            disabled={settlePaymentMutation.isPending}
          >
            {settlePaymentMutation.isPending ? "Updating..." : "Settle Payment"}
          </Button>
        </div>
      )}

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
    </div>
  );
}
