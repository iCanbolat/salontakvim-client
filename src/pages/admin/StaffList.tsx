/**
 * Staff List Page
 * Displays staff members and invitations
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  AlertCircle,
  Users as UsersIcon,
  Calendar,
  Clock,
  Check,
  X,
} from "lucide-react";
import { usePagination } from "@/hooks";
import { storeService, staffService, breakService } from "@/services";
import type { StaffBreakStatus, StaffBreakWithStaff } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffCard } from "@/components/staff/StaffCard";
import { InvitationCard } from "@/components/staff/InvitationCard";
import { InviteStaffDialog } from "@/components/staff/InviteStaffDialog";
import { PaginationControls } from "@/components/common/PaginationControls";
import {
  PageView,
  TableView,
  type TableColumn,
} from "@/components/common/page-view";
import type { StaffMember } from "@/types";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

type TimeOffStatusFilter = "all" | StaffBreakStatus;

export function StaffList() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
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

  const {
    data: timeOffs,
    isLoading: timeOffsLoading,
    error: timeOffsError,
  } = useQuery({
    queryKey: ["store-breaks", store?.id, timeOffStatus],
    queryFn: () =>
      breakService.getStoreBreaks(
        store!.id,
        timeOffStatus === "all" ? undefined : timeOffStatus
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

  const isInitialLoading =
    (storeLoading || staffPending || invitationsLoading) && !staffMembers;

  const handleCloseInvite = () => {
    setIsInviteDialogOpen(false);
  };

  const pendingInvitations =
    invitations?.filter((inv) => inv.status === "pending") || [];

  // Pagination for staff members
  const {
    paginatedItems: paginatedStaff,
    currentPage: staffPage,
    totalPages: staffTotalPages,
    goToPage: goToStaffPage,
    startIndex: staffStartIndex,
    endIndex: staffEndIndex,
  } = usePagination({
    items: staffMembers || [],
    itemsPerPage: 12,
  });

  const staffTableColumns: TableColumn<StaffMember>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Staff",
        render: (staff) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {staff.fullName ||
                `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim() ||
                staff.email}
            </span>
            {staff.title && (
              <span className="text-sm text-muted-foreground line-clamp-1">
                {staff.title}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        render: (staff) => (
          <span className="text-sm">{staff.email || "-"}</span>
        ),
        hideOnMobile: true,
      },
      {
        key: "location",
        header: "Location",
        render: (staff) => (
          <span className="text-sm">{staff.locationName || "-"}</span>
        ),
        hideOnMobile: true,
        hideOnTablet: true,
      },
      {
        key: "visibility",
        header: "Visibility",
        render: (staff) => (
          <Badge variant="outline" className="text-xs">
            {staff.isVisible ? "Visible" : "Hidden"}
          </Badge>
        ),
        hideOnTablet: true,
      },
    ],
    []
  );

  const handleStaffPageChange = (page: number) => {
    goToStaffPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pagination for invitations
  const {
    paginatedItems: paginatedInvitations,
    currentPage: invitationsPage,
    totalPages: invitationsTotalPages,
    goToPage: goToInvitationsPage,
    canGoNext: canGoNextInvitations,
    canGoPrevious: canGoPreviousInvitations,
    startIndex: invitationsStartIndex,
    endIndex: invitationsEndIndex,
  } = usePagination({
    items: pendingInvitations,
    itemsPerPage: 12,
  });

  const handleInvitationsPageChange = (page: number) => {
    goToInvitationsPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const statusFilters: { value: TimeOffStatusFilter; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "declined", label: "Declined" },
    { value: "all", label: "All" },
  ];

  const statusLabels: Record<StaffBreakStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    declined: "Declined",
  };

  const statusBadgeClass: Record<StaffBreakStatus, string> = {
    pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
    approved: "bg-green-50 text-green-800 border-green-200",
    declined: "bg-red-50 text-red-800 border-red-200",
  };

  const formatDate = (dateStr: string) =>
    format(parseISO(dateStr), "d MMMM yyyy", { locale: tr });

  const formatDateRange = (timeOff: StaffBreakWithStaff) =>
    timeOff.startDate === timeOff.endDate
      ? formatDate(timeOff.startDate)
      : `${formatDate(timeOff.startDate)} - ${formatDate(timeOff.endDate)}`;

  const formatTimeRange = (timeOff: StaffBreakWithStaff) =>
    timeOff.startTime && timeOff.endTime
      ? `${timeOff.startTime.substring(0, 5)} - ${timeOff.endTime.substring(
          0,
          5
        )}`
      : "All day";

  const getStaffName = (timeOff: StaffBreakWithStaff) => {
    const parts = [timeOff.staffFirstName, timeOff.staffLastName].filter(
      Boolean
    );
    return parts.length ? parts.join(" ") : `Staff #${timeOff.staffId}`;
  };

  const handleStatusChange = (
    timeOff: StaffBreakWithStaff,
    status: StaffBreakStatus
  ) => {
    updateBreakStatus.mutate({
      breakId: timeOff.id,
      staffId: timeOff.staffId,
      status,
    });
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (staffError || invitationsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage your team members</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load staff data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  // Empty state messages based on search
  const emptyTitle = debouncedSearchTerm
    ? `No staff matching "${debouncedSearchTerm}"`
    : "No staff members yet";

  const emptyDescription = debouncedSearchTerm
    ? "Try adjusting your search query"
    : "Start by inviting your first team member";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row text-center sm:text-start items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">
            Manage your team members and invitations
          </p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="m-auto sm:m-0">
          <TabsTrigger value="staff">
            Staff Members ({staffMembers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="timeoffs">
            Time Off ({timeOffs?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff" className="space-y-4">
          <PageView<StaffMember>
            data={paginatedStaff}
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search staff"
            view={view}
            onViewChange={setView}
            gridMinColumnClassName="md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
            gridMinHeightClassName="min-h-[600px]"
            renderGridItem={(staff) => (
              <StaffCard key={staff.id} staff={staff} storeId={store.id} />
            )}
            renderTableView={(data) => (
              <TableView
                data={data}
                columns={staffTableColumns}
                getRowKey={(staff) => staff.id}
              />
            )}
            currentPage={staffTotalPages === 0 ? 1 : staffPage}
            totalPages={Math.max(staffTotalPages, 1)}
            onPageChange={handleStaffPageChange}
            startIndex={paginatedStaff.length === 0 ? 0 : staffStartIndex}
            endIndex={paginatedStaff.length === 0 ? 0 : staffEndIndex}
            totalItems={staffMembers?.length ?? 0}
            emptyIcon={
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto" />
            }
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyAction={
              !debouncedSearchTerm ? (
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Staff
                </Button>
              ) : undefined
            }
          />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations waiting to be accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length > 0 ? (
                <div
                  className={`flex flex-col ${
                    paginatedInvitations.length < 13 ? "" : "min-h-[600px]"
                  }`}
                >
                  <div className="space-y-3 pb-4">
                    {paginatedInvitations.map((invitation) => (
                      <InvitationCard
                        key={invitation.id}
                        invitation={invitation}
                        storeId={store.id}
                      />
                    ))}
                  </div>
                  <div className="mt-auto">
                    <PaginationControls
                      currentPage={invitationsPage}
                      totalPages={invitationsTotalPages}
                      onPageChange={handleInvitationsPageChange}
                      canGoPrevious={canGoPreviousInvitations}
                      canGoNext={canGoNextInvitations}
                      startIndex={invitationsStartIndex}
                      endIndex={invitationsEndIndex}
                      totalItems={pendingInvitations.length}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pending invitations
                  </h3>
                  <p className="text-gray-600">
                    All invitations have been accepted or expired
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Off Tab */}
        <TabsContent value="timeoffs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Time Off Requests</CardTitle>
                <CardDescription>
                  Review, approve, or decline staff time off
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={
                      timeOffStatus === filter.value ? "default" : "outline"
                    }
                    onClick={() => setTimeOffStatus(filter.value)}
                    disabled={timeOffsLoading}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeOffsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : timeOffsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load time off requests:{" "}
                    {(timeOffsError as Error).message}
                  </AlertDescription>
                </Alert>
              ) : timeOffs && timeOffs.length > 0 ? (
                <div className="space-y-3">
                  {timeOffs.map((timeOff) => (
                    <div
                      key={timeOff.id}
                      className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm md:flex-row md:items-start md:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">
                            {getStaffName(timeOff)}
                          </span>
                          {timeOff.staffTitle && (
                            <span className="text-gray-500">
                              • {timeOff.staffTitle}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={statusBadgeClass[timeOff.status]}
                          >
                            {statusLabels[timeOff.status]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateRange(timeOff)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeRange(timeOff)}</span>
                        </div>

                        {timeOff.reason && (
                          <div className="rounded bg-gray-50 p-2 text-sm text-gray-700">
                            {timeOff.reason}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <p className="text-xs text-gray-500">
                          Requested{" "}
                          {format(parseISO(timeOff.createdAt), "d MMM yyyy", {
                            locale: tr,
                          })}
                        </p>
                        {timeOff.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleStatusChange(timeOff, "approved")
                              }
                              disabled={updateBreakStatus.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(timeOff, "declined")
                              }
                              disabled={updateBreakStatus.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium mb-2">
                    No time off requests
                  </p>
                  <p className="text-gray-500 text-sm">
                    Staff submissions will appear here for approval
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <InviteStaffDialog
        storeId={store.id}
        open={isInviteDialogOpen}
        onClose={handleCloseInvite}
      />
    </div>
  );
}
