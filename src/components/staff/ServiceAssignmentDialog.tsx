/**
 * Service Assignment Dialog Component
 * Allows admins to assign/remove services for staff members
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { staffService, serviceService } from "@/services";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { StaffMember, Service } from "@/types";

interface ServiceAssignmentDialogProps {
  storeId: number;
  staff: StaffMember;
  open: boolean;
  onClose: () => void;
}

export function ServiceAssignmentDialog({
  storeId,
  staff,
  open,
  onClose,
}: ServiceAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // Fetch all services
  const { data: allServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["services", storeId],
    queryFn: () => serviceService.getServices(storeId),
    enabled: open,
  });

  // Fetch staff's assigned services
  const {
    data: staffServices,
    isLoading: staffServicesLoading,
    refetch: refetchStaffServices,
  } = useQuery({
    queryKey: ["staff-services", storeId, staff.id],
    queryFn: () => staffService.getStaffServices(storeId, staff.id),
    enabled: open,
  });

  // Initialize selected services when data loads
  useEffect(() => {
    if (staffServices) {
      setSelectedServiceIds(staffServices.map((s) => s.id));
    }
  }, [staffServices]);

  // Assign services mutation
  const assignServicesMutation = useMutation({
    mutationFn: async (serviceIds: number[]) =>
      staffService.assignServices(storeId, staff.id, { serviceIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff-services", storeId, staff.id],
      });
      queryClient.invalidateQueries({ queryKey: ["staff", storeId] });
      refetchStaffServices();
    },
  });

  const handleToggleService = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = () => {
    assignServicesMutation.mutate(selectedServiceIds);
  };

  const handleClose = () => {
    if (!assignServicesMutation.isPending) {
      // Reset to original state
      if (staffServices) {
        setSelectedServiceIds(staffServices.map((s) => s.id));
      }
      assignServicesMutation.reset();
      onClose();
    }
  };

  const isLoading = servicesLoading || staffServicesLoading;
  const hasChanges =
    JSON.stringify([...selectedServiceIds].sort()) !==
    JSON.stringify([...(staffServices?.map((s) => s.id) || [])].sort());

  // Group services by category
  const servicesByCategory = allServices?.reduce((acc, service) => {
    const categoryId = service.categoryId || 0;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(service);
    return acc;
  }, {} as Record<number, Service[]>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Assign Services - {staff.firstName} {staff.lastName}
          </DialogTitle>
          <DialogDescription>
            Select which services this staff member can provide. They will only
            appear in the booking widget for these services.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Service Selection */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {allServices && allServices.length > 0 ? (
                  Object.entries(servicesByCategory || {}).map(
                    ([categoryId, services]) => (
                      <div key={categoryId} className="space-y-2">
                        {/* Category Header */}
                        {categoryId !== "0" && services.length > 0 && (
                          <h3 className="font-semibold text-sm text-gray-700">
                            Category {categoryId}
                          </h3>
                        )}

                        {/* Services */}
                        <div className="space-y-2">
                          {services.map((service) => {
                            const isSelected = selectedServiceIds.includes(
                              service.id
                            );
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => handleToggleService(service.id)}
                                className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                }`}
                                disabled={assignServicesMutation.isPending}
                              >
                                {/* Checkbox Icon */}
                                <div className="shrink-0 mt-0.5">
                                  {isSelected ? (
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>

                                {/* Service Info */}
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">
                                      {service.name}
                                    </p>
                                    {service.color && (
                                      <div
                                        className="w-3 h-3 rounded-full border border-gray-300"
                                        style={{
                                          backgroundColor: service.color,
                                        }}
                                      />
                                    )}
                                  </div>
                                  {service.description && (
                                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">
                                      {service.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {service.duration} min
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      ${service.price}
                                    </Badge>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      No services available. Create services first.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Selection Summary */}
            {allServices && allServices.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-gray-600">
                  {selectedServiceIds.length} of {allServices.length} services
                  selected
                </p>
                {hasChanges && <Badge variant="default">Unsaved changes</Badge>}
              </div>
            )}

            {/* Error Alert */}
            {assignServicesMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to assign services. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {assignServicesMutation.isSuccess && (
              <Alert>
                <AlertDescription>
                  Services assigned successfully!
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
            onClick={handleClose}
            disabled={assignServicesMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              !hasChanges || assignServicesMutation.isPending || isLoading
            }
          >
            {assignServicesMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
