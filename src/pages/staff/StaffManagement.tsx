import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageView, TableView } from "@/components/common/page-view";
import { PaginationControls } from "@/components/common/PaginationControls";
import { StaffCard, InvitationCard, InviteStaffDialog } from "./components";
import type {
  StaffMember,
  StaffBreakWithStaff,
  StaffBreakStatus,
} from "@/types";
import { useStaff } from "./hooks/useStaff";
import { getStaffTableColumns } from "./table-columns";

export function StaffManagement() {
  const { state, actions, data, pagination } = useStaff();
  const navigate = useNavigate();
  const {
    activeTab,
    searchTerm,
    timeOffStatus,
    isInviteDialogOpen,
    isLoading,
    error,
  } = state;

  const { store, staffMembers, pendingInvitations, timeOffs, timeOffsTotal } =
    data;
  const {
    staff: staffPagination,
    invitations: invitationsPagination,
    timeOffs: timeOffPagination,
  } = pagination;

  const staffTableColumns = useMemo(
    () =>
      getStaffTableColumns({
        onToggleVisibility: (id, isVisible) =>
          actions.toggleVisibility({ staffId: id, isVisible }),
        onDelete: (id) => actions.deleteStaff(id),
      }),
    [actions],
  );

  const statusFilters: { value: "all" | StaffBreakStatus; label: string }[] = [
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
          5,
        )}`
      : "All day";

  const getStaffName = (timeOff: StaffBreakWithStaff) => {
    const parts = [timeOff.staffFirstName, timeOff.staffLastName].filter(
      Boolean,
    );
    return parts.length ? parts.join(" ") : `Staff #${timeOff.staffId}`;
  };

  if (isLoading && !staffMembers) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
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

  if (!store) return null;

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
        <Button onClick={() => actions.setIsInviteDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={actions.setActiveTab}
        className="space-y-4"
      >
        <TabsList className="m-auto sm:m-0">
          <TabsTrigger value="staff">
            Staff Members ({staffMembers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="timeoffs">Time Off ({timeOffsTotal})</TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff" className="space-y-4">
          <PageView<StaffMember>
            data={staffPagination.paginatedItems}
            viewKey="staff"
            searchValue={searchTerm}
            onSearchChange={actions.setSearchTerm}
            searchPlaceholder="Search staff"
            gridMinColumnWidth={300}
            gridMinHeight={600}
            renderGridItem={(staff) => (
              <StaffCard key={staff.id} staff={staff} storeId={store.id} />
            )}
            renderTableView={(data) => (
              <TableView
                data={data}
                columns={staffTableColumns}
                getRowKey={(staff) => staff.id}
                onRowClick={(staff) => navigate(`/staff/${staff.id}`)}
              />
            )}
            currentPage={staffPagination.currentPage}
            totalPages={staffPagination.totalPages}
            onPageChange={staffPagination.goToPage}
            startIndex={staffPagination.startIndex}
            endIndex={staffPagination.endIndex}
            totalItems={staffMembers?.length ?? 0}
            emptyIcon={
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto" />
            }
            emptyTitle={
              searchTerm
                ? `No staff matching "${searchTerm}"`
                : "No staff members yet"
            }
            emptyDescription={
              searchTerm
                ? "Try adjusting your search query"
                : "Start by inviting your first team member"
            }
            emptyAction={
              !searchTerm ? (
                <Button onClick={() => actions.setIsInviteDialogOpen(true)}>
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
                    invitationsPagination.paginatedItems.length < 13
                      ? ""
                      : "min-h-[600px]"
                  }`}
                >
                  <div className="space-y-3 pb-4">
                    {invitationsPagination.paginatedItems.map((invitation) => (
                      <InvitationCard
                        key={invitation.id}
                        invitation={invitation}
                        storeId={store.id}
                      />
                    ))}
                  </div>
                  <div className="mt-auto">
                    <PaginationControls
                      currentPage={invitationsPagination.currentPage}
                      totalPages={invitationsPagination.totalPages}
                      onPageChange={invitationsPagination.goToPage}
                      canGoPrevious={invitationsPagination.canGoPrevious}
                      canGoNext={invitationsPagination.canGoNext}
                      startIndex={invitationsPagination.startIndex}
                      endIndex={invitationsPagination.endIndex}
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
                    onClick={() => actions.setTimeOffStatus(filter.value)}
                    disabled={isLoading}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && !timeOffs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : timeOffs && timeOffs.length > 0 ? (
                <div
                  className={`flex flex-col ${
                    timeOffs.length < 13 ? "" : "min-h-[600px]"
                  }`}
                >
                  <div className="space-y-3 pb-4">
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
                                  actions.updateBreakStatus({
                                    breakId: timeOff.id,
                                    staffId: timeOff.staffId,
                                    status: "approved",
                                  })
                                }
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  actions.updateBreakStatus({
                                    breakId: timeOff.id,
                                    staffId: timeOff.staffId,
                                    status: "declined",
                                  })
                                }
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
                  <div className="mt-auto">
                    <PaginationControls
                      currentPage={timeOffPagination.currentPage}
                      totalPages={timeOffPagination.totalPages}
                      onPageChange={timeOffPagination.goToPage}
                      canGoPrevious={timeOffPagination.canGoPrevious}
                      canGoNext={timeOffPagination.canGoNext}
                      startIndex={timeOffPagination.startIndex}
                      endIndex={timeOffPagination.endIndex}
                      totalItems={timeOffsTotal}
                    />
                  </div>
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
        onClose={actions.handleCloseInvite}
      />
    </div>
  );
}
