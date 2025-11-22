/**
 * Appointment Status Update Dialog
 * Allows changing appointment status with optional cancellation reason
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
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
}[] = [
  {
    value: "pending",
    label: "Beklemede",
    icon: Clock,
    description: "Randevu onay bekliyor",
  },
  {
    value: "confirmed",
    label: "Onaylandı",
    icon: CheckCircle2,
    description: "Randevu onaylandı",
  },
  {
    value: "completed",
    label: "Tamamlandı",
    icon: CheckCircle2,
    description: "Randevu başarıyla tamamlandı",
  },
  {
    value: "cancelled",
    label: "İptal Edildi",
    icon: XCircle,
    description: "Randevu iptal edildi",
  },
  {
    value: "no_show",
    label: "Gelmedi",
    icon: UserX,
    description: "Müşteri randevuya gelmedi",
  },
];

export function AppointmentStatusDialog({
  appointment,
  open,
  onOpenChange,
}: AppointmentStatusDialogProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(
    appointment.status
  );
  const [cancellationReason, setCancellationReason] = useState("");
  const [internalNotes, setInternalNotes] = useState(
    appointment.internalNotes || ""
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
        data
      );
    },
    onSuccess: () => {
      invalidateAfterAppointmentChange(queryClient, appointment.storeId);
      toast.success("Randevu durumu güncellendi");
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

  const currentStatusOption = STATUS_OPTIONS.find(
    (opt) => opt.value === appointment.status
  );
  const selectedStatusOption = STATUS_OPTIONS.find(
    (opt) => opt.value === selectedStatus
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Randevu Durumunu Güncelle</DialogTitle>
          <DialogDescription>
            Randevu #{appointment.id} için yeni durum seçin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {currentStatusOption && (
              <>
                <currentStatusOption.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Mevcut Durum</p>
                  <p className="text-sm text-muted-foreground">
                    {currentStatusOption.label}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Yeni Durum</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setSelectedStatus(value as AppointmentStatus)
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">
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
            />
            <p className="text-xs text-muted-foreground text-right">
              {internalNotes.length}/1000
            </p>
          </div>

          {/* Status Change Preview */}
          {selectedStatus !== appointment.status && selectedStatusOption && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    Durum değiştirilecek
                  </p>
                  <p className="text-blue-700 mt-1">
                    <span className="font-medium">
                      {currentStatusOption?.label}
                    </span>
                    {" → "}
                    <span className="font-medium">
                      {selectedStatusOption.label}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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
}
