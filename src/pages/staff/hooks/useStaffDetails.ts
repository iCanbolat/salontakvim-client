import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { staffService, storeService, categoryService } from "@/services";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

export function useStaffDetails() {
  const { staffId } = useParams<{ staffId: string }>();
  const location = useLocation();
  const { setBreadcrumbLabel, clearBreadcrumbLabel } = useBreadcrumb();
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isServicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const isValidStaffId = !!staffId && staffId !== "0";

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  const staffQuery = useQuery({
    queryKey: ["staff-member", store?.id, staffId],
    queryFn: () => staffService.getStaffMember(store!.id, staffId!),
    enabled: Boolean(store?.id && isValidStaffId),
  });

  const staffServicesQuery = useQuery({
    queryKey: ["staff-services", store?.id, staffId],
    queryFn: () => staffService.getStaffServices(store!.id, staffId!),
    enabled: Boolean(store?.id && isValidStaffId),
  });

  const workingHoursQuery = useQuery({
    queryKey: ["working-hours", store?.id, staffId],
    queryFn: () => staffService.getWorkingHours(store!.id, staffId!),
    enabled: Boolean(store?.id && isValidStaffId),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", store?.id],
    queryFn: () => categoryService.getCategories(store!.id),
    enabled: Boolean(store?.id),
    staleTime: 1000 * 60 * 5,
  });

  const staff = staffQuery.data;
  const staffDisplayName =
    staff?.fullName?.trim() ||
    `${staff?.firstName ?? ""} ${staff?.lastName ?? ""}`.trim() ||
    staff?.email ||
    "Staff";

  useEffect(() => {
    if (!staff) {
      return () => {
        clearBreadcrumbLabel(location.pathname);
      };
    }

    setBreadcrumbLabel(location.pathname, staffDisplayName);

    return () => {
      // No-op - cleanup handled by BreadcrumbContext when path changes or unmounts usually
    };
  }, [
    staff,
    location.pathname,
    staffDisplayName,
    setBreadcrumbLabel,
    clearBreadcrumbLabel,
  ]);

  const isLoading =
    storeLoading ||
    staffQuery.isLoading ||
    staffServicesQuery.isLoading ||
    workingHoursQuery.isLoading;
  const error =
    staffQuery.error || staffServicesQuery.error || workingHoursQuery.error;

  return {
    state: {
      isProfileDialogOpen,
      isServicesDialogOpen,
      isScheduleDialogOpen,
      isLoading,
      error,
      isValidStaffId,
    },
    actions: {
      setProfileDialogOpen,
      setServicesDialogOpen,
      setScheduleDialogOpen,
    },
    data: {
      store,
      staff,
      staffServices: staffServicesQuery.data,
      workingHours: workingHoursQuery.data,
      categories: categoriesQuery.data,
      staffDisplayName,
    },
  };
}
