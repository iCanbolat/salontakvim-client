/**
 * Working Hours Dialog Component
 * Manage staff member's weekly working schedule
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Clock } from "lucide-react";
import { staffService } from "@/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StaffMember, CreateWorkingHoursDto } from "@/types";

interface WorkingHoursDialogProps {
  storeId: number;
  staff: StaffMember;
  open: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function WorkingHoursDialog({
  storeId,
  staff,
  open,
  onClose,
}: WorkingHoursDialogProps) {
  const queryClient = useQueryClient();
  const [editingHours, setEditingHours] = useState<
    Record<number, CreateWorkingHoursDto>
  >({});

  // Fetch working hours
  const {
    data: workingHours,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["working-hours", storeId, staff.id],
    queryFn: () => staffService.getWorkingHours(storeId, staff.id),
    enabled: open,
  });

  // Initialize editing state when data loads
  useEffect(() => {
    if (workingHours) {
      const hoursMap: Record<number, CreateWorkingHoursDto> = {};
      workingHours.forEach((hour) => {
        hoursMap[hour.dayOfWeek] = {
          dayOfWeek: hour.dayOfWeek,
          startTime: hour.startTime,
          endTime: hour.endTime,
          isActive: hour.isActive,
        };
      });
      setEditingHours(hoursMap);
    }
  }, [workingHours]);

  // Create working hour mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateWorkingHoursDto) =>
      staffService.createWorkingHours(storeId, staff.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["working-hours", storeId, staff.id],
      });
      refetch();
    },
  });

  // Update working hour mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CreateWorkingHoursDto;
    }) => staffService.updateWorkingHours(storeId, staff.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["working-hours", storeId, staff.id],
      });
      refetch();
    },
  });

  // Delete working hour mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      staffService.deleteWorkingHours(storeId, staff.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["working-hours", storeId, staff.id],
      });
      refetch();
    },
  });

  const handleToggleDay = (dayOfWeek: number) => {
    const current = editingHours[dayOfWeek];
    if (current) {
      setEditingHours((prev) => ({
        ...prev,
        [dayOfWeek]: { ...current, isActive: !current.isActive },
      }));
    } else {
      setEditingHours((prev) => ({
        ...prev,
        [dayOfWeek]: {
          dayOfWeek,
          startTime: "09:00",
          endTime: "18:00",
          isActive: true,
        },
      }));
    }
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setEditingHours((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  const handleSaveDay = (dayOfWeek: number) => {
    const data = editingHours[dayOfWeek];
    if (!data) return;

    const existing = workingHours?.find((h) => h.dayOfWeek === dayOfWeek);
    if (existing) {
      updateMutation.mutate({ id: existing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteDay = (dayOfWeek: number) => {
    const existing = workingHours?.find((h) => h.dayOfWeek === dayOfWeek);
    if (
      existing &&
      confirm(`Remove ${DAYS_OF_WEEK[dayOfWeek].label} from schedule?`)
    ) {
      deleteMutation.mutate(existing.id);
      setEditingHours((prev) => {
        const newState = { ...prev };
        delete newState[dayOfWeek];
        return newState;
      });
    }
  };

  const handleCopyToAll = () => {
    if (Object.keys(editingHours).length === 0) return;

    const firstDay = Object.values(editingHours)[0];
    if (!firstDay) return;

    if (confirm("Copy this schedule to all days of the week?")) {
      const newHours: Record<number, CreateWorkingHoursDto> = {};
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
    const promises = Object.entries(editingHours).map(([dayOfWeek, data]) => {
      const existing = workingHours?.find(
        (h) => h.dayOfWeek === Number(dayOfWeek)
      );
      if (existing) {
        return updateMutation.mutateAsync({ id: existing.id, data });
      } else {
        return createMutation.mutateAsync(data);
      }
    });

    try {
      await Promise.all(promises);
      onClose();
    } catch (error) {
      // Error handled by mutations
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const hours = editingHours[day.value];
                  const hasChanges =
                    hours &&
                    JSON.stringify(hours) !==
                      JSON.stringify(
                        workingHours?.find((h) => h.dayOfWeek === day.value)
                      );

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
                        {/* Day Name & Toggle */}
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <Switch
                            checked={hours?.isActive || false}
                            onCheckedChange={() => handleToggleDay(day.value)}
                            disabled={isPending}
                          />
                          <div>
                            <Label className="font-semibold text-gray-900">
                              {day.label}
                            </Label>
                            {!hours?.isActive && (
                              <p className="text-xs text-gray-500">Closed</p>
                            )}
                          </div>
                        </div>

                        {/* Time Inputs */}
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
                                      e.target.value
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
                                      e.target.value
                                    )
                                  }
                                  className="pl-8"
                                  disabled={isPending}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
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

            {/* Quick Actions */}
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

            {/* Error Alert */}
            {(createMutation.isError ||
              updateMutation.isError ||
              deleteMutation.isError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to update working hours. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Actions */}
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
            disabled={isPending || isLoading}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save All Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
