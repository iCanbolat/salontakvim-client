/**
 * Appointment Status Update Dialog
 * Allows changing appointment status with optional cancellation reason
 */

import { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { appointmentService } from "@/services";
import { formatAppointmentNumber } from "@/utils/appointment.utils";
import { useCurrentStore } from "@/hooks/useCurrentStore";
import type { Appointment, AppointmentStatus } from "@/types";
import { CheckCircle2, Clock, XCircle, UserX, AlertCircle } from "lucide-react";
import { invalidateAfterAppointmentChange } from "@/lib/invalidate";

interface AppointmentStatusDialogProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: {
  value: AppointmentStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  colorClass: string;
  iconClass: string;
}[] = [
  {
    value: "pending",
    label: "Beklemede",
    icon: Clock,
    description: "Randevu onay bekliyor",
    colorClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
    iconClass: "text-yellow-600",
  },
  {
    value: "confirmed",
    label: "Onaylandı",
    icon: CheckCircle2,
    description: "Randevu onaylandı",
    colorClass: "bg-blue-100 text-blue-800 border-blue-300",
    iconClass: "text-blue-600",
  },
  {
    value: "cancelled",
    label: "İptal Edildi",
    icon: XCircle,
    description: "Randevu iptal edildi",
    colorClass: "bg-red-100 text-red-800 border-red-300",
    iconClass: "text-red-600",
  },
  {
    value: "no_show",
    label: "Gelmedi",
    icon: UserX,
    description: "Müşteri randevuya gelmedi",
    colorClass: "bg-gray-100 text-gray-800 border-gray-300",
    iconClass: "text-gray-600",
  },
];

export const AppointmentStatusDialog = memo(function AppointmentStatusDialog({
  appointment,
  open,
  onOpenChange,
}: AppointmentStatusDialogProps) {
  const { store } = useCurrentStore();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(
    appointment.status,
  );
  const [cancellationReason, setCancellationReason] = useState("");
  const [internalNotes, setInternalNotes] = useState(
    appointment.internalNotes || "",
  );

  const updateStatusMutation = useMutation({
    mutationFn: async (data: {
      status: AppointmentStatus;
      cancellationReason?: string;
      internalNotes?: string;
    }) => {
      return appointmentService.updateAppointmentStatus(
        appointment.storeId,
        appointment.id,
        data,
      );
    },
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, appointment.storeId);
      // toast.success("Randevu durumu güncellendi");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Durum güncellenemedi: " + error.message);
    },
  });

  const handleSubmit = () => {
    const data: {
      status: AppointmentStatus;
      cancellationReason?: string;
      internalNotes?: string;
    } = {
      status: selectedStatus,
    };

    // Add cancellation reason if status is cancelled or no_show
    if (
      (selectedStatus === "cancelled" || selectedStatus === "no_show") &&
      cancellationReason.trim()
    ) {
      data.cancellationReason = cancellationReason.trim();
    }

    // Add internal notes if provided
    if (internalNotes.trim()) {
      data.internalNotes = internalNotes.trim();
    }

    updateStatusMutation.mutate(data);
  };

  const requiresCancellationReason =
    selectedStatus === "cancelled" || selectedStatus === "no_show";
  const isCompleted = appointment.status === "completed";

  const currentStatusOption = STATUS_OPTIONS.find(
    (opt) => opt.value === appointment.status,
  );
  const selectedStatusOption = STATUS_OPTIONS.find(
    (opt) => opt.value === selectedStatus,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Randevu Durumunu Güncelle</DialogTitle>
          <DialogDescription>
            {formatAppointmentNumber(appointment.publicNumber, store?.country)}{" "}
            için yeni durum seçin
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Current Status */}
            {/* <div
              className={`flex items-center gap-3 p-4 border rounded-lg ${
                currentStatusOption?.colorClass || "bg-muted"
              }`}
            >
              {currentStatusOption && (
                <>
                  <currentStatusOption.icon
                    className={`h-6 w-6 ${currentStatusOption.iconClass}`}
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Mevcut Durum
                    </p>
                    <p className="text-lg font-bold">
                      {currentStatusOption.label}
                    </p>
                  </div>
                </>
              )}
            </div> */}

            {/* Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status" className="font-semibold">
                Yeni Durum
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as AppointmentStatus)
                }
                disabled={isCompleted}
              >
                <SelectTrigger className="w-full h-14! font-medium" id="status">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-3 ">
                        <div
                          className={`p-2 rounded-full ${option.colorClass.split(" ")[0]} ${option.iconClass}`}
                        >
                          <option.icon className="h-4 w-4" />
                        </div>
                        <div className="text-start">
                          <p
                            className={`font-bold ${option.colorClass.split(" ")[1]}`}
                          >
                            {option.label}
                          </p>
                          <p className={`text-xs ${option.iconClass}`}>
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cancellation Reason (conditionally shown) */}
            {requiresCancellationReason && (
              <div className="space-y-2">
                <Label
                  htmlFor="cancellation-reason"
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {selectedStatus === "cancelled"
                    ? "İptal Nedeni"
                    : "Gelmeme Nedeni"}
                  <span className="text-xs text-muted-foreground">
                    (Opsiyonel)
                  </span>
                </Label>
                <Textarea
                  id="cancellation-reason"
                  placeholder={
                    selectedStatus === "cancelled"
                      ? "İptal nedenini belirtin..."
                      : "Gelmeme nedenini belirtin..."
                  }
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {cancellationReason.length}/500
                </p>
              </div>
            )}

            {/* Internal Notes */}
            <div className="space-y-2">
              <Label htmlFor="internal-notes">
                Dahili Notlar
                <span className="text-xs text-muted-foreground ml-2">
                  (Opsiyonel)
                </span>
              </Label>
              <Textarea
                id="internal-notes"
                placeholder="Randevu hakkında notlar ekleyin (sadece personel görebilir)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                maxLength={1000}
                disabled={isCompleted}
              />
              <p className="text-xs text-muted-foreground text-right">
                {internalNotes.length}/1000
              </p>
            </div>

            {/* Status Change Preview */}
            {selectedStatus !== appointment.status && selectedStatusOption && (
              <div
                className={`p-4 border rounded-lg transition-all duration-300 ${selectedStatusOption.colorClass}`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 ${selectedStatusOption.iconClass}`}
                  />
                  <div className="text-sm">
                    <p className="font-bold">Durum değiştirilecek</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-white/50 rounded text-xs font-semibold">
                        {currentStatusOption?.label}
                      </span>
                      <span className="font-bold text-lg leading-none">→</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${selectedStatusOption.colorClass}`}
                      >
                        {selectedStatusOption.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isCompleted && (
              <p className="text-xs text-muted-foreground">
                Tamamlanan randevularda durum manuel olarak değiştirilemez.
              </p>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateStatusMutation.isPending}
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isCompleted ||
              updateStatusMutation.isPending ||
              selectedStatus === appointment.status
            }
          >
            {updateStatusMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AppointmentStatusDialog.displayName = "AppointmentStatusDialog";
