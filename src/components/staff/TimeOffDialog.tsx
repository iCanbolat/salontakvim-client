/**
 * Time Off Dialog Component
 * For creating and editing staff breaks/time off
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { breakService } from "@/services";
import type { StaffBreak, CreateStaffBreakDto } from "@/types";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

interface TimeOffDialogProps {
  storeId: number;
  staffId: number;
  staffName: string;
  timeOff?: StaffBreak | null;
  open: boolean;
  onClose: () => void;
}

export function TimeOffDialog({
  storeId,
  staffId,
  staffName,
  timeOff,
  open,
  onClose,
}: TimeOffDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!timeOff;

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPartialDay, setIsPartialDay] = useState(false);
  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (timeOff) {
      setStartDate(timeOff.startDate);
      setEndDate(timeOff.endDate);
      setStartTime(timeOff.startTime || "");
      setEndTime(timeOff.endTime || "");
      setReason(timeOff.reason || "");
      setIsRecurring(timeOff.isRecurring);
      setIsPartialDay(!!(timeOff.startTime && timeOff.endTime));
    } else {
      // Reset for new entry
      const today = format(new Date(), "yyyy-MM-dd");
      setStartDate(today);
      setEndDate(today);
      setStartTime("");
      setEndTime("");
      setReason("");
      setIsRecurring(false);
      setIsPartialDay(false);
    }
  }, [timeOff, open]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStaffBreakDto) =>
      breakService.createStaffBreak(storeId, staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-breaks", storeId, staffId],
      });
      toast.success("İzin eklendi");
      onClose();
    },
    onError: (error: Error) => {
      toast.error("İzin eklenemedi: " + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateStaffBreakDto) =>
      breakService.updateStaffBreak(storeId, staffId, timeOff!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-breaks", storeId, staffId],
      });
      toast.success("İzin güncellendi");
      onClose();
    },
    onError: (error: Error) => {
      toast.error("İzin güncellenemedi: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!startDate || !endDate) {
      toast.error("Başlangıç ve bitiş tarihi gerekli");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("Bitiş tarihi başlangıç tarihinden önce olamaz");
      return;
    }

    if (isPartialDay && (!startTime || !endTime)) {
      toast.error("Kısmi gün izni için saat bilgisi gerekli");
      return;
    }

    const data: CreateStaffBreakDto = {
      startDate,
      endDate,
      reason: reason.trim() || undefined,
      isRecurring,
    };

    // Add time if partial day
    if (isPartialDay && startTime && endTime) {
      data.startTime = startTime;
      data.endTime = endTime;
    }

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "İzni Düzenle" : "Yeni İzin Ekle"}
          </DialogTitle>
          <DialogDescription>
            {staffName} için izin/mola oluşturun
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Başlangıç Tarihi
                </Label>
                <Popover
                  open={isStartDatePopoverOpen}
                  onOpenChange={setIsStartDatePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {startDate ? (
                        format(new Date(startDate), "MMM dd, yyyy")
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate ? new Date(startDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(format(date, "yyyy-MM-dd"));
                          setIsStartDatePopoverOpen(false);
                          // If end date is before new start date, update it
                          if (endDate && new Date(endDate) < date) {
                            setEndDate(format(date, "yyyy-MM-dd"));
                          }
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Bitiş Tarihi
                </Label>
                <Popover
                  open={isEndDatePopoverOpen}
                  onOpenChange={setIsEndDatePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {endDate ? (
                        format(new Date(endDate), "MMM dd, yyyy")
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate ? new Date(endDate) : undefined}
                      disabled={(date) =>
                        startDate ? date < new Date(startDate) : false
                      }
                      onSelect={(date) => {
                        if (date) {
                          setEndDate(format(date, "yyyy-MM-dd"));
                          setIsEndDatePopoverOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Partial Day Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="partial-day" className="text-sm font-medium">
                  Kısmi Gün İzni
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sadece belirli saatler için izin
                </p>
              </div>
              <Switch
                id="partial-day"
                checked={isPartialDay}
                onCheckedChange={setIsPartialDay}
              />
            </div>

            {/* Time Range (if partial day) */}
            {isPartialDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="start-time"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Başlangıç Saati
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required={isPartialDay}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Bitiş Saati
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required={isPartialDay}
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Neden{" "}
                <span className="text-xs text-muted-foreground">
                  (Opsiyonel)
                </span>
              </Label>
              <Textarea
                id="reason"
                placeholder="İzin nedeni belirtin..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reason.length}/500
              </p>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="recurring" className="text-sm font-medium">
                  Tekrarlayan İzin
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bu izin her yıl tekrarlanacak
                </p>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Güncelleniyor..."
                  : "Ekleniyor..."
                : isEditing
                ? "Güncelle"
                : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
