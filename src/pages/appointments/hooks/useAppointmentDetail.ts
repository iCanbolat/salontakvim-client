/**
 * useAppointmentDetail Hook
 * Fetches appointment details and related feedback for the detail page.
 */

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appointmentService, storeService } from "@/services";
import type { Appointment } from "@/types";

export function useAppointmentDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  const {
    data: appointment,
    isLoading: appointmentLoading,
    error: appointmentError,
  } = useQuery<Appointment>({
    queryKey: ["appointment", store?.id, appointmentId],
    queryFn: () => appointmentService.getAppointment(store!.id, appointmentId!),
    enabled: !!store?.id && !!appointmentId,
  });

  const feedback = appointment?.feedback;

  const isLoading = storeLoading || appointmentLoading;

  return {
    store,
    appointment,
    feedback,
    isLoading,
    appointmentError,
    feedbackError: null,
    feedbackLoading: false,
    appointmentId,
    canShowFeedback: appointment?.status === "completed" && !!feedback,
  };
}
