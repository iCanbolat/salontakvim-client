/**
 * Staff List Page
 * Displays staff members and invitations
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2, AlertCircle, Users as UsersIcon } from "lucide-react";
import { usePagination } from "@/hooks";
import { storeService, staffService } from "@/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffCard } from "@/components/staff/StaffCard";
import { InvitationCard } from "@/components/staff/InvitationCard";
import { InviteStaffDialog } from "@/components/staff/InviteStaffDialog";
import { PaginationControls } from "@/components/ui/PaginationControls";

export function StaffList() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Fetch user's store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: () => storeService.getMyStore(),
  });

  // Fetch staff members
  const {
    data: staffMembers,
    isLoading: staffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ["staff", store?.id],
    queryFn: () => staffService.getStaffMembers(store!.id, true),
    enabled: !!store?.id,
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

  const isLoading = storeLoading || staffLoading || invitationsLoading;

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
    canGoNext: canGoNextStaff,
    canGoPrevious: canGoPreviousStaff,
    startIndex: staffStartIndex,
    endIndex: staffEndIndex,
  } = usePagination({
    items: staffMembers || [],
    itemsPerPage: 12,
  });

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

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
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
      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff">
            Staff Members ({staffMembers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Active staff members in your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffMembers && staffMembers.length > 0 ? (
                <div
                  className={`flex flex-col ${
                    staffTotalPages > 1 ? "min-h-[600px]" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                    {paginatedStaff.map((staff) => (
                      <StaffCard
                        key={staff.id}
                        staff={staff}
                        storeId={store.id}
                      />
                    ))}
                  </div>
                  <div className="mt-auto">
                    <PaginationControls
                      currentPage={staffPage}
                      totalPages={staffTotalPages}
                      onPageChange={handleStaffPageChange}
                      canGoPrevious={canGoPreviousStaff}
                      canGoNext={canGoNextStaff}
                      startIndex={staffStartIndex}
                      endIndex={staffEndIndex}
                      totalItems={staffMembers.length}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No staff members yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start by inviting your first team member
                  </p>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Staff
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
