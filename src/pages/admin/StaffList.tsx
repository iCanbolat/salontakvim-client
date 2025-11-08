/**
 * Staff List Page
 * Displays staff members and invitations
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Loader2, AlertCircle, Users as UsersIcon } from "lucide-react";
import { useRequireRole } from "@/hooks";
import { storeService, staffService } from "@/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffCard } from "@/components/staff/StaffCard";
import { InvitationCard } from "@/components/staff/InvitationCard";
import { InviteStaffDialog } from "@/components/staff/InviteStaffDialog";
import { StaffProfileDialog } from "@/components/staff/StaffProfileDialog";
import { ServiceAssignmentDialog } from "@/components/staff/ServiceAssignmentDialog";
import { WorkingHoursDialog } from "@/components/staff/WorkingHoursDialog";
import { TimeOffList } from "@/components/staff/TimeOffList";
import type { StaffMember } from "@/types";

export function StaffList() {
  useRequireRole("admin");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [assigningServicesStaff, setAssigningServicesStaff] =
    useState<StaffMember | null>(null);
  const [managingScheduleStaff, setManagingScheduleStaff] =
    useState<StaffMember | null>(null);
  const [managingTimeOffStaff, setManagingTimeOffStaff] =
    useState<StaffMember | null>(null);

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

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
  };

  const handleAssignServices = (staff: StaffMember) => {
    setAssigningServicesStaff(staff);
  };

  const handleManageSchedule = (staff: StaffMember) => {
    setManagingScheduleStaff(staff);
  };

  const handleManageTimeOff = (staff: StaffMember) => {
    setManagingTimeOffStaff(staff);
  };

  const handleCloseDialog = () => {
    setIsInviteDialogOpen(false);
    setEditingStaff(null);
    setAssigningServicesStaff(null);
    setManagingScheduleStaff(null);
  };

  const pendingInvitations =
    invitations?.filter((inv) => inv.status === "pending") || [];

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffMembers.map((staff) => (
                    <StaffCard
                      key={staff.id}
                      staff={staff}
                      storeId={store.id}
                      onEdit={handleEdit}
                      onAssignServices={handleAssignServices}
                      onManageSchedule={handleManageSchedule}
                      onManageTimeOff={handleManageTimeOff}
                    />
                  ))}
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
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      storeId={store.id}
                    />
                  ))}
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
        onClose={handleCloseDialog}
      />

      {/* Edit Staff Profile Dialog */}
      {editingStaff && (
        <StaffProfileDialog
          storeId={store.id}
          staff={editingStaff}
          open={!!editingStaff}
          onClose={handleCloseDialog}
        />
      )}

      {/* Service Assignment Dialog */}
      {assigningServicesStaff && (
        <ServiceAssignmentDialog
          storeId={store.id}
          staff={assigningServicesStaff}
          open={!!assigningServicesStaff}
          onClose={handleCloseDialog}
        />
      )}

      {/* Working Hours Dialog */}
      {managingScheduleStaff && (
        <WorkingHoursDialog
          storeId={store.id}
          staff={managingScheduleStaff}
          open={!!managingScheduleStaff}
          onClose={handleCloseDialog}
        />
      )}

      {/* Time Off Management Dialog */}
      {managingTimeOffStaff && (
        <Dialog
          open={!!managingTimeOffStaff}
          onOpenChange={(open) => !open && setManagingTimeOffStaff(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                İzinler - {managingTimeOffStaff.firstName}{" "}
                {managingTimeOffStaff.lastName}
              </DialogTitle>
            </DialogHeader>
            <TimeOffList
              storeId={store.id}
              staffId={managingTimeOffStaff.id}
              staffName={`${managingTimeOffStaff.firstName} ${managingTimeOffStaff.lastName}`}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
