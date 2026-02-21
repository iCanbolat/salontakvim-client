import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { staffService } from "@/services";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { useCurrentStore } from "@/hooks";

export function useStaffDetails() {
  const { staffId } = useParams<{ staffId: string }>();
  const location = useLocation();
  const { setBreadcrumbLabel, clearBreadcrumbLabel } = useBreadcrumb();
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isServicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const isValidStaffId = !!staffId && staffId !== "0";

  const { store, isLoading: storeLoading } = useCurrentStore();

  const staffDetailsQuery = useQuery({
    queryKey: ["staff-details", store?.id, staffId],
    queryFn: () => staffService.getStaffMember(store!.id, staffId!),
    enabled: Boolean(store?.id && isValidStaffId),
  });

  const staff = staffDetailsQuery.data?.staff;
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

  const isLoading = storeLoading || staffDetailsQuery.isLoading;
  const error = staffDetailsQuery.error;

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
      staffServices: staffDetailsQuery.data?.services,
      workingHours: staffDetailsQuery.data?.workingHours,
      categories: staffDetailsQuery.data?.categories,
      staffDisplayName,
    },
  };
}
