import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { staffService, breakService } from "@/services";
import { usePagination, useCurrentStore } from "@/hooks";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import type { StaffBreakStatus } from "@/types";
import { useAuth, useNotifications } from "@/contexts";

type TimeOffStatusFilter = "all" | StaffBreakStatus;

export function useStaff() {
  const { user } = useAuth();
  const { latestNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeOffStatus, setTimeOffStatus] =
    useState<TimeOffStatusFilter>("pending");
  const [timeOffPage, setTimeOffPage] = useState(1);

  const queryClient = useQueryClient();
  const debouncedSearchTerm = useDebouncedSearch(searchTerm);
  const timeOffPageSize = 5;

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

  useEffect(() => {
    setTimeOffPage(1);
  }, [timeOffStatus]);

  const { store, isLoading: storeLoading } = useCurrentStore();

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
    staleTime: 0,
    refetchOnMount: true,
  });

  const filteredStaffMembers = staffMembers?.filter(
    (member) => member.userId !== user?.id,
  );

  // Fetch invitations
  const {
    data: invitations,
    isLoading: invitationsLoading,
    error: invitationsError,
  } = useQuery({
    queryKey: ["staff-invitations", store?.id],
    queryFn: () => staffService.getInvitations(store!.id),
    enabled: !!store?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch time-offs (breaks)
  const {
    data: timeOffs,
    isLoading: timeOffsLoading,
    error: timeOffsError,
  } = useQuery({
    queryKey: [
      "store-breaks",
      store?.id,
      timeOffStatus,
      timeOffPage,
      timeOffPageSize,
    ],
    queryFn: () =>
      breakService.getStoreBreaks(
        store!.id,
        timeOffStatus === "all" ? undefined : timeOffStatus,
        { page: timeOffPage, limit: timeOffPageSize },
      ),
    enabled: !!store?.id,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Real-time invalidation for time off via notifications
  useEffect(() => {
    if (!store?.id || !latestNotification) {
      return;
    }

    const isSameStore = latestNotification.storeId === store.id;
    const isTimeOff = latestNotification.type === "staff_time_off";

    if (isSameStore && isTimeOff) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "store-breaks" && key[1] === store.id;
        },
      });
    }
  }, [
    latestNotification?.id,
    latestNotification?.type,
    latestNotification?.storeId,
    store?.id,
    queryClient,
  ]);

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
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "store-breaks" && key[1] === store?.id;
        },
      });
      toast.success("Time off updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update time off: " + error.message);
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: ({
      staffId,
      isVisible,
    }: {
      staffId: string;
      isVisible: boolean;
    }) => staffService.updateStaffProfile(store!.id, staffId, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", store?.id] });
      toast.success("Staff visibility updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update staff visibility: " + error.message);
    },
  });

  const deleteStaff = useMutation({
    mutationFn: (staffId: string) =>
      staffService.deleteStaffMember(store!.id, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", store?.id] });
      toast.success("Staff member removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove staff: " + error.message);
    },
  });

  const pendingInvitations =
    invitations?.filter((inv) => inv.status === "pending") || [];

  // Pagination for staff members
  const staffPagination = usePagination({
    items: filteredStaffMembers || [],
    itemsPerPage: 12,
  });

  // Pagination for invitations
  const invitationsPagination = usePagination({
    items: pendingInvitations,
    itemsPerPage: 12,
  });

  const timeOffPagination = usePagination({
    items: timeOffs?.data ?? [],
    itemsPerPage: timeOffs?.limit ?? timeOffPageSize,
    totalItems: timeOffs?.total ?? 0,
    disableSlice: true,
    currentPage: timeOffPage,
    onPageChange: setTimeOffPage,
  });

  const isLoading =
    storeLoading || staffPending || invitationsLoading || timeOffsLoading;
  const error = staffError || invitationsError || timeOffsError;

  return {
    state: {
      activeTab,
      searchTerm,
      timeOffStatus,
      isInviteDialogOpen,
      isLoading,
      error,
    },
    actions: {
      setActiveTab: handleTabChange,
      setSearchTerm: handleSearchChange,
      setTimeOffStatus,
      setIsInviteDialogOpen,
      updateBreakStatus: updateBreakStatus.mutate,
      toggleVisibility: toggleVisibility.mutate,
      deleteStaff: deleteStaff.mutate,
      handleCloseInvite: () => setIsInviteDialogOpen(false),
    },
    data: {
      store,
      staffMembers: filteredStaffMembers,
      invitations,
      pendingInvitations,
      timeOffs: timeOffs?.data ?? [],
      timeOffsTotal: timeOffs?.total ?? 0,
    },
    pagination: {
      staff: staffPagination,
      invitations: invitationsPagination,
      timeOffs: timeOffPagination,
    },
  };
}
