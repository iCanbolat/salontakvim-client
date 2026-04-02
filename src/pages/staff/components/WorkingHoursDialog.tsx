/**
 * Working Hours Dialog Component
 * Manage staff member's weekly working schedule
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { staffService } from "@/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  StaffMember,
  DayOfWeek,
  WorkingHourEntry,
  WorkingHours,
} from "@/types";
import { qk } from "@/lib/query-keys";

interface WorkingHoursDialogProps {
  storeId: string;
  staff: StaffMember;
  workingHours?: WorkingHours[];
  open: boolean;
  onClose: () => void;
}

type WorkingHoursFormValue = WorkingHourEntry & { isActive: boolean };

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const normalizeTime = (value: string) => {
  if (!value) {
    return "";
  }
  return value.length > 5 ? value.slice(0, 5) : value;
};

export function WorkingHoursDialog({
  storeId,
  staff,
  workingHours,
  open,
  onClose,
}: WorkingHoursDialogProps) {
  const queryClient = useQueryClient();
  const [editingHours, setEditingHours] = useState<
    Partial<Record<DayOfWeek, WorkingHoursFormValue>>
  >({});

  useEffect(() => {
    if (workingHours) {
      const hoursMap: Partial<Record<DayOfWeek, WorkingHoursFormValue>> = {};
      workingHours.forEach((hour) => {
        hoursMap[hour.dayOfWeek] = {
          dayOfWeek: hour.dayOfWeek,
          startTime: normalizeTime(hour.startTime),
          endTime: normalizeTime(hour.endTime),
          isActive: hour.isActive,
        };
      });
      setEditingHours(hoursMap);
    }
  }, [workingHours]);

  const bulkMutation = useMutation({
    mutationFn: async (schedule: WorkingHourEntry[]) =>
      staffService.bulkUpsertWorkingHours(storeId, staff.id, { schedule }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qk.staffDetails(storeId, staff.id),
      });
      toast.success("Schedule updated successfully");
    },
    onError: () => {
      toast.error("Failed to update working hours. Please try again.");
    },
  });

  const handleToggleDay = (dayOfWeek: DayOfWeek, checked: boolean) => {
    setEditingHours((prev) => {
      const current = prev[dayOfWeek];
      if (current) {
        return {
          ...prev,
          [dayOfWeek]: { ...current, isActive: checked },
        };
      }

      if (!checked) {
        return prev;
      }

      return {
        ...prev,
        [dayOfWeek]: {
          dayOfWeek,
          startTime: "09:00",
          endTime: "18:00",
          isActive: true,
        },
      };
    });
  };

  const handleTimeChange = (
    dayOfWeek: DayOfWeek,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setEditingHours((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const handleDeleteDay = (dayOfWeek: DayOfWeek) => {
    const dayLabel =
      DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label || dayOfWeek;
    if (confirm(`Remove ${dayLabel} from schedule?`)) {
      setEditingHours((prev) => {
        const newState = { ...prev };
        delete newState[dayOfWeek];
        return newState;
      });
    }
  };

  const handleCopyToAll = () => {
    if (Object.keys(editingHours).length === 0) return;

    const firstDay = Object.values(editingHours).find(
      (value): value is WorkingHoursFormValue => Boolean(value),
    );
    if (!firstDay) return;

    if (confirm("Copy this schedule to all days of the week?")) {
      const newHours: Partial<Record<DayOfWeek, WorkingHoursFormValue>> = {};
      DAYS_OF_WEEK.forEach((day) => {
        newHours[day.value] = {
          dayOfWeek: day.value,
          startTime: firstDay.startTime,
          endTime: firstDay.endTime,
          isActive: firstDay.isActive,
        };
      });
      setEditingHours(newHours);
    }
  };

  const handleSaveAll = async () => {
    // Build the full schedule from editing state
    const schedule: WorkingHourEntry[] = Object.entries(editingHours)
      .filter(
        (entry): entry is [DayOfWeek, WorkingHoursFormValue] =>
          Boolean(entry[1]) && entry[1].isActive,
      )
      .map(([, data]) => ({
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive,
      }));

    // Validate start < end for each entry
    for (const entry of schedule) {
      if (entry.startTime >= entry.endTime) {
        const dayLabel =
          DAYS_OF_WEEK.find((d) => d.value === entry.dayOfWeek)?.label ||
          entry.dayOfWeek;
        toast.error(`${dayLabel}: End time must be after start time`);
        return;
      }
    }

    try {
      await bulkMutation.mutateAsync(schedule);
      onClose();
    } catch {
      // error handled in mutation onError
    }
  };

  const isPending = bulkMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Working Hours - {staff.firstName} {staff.lastName}
          </DialogTitle>
          <DialogDescription>
            Set the weekly working schedule. Times should be in 24-hour format
            (HH:mm).
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {!workingHours ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const hours = editingHours[day.value];
                    const existing = workingHours?.find(
                      (h) => h.dayOfWeek === day.value,
                    );
                    const hasChanges =
                      hours &&
                      (!existing ||
                        hours.startTime !== normalizeTime(existing.startTime) ||
                        hours.endTime !== normalizeTime(existing.endTime) ||
                        hours.isActive !== existing.isActive);

                    return (
                      <div
                        key={day.value}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          hours?.isActive
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-[140px]">
                            <Switch
                              checked={Boolean(hours?.isActive)}
                              onCheckedChange={(checked) =>
                                handleToggleDay(day.value, checked)
                              }
                              disabled={isPending}
                            />
                            <div>
                              <Label className="font-semibold text-gray-900">
                                {day.label}
                              </Label>
                              {hours && !hours.isActive && (
                                <p className="text-xs text-gray-500">Closed</p>
                              )}
                            </div>
                          </div>

                          {hours?.isActive && (
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1">
                                <Label
                                  htmlFor={`start-${day.value}`}
                                  className="text-xs"
                                >
                                  Start
                                </Label>
                                <div className="relative mt-1">
                                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    id={`start-${day.value}`}
                                    type="time"
                                    value={hours.startTime}
                                    onChange={(e) =>
                                      handleTimeChange(
                                        day.value,
                                        "startTime",
                                        e.target.value,
                                      )
                                    }
                                    className="pl-8"
                                    disabled={isPending}
                                  />
                                </div>
                              </div>

                              <div className="flex-1">
                                <Label
                                  htmlFor={`end-${day.value}`}
                                  className="text-xs"
                                >
                                  End
                                </Label>
                                <div className="relative mt-1">
                                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    id={`end-${day.value}`}
                                    type="time"
                                    value={hours.endTime}
                                    onChange={(e) =>
                                      handleTimeChange(
                                        day.value,
                                        "endTime",
                                        e.target.value,
                                      )
                                    }
                                    className="pl-8"
                                    disabled={isPending}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {hasChanges && (
                              <Badge variant="default" className="shrink-0">
                                Modified
                              </Badge>
                            )}
                            {hours && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDay(day.value)}
                                disabled={isPending}
                                className="shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {Object.keys(editingHours).length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToAll}
                    disabled={isPending}
                  >
                    Copy to All Days
                  </Button>
                </div>
              )}

              {bulkMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to update working hours. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || !workingHours}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save All Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
