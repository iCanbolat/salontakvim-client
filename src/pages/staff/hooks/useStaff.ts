import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { storeService, staffService, breakService } from "@/services";
import { usePagination } from "@/hooks";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import type { StaffBreakStatus } from "@/types";

type TimeOffStatusFilter = "all" | StaffBreakStatus;

export function useStaff() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeOffStatus, setTimeOffStatus] =
    useState<TimeOffStatusFilter>("pending");
  const [view, setView] = useState<"grid" | "list">("grid");

  const queryClient = useQueryClient();
  const debouncedSearchTerm = useDebouncedSearch(searchTerm);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["staff", "invitations", "timeoffs"].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    const searchParam = searchParams.get("search") ?? "";
    setSearchTerm(searchParam);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("search", value);
    } else {
      next.delete("search");
    }
    setSearchParams(next, { replace: true });
  };

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch staff members
  const {
    data: staffMembers,
    isPending: staffPending,
    error: staffError,
  } = useQuery({
    queryKey: ["staff", store?.id, debouncedSearchTerm],
    queryFn: () =>
      staffService.getStaffMembers(store!.id, {
        includeHidden: true,
        search: debouncedSearchTerm || undefined,
      }),
    enabled: !!store?.id,
    placeholderData: keepPreviousData,
  });

  // Fetch invitations
  const {
    data: invitations,
    isLoading: invitationsLoading,
    error: invitationsError,
  } = useQuery({
    queryKey: ["staff-invitations", store?.id],
    queryFn: () => staffService.getInvitations(store!.id),
    enabled: !!store?.id,
  });

  // Fetch time-offs (breaks)
  const {
    data: timeOffs,
    isLoading: timeOffsLoading,
    error: timeOffsError,
  } = useQuery({
    queryKey: ["store-breaks", store?.id, timeOffStatus],
    queryFn: () =>
      breakService.getStoreBreaks(
        store!.id,
        timeOffStatus === "all" ? undefined : timeOffStatus,
      ),
    enabled: !!store?.id,
  });

  const updateBreakStatus = useMutation({
    mutationFn: ({
      breakId,
      staffId,
      status,
    }: {
      breakId: string;
      staffId: string;
      status: StaffBreakStatus;
    }) =>
      breakService.updateStaffBreak(store!.id, staffId, breakId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-breaks", store?.id] });
      toast.success("Time off updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update time off: " + error.message);
    },
  });

  const pendingInvitations =
    invitations?.filter((inv) => inv.status === "pending") || [];

  // Pagination for staff members
  const staffPagination = usePagination({
    items: staffMembers || [],
    itemsPerPage: 12,
  });

  // Pagination for invitations
  const invitationsPagination = usePagination({
    items: pendingInvitations,
    itemsPerPage: 12,
  });

  const isLoading =
    storeLoading || staffPending || invitationsLoading || timeOffsLoading;
  const error = staffError || invitationsError || timeOffsError;

  return {
    state: {
      activeTab,
      searchTerm,
      timeOffStatus,
      view,
      isInviteDialogOpen,
      isLoading,
      error,
    },
    actions: {
      setActiveTab: handleTabChange,
      setSearchTerm: handleSearchChange,
      setTimeOffStatus,
      setView,
      setIsInviteDialogOpen,
      updateBreakStatus: updateBreakStatus.mutate,
      handleCloseInvite: () => setIsInviteDialogOpen(false),
    },
    data: {
      store,
      staffMembers,
      invitations,
      pendingInvitations,
      timeOffs,
    },
    pagination: {
      staff: staffPagination,
      invitations: invitationsPagination,
    },
  };
}
